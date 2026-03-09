import { formatDate, getEnv, writeJson } from "./helpers";

interface StockDataNewsItem {
  uuid: string;
  title: string;
  description: string;
  published_at: string;
  url?: string;
  entities?: Array<{
    symbol?: string;
    name?: string;
    country?: string;
    type?: string;
  }>;
}

interface StockDataNewsResponse {
  error?: {
    code?: string;
    message?: string;
  };
  data?: StockDataNewsItem[];
}

export interface NormalizedNews {
  uuid: string;
  symbol: string;
  symbolName: string;
  title: string;
  description: string;
  publishedAt: string;
  sourceUrl: string;
}

function toPositiveInt(input: string | undefined, fallback: number): number {
  const parsed = Number(input ?? "");
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function isQuotaError(code?: string, message?: string): boolean {
  const haystack = `${code ?? ""} ${message ?? ""}`.toLowerCase();
  return haystack.includes("limit") || haystack.includes("quota") || haystack.includes("too many");
}

function normalizeHaystack(title: string, description: string): string {
  return `${title} ${description}`.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeEntityName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\u2019'".,()]/g, " ")
    .replace(
      /\b(inc|incorporated|corp|corporation|co|company|ltd|limited|plc|holdings?|group|sa|ag|nv|spa)\b/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function entityMatchesItem(entity: { symbol?: string; name?: string }, item: StockDataNewsItem): boolean {
  const symbol = entity.symbol?.trim();
  if (!symbol) {
    return false;
  }

  const haystack = normalizeHaystack(item.title, item.description || item.title);
  if (haystack.includes(symbol.toLowerCase())) {
    return true;
  }

  const name = entity.name?.trim();
  if (!name) {
    return false;
  }

  const normalizedName = normalizeEntityName(name);
  if (normalizedName.length < 4) {
    return false;
  }

  return haystack.includes(normalizedName);
}

function normalizeBatch(items: StockDataNewsItem[]): NormalizedNews[] {
  return items
    .flatMap((item) => {
      const entities = (item.entities ?? []).filter((entity) => {
        const hasSymbol = typeof entity.symbol === "string" && entity.symbol.trim().length > 0;
        if (!hasSymbol) {
          return false;
        }

        // Prefer equities by default, but keep anything when type is missing.
        if (!entity.type) {
          return entityMatchesItem(entity, item);
        }
        return entity.type === "equity" && entityMatchesItem(entity, item);
      });

      if (entities.length === 0) {
        return [];
      }

      return entities.map((entity) => ({
        uuid: item.uuid,
        symbol: entity.symbol!,
        symbolName: entity.name?.trim() || entity.symbol!,
        title: item.title,
        description: item.description || item.title,
        publishedAt: item.published_at,
        sourceUrl: item.url ?? "",
      }));
    })
    .filter((item) => Boolean(item.symbol));
}

async function fetchNews(): Promise<{ rows: NormalizedNews[]; requestsUsed: number }> {
  const apiKey = getEnv("STOCKDATA_API_KEY");
  const days = toPositiveInt(process.env.PIPELINE_LOOKBACK_DAYS, 7);
  const pageLimit = Math.min(100, toPositiveInt(process.env.PIPELINE_NEWS_LIMIT, 100));
  const requestBudget = toPositiveInt(process.env.PIPELINE_NEWS_REQUEST_BUDGET, 20);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const unique = new Map<string, NormalizedNews>();
  let requestsUsed = 0;

  for (let page = 1; page <= requestBudget; page += 1) {
    const endpoint = new URL("https://api.stockdata.org/v1/news/all");
    endpoint.searchParams.set("api_token", apiKey);
    endpoint.searchParams.set("language", "en");
    endpoint.searchParams.set("must_have_entities", "true");
    endpoint.searchParams.set("published_after", `${formatDate(startDate)}T00:00:00`);
    endpoint.searchParams.set("published_before", `${formatDate(endDate)}T23:59:59`);
    endpoint.searchParams.set("countries", process.env.PIPELINE_NEWS_COUNTRIES ?? "us");
    endpoint.searchParams.set("limit", String(pageLimit));
    endpoint.searchParams.set("page", String(page));

    const response = await fetch(endpoint);
    requestsUsed += 1;

    if (response.status === 429) {
      console.warn(`StockData news quota reached at page ${page}.`);
      break;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`StockData news API failed (${response.status}): ${errorText}`);
    }

    const payload = (await response.json()) as StockDataNewsResponse;
    if (payload.error?.message) {
      if (isQuotaError(payload.error.code, payload.error.message)) {
        console.warn(`StockData news quota reached: ${payload.error.message}`);
        break;
      }
      throw new Error(`StockData news API error: ${payload.error.message}`);
    }

    const batch = normalizeBatch(payload.data ?? []);
    if (batch.length === 0) {
      break;
    }

    let addedCount = 0;
    for (const item of batch) {
      const key = `${item.uuid}:${item.symbol}`;
      if (!unique.has(key)) {
        unique.set(key, item);
        addedCount += 1;
      }
    }

    // When pagination is unsupported and we keep seeing the same page, stop early.
    if (addedCount === 0) {
      break;
    }
  }

  return {
    rows: Array.from(unique.values()),
    requestsUsed,
  };
}

async function main() {
  const { rows, requestsUsed } = await fetchNews();
  await writeJson("news.json", rows);

  const symbols = new Set(rows.map((item) => item.symbol));
  console.log(
    `Fetched ${rows.length} news records across ${symbols.size} symbols using ${requestsUsed} StockData requests.`
  );
}

main().catch((error) => {
  console.error("fetch-news failed:", error);
  process.exitCode = 1;
});
