import { formatDate, getEnv, readJson, writeJson } from "./helpers";
import type { NormalizedNews } from "./fetch-news";

interface StockDataPriceItem {
  symbol: string;
  date: string;
  close: number;
}

interface StockDataPriceResponse {
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

async function fetchSymbolPrices(symbol: string, startDate: string, endDate: string): Promise<NormalizedPriceMove | null> {
  const apiKey = getEnv("STOCKDATA_API_KEY");

  const endpoint = new URL("https://api.stockdata.org/v1/data/eod");
  endpoint.searchParams.set("api_token", apiKey);
  endpoint.searchParams.set("symbols", symbol);
  endpoint.searchParams.set("date_from", startDate);
  endpoint.searchParams.set("date_to", endDate);
  endpoint.searchParams.set("limit", "20");

  const response = await fetch(endpoint);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`StockData price API failed for ${symbol}: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as StockDataPriceResponse;
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

  const uniqueSymbols = Array.from(new Set(news.map((item) => item.symbol))).slice(0, 40);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 14);

  const from = formatDate(startDate);
  const to = formatDate(endDate);

  const results: NormalizedPriceMove[] = [];

  for (const symbol of uniqueSymbols) {
    try {
      const record = await fetchSymbolPrices(symbol, from, to);
      if (record) {
        results.push(record);
      }
    } catch (error) {
      console.warn(`Skip symbol ${symbol}:`, error instanceof Error ? error.message : String(error));
    }
  }

  await writeJson("prices.json", results);
  console.log(`Fetched ${results.length} symbol price windows.`);
}

main().catch((error) => {
  console.error("fetch-prices failed:", error);
  process.exitCode = 1;
});
