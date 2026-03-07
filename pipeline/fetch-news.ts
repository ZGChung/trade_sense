import { formatDate, getEnv, writeJson } from "./helpers";

interface StockDataNewsItem {
  title: string;
  description: string;
  published_at: string;
  symbols?: string[];
  source_url?: string;
}

interface StockDataNewsResponse {
  data?: StockDataNewsItem[];
}

export interface NormalizedNews {
  symbol: string;
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
  endpoint.searchParams.set("filter_entities", "true");
  endpoint.searchParams.set("date_from", formatDate(startDate));
  endpoint.searchParams.set("date_to", formatDate(endDate));
  endpoint.searchParams.set("limit", String(limit));

  const response = await fetch(endpoint);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`StockData news API failed (${response.status}): ${errorText}`);
  }

  const payload = (await response.json()) as StockDataNewsResponse;
  const normalized = (payload.data ?? [])
    .flatMap((item) => {
      if (!item.symbols || item.symbols.length === 0) {
        return [];
      }

      return item.symbols.map((symbol) => ({
        symbol,
        title: item.title,
        description: item.description || item.title,
        publishedAt: item.published_at,
        sourceUrl: item.source_url ?? "",
      }));
    })
    .filter((item) => Boolean(item.symbol));

  return normalized;
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
