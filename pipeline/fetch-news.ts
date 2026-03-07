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

async function fetchNews(): Promise<NormalizedNews[]> {
  const apiKey = getEnv("STOCKDATA_API_KEY");
  const days = Number(process.env.PIPELINE_LOOKBACK_DAYS ?? "7");
  const limit = Number(process.env.PIPELINE_NEWS_LIMIT ?? "100");

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const endpoint = new URL("https://api.stockdata.org/v1/news/all");
  endpoint.searchParams.set("api_token", apiKey);
  endpoint.searchParams.set("language", "en");
  endpoint.searchParams.set("must_have_entities", "true");
  endpoint.searchParams.set("published_after", `${formatDate(startDate)}T00:00:00`);
  endpoint.searchParams.set("published_before", `${formatDate(endDate)}T23:59:59`);
  endpoint.searchParams.set("countries", process.env.PIPELINE_NEWS_COUNTRIES ?? "us");
  endpoint.searchParams.set("limit", String(limit));

  const response = await fetch(endpoint);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`StockData news API failed (${response.status}): ${errorText}`);
  }

  const payload = (await response.json()) as StockDataNewsResponse;
  if (payload.error?.message) {
    throw new Error(`StockData news API error: ${payload.error.message}`);
  }

  const normalized = (payload.data ?? [])
    .flatMap((item) => {
      const entities = (item.entities ?? []).filter((entity) => {
        const hasSymbol = typeof entity.symbol === "string" && entity.symbol.trim().length > 0;
        if (!hasSymbol) {
          return false;
        }

        // Prefer equities by default, but keep anything when type is missing.
        if (!entity.type) {
          return true;
        }
        return entity.type === "equity";
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

  const unique = new Map<string, NormalizedNews>();
  for (const item of normalized) {
    unique.set(`${item.uuid}:${item.symbol}`, item);
  }

  return Array.from(unique.values());
}

async function main() {
  const news = await fetchNews();
  await writeJson("news.json", news);

  const symbols = new Set(news.map((item) => item.symbol));
  console.log(`Fetched ${news.length} news records across ${symbols.size} symbols.`);
}

main().catch((error) => {
  console.error("fetch-news failed:", error);
  process.exitCode = 1;
});
