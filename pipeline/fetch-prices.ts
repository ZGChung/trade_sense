import { formatDate, getEnv, readJson, writeJson } from "./helpers";
import type { NormalizedNews } from "./fetch-news";

interface StockDataPriceItem {
  symbol: string;
  date: string;
  close: number;
}

interface StockDataPriceResponse {
  error?: {
    code?: string;
    message?: string;
  };
  data?: StockDataPriceItem[];
}

export interface NormalizedPriceMove {
  symbol: string;
  startDate: string;
  endDate: string;
  startClose: number;
  endClose: number;
  performance: number;
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

function buildSymbolPriority(news: NormalizedNews[]): string[] {
  const scoreBySymbol = new Map<string, number>();
  for (const item of news) {
    const current = scoreBySymbol.get(item.symbol) ?? 0;
    scoreBySymbol.set(item.symbol, current + 1);
  }

  return Array.from(scoreBySymbol.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([symbol]) => symbol);
}

async function fetchSymbolPrices(symbol: string, startDate: string, endDate: string): Promise<NormalizedPriceMove | null> {
  const apiKey = getEnv("STOCKDATA_API_KEY");

  const endpoint = new URL("https://api.stockdata.org/v1/data/eod");
  endpoint.searchParams.set("api_token", apiKey);
  endpoint.searchParams.set("symbols", symbol);
  endpoint.searchParams.set("date_from", startDate);
  endpoint.searchParams.set("date_to", endDate);
  endpoint.searchParams.set("limit", "30");

  const response = await fetch(endpoint);
  if (response.status === 429) {
    throw new Error("QUOTA_EXCEEDED");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`StockData price API failed for ${symbol}: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as StockDataPriceResponse;
  if (payload.error?.message) {
    if (isQuotaError(payload.error.code, payload.error.message)) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw new Error(`StockData price API error for ${symbol}: ${payload.error.message}`);
  }

  const rows = (payload.data ?? [])
    .filter((item) => Number.isFinite(item.close))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (rows.length < 2) {
    return null;
  }

  const first = rows[0];
  const last = rows[rows.length - 1];
  if (!first.close || !last.close) {
    return null;
  }

  const performance = (last.close - first.close) / first.close;
  return {
    symbol,
    startDate: first.date,
    endDate: last.date,
    startClose: first.close,
    endClose: last.close,
    performance,
  };
}

async function main() {
  const news = await readJson<NormalizedNews[]>("news.json");

  const uniqueSymbols = buildSymbolPriority(news);
  const requestBudget = toPositiveInt(process.env.PIPELINE_PRICE_REQUEST_BUDGET, 80);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 14);

  const from = formatDate(startDate);
  const to = formatDate(endDate);

  const results: NormalizedPriceMove[] = [];
  let requestsUsed = 0;

  for (const symbol of uniqueSymbols) {
    if (requestsUsed >= requestBudget) {
      break;
    }

    try {
      requestsUsed += 1;
      const record = await fetchSymbolPrices(symbol, from, to);
      if (record) {
        results.push(record);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("QUOTA_EXCEEDED")) {
        console.warn(`StockData price quota reached after ${requestsUsed} requests.`);
        break;
      }

      console.warn(`Skip symbol ${symbol}:`, message);
    }
  }

  await writeJson("prices.json", results);
  console.log(`Fetched ${results.length} symbol price windows using ${requestsUsed} StockData requests.`);
}

main().catch((error) => {
  console.error("fetch-prices failed:", error);
  process.exitCode = 1;
});
