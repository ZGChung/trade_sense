import { createClient } from "@supabase/supabase-js";
import { readJson, writeJson } from "./helpers";
import type { NormalizedNews } from "./fetch-news";
import type { NormalizedPriceMove } from "./fetch-prices";

interface GeneratedEvent {
  description: string;
  eventDate: string;
  stockSymbol: string;
  stockName: string;
  actualPerformance: number;
  daysAfterEvent: number;
  sourceUrl: string;
}

interface GeneratedEventGroup {
  stockSymbol: string;
  stockName: string;
  category: string;
  source: "auto";
  events: GeneratedEvent[];
}

function buildGeneratedEventGroups(
  news: NormalizedNews[],
  prices: NormalizedPriceMove[]
): GeneratedEventGroup[] {
  const priceMap = new Map(prices.map((price) => [price.symbol, price]));

  const groupedBySymbol = new Map<string, NormalizedNews[]>();
  for (const item of news) {
    if (!priceMap.has(item.symbol)) {
      continue;
    }

    const bucket = groupedBySymbol.get(item.symbol) ?? [];
    bucket.push(item);
    groupedBySymbol.set(item.symbol, bucket);
  }

  const result: GeneratedEventGroup[] = [];
  for (const [symbol, items] of groupedBySymbol.entries()) {
    const price = priceMap.get(symbol);
    if (!price) {
      continue;
    }

    const sortedNews = [...items].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const topNews = sortedNews.slice(0, 3);
    const events: GeneratedEvent[] = topNews.map((item) => ({
      description: item.title,
      eventDate: item.publishedAt.split("T")[0],
      stockSymbol: symbol,
      stockName: symbol,
      actualPerformance: price.performance,
      daysAfterEvent: 1,
      sourceUrl: item.sourceUrl,
    }));

    if (events.length === 0) {
      continue;
    }

    result.push({
      stockSymbol: symbol,
      stockName: symbol,
      category: "其他",
      source: "auto",
      events,
    });
  }

  return result;
}

async function pushToSupabase(groups: GeneratedEventGroup[]): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    console.log("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY missing, skip cloud write.");
    return;
  }

  const supabase = createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  for (const group of groups) {
    const { data: insertedGroup, error: groupError } = await supabase
      .from("event_groups")
      .insert({
        stock_symbol: group.stockSymbol,
        stock_name: group.stockName,
        category: group.category,
        source: group.source,
      })
      .select("id")
      .single();

    if (groupError || !insertedGroup) {
      console.warn(`Failed to insert event_group for ${group.stockSymbol}:`, groupError?.message);
      continue;
    }

    const eventRows = group.events.map((event) => ({
      event_group_id: insertedGroup.id,
      description: event.description,
      event_date: event.eventDate,
      stock_symbol: event.stockSymbol,
      stock_name: event.stockName,
      actual_performance: event.actualPerformance,
      days_after_event: event.daysAfterEvent,
      source_url: event.sourceUrl || null,
    }));

    const { error: eventError } = await supabase.from("events").insert(eventRows);
    if (eventError) {
      console.warn(`Failed to insert events for ${group.stockSymbol}:`, eventError.message);
    }
  }
}

async function main() {
  const news = await readJson<NormalizedNews[]>("news.json");
  const prices = await readJson<NormalizedPriceMove[]>("prices.json");

  const generated = buildGeneratedEventGroups(news, prices);
  await writeJson("generated-events.json", generated);

  await pushToSupabase(generated);

  console.log(`Generated ${generated.length} auto event groups.`);
}

main().catch((error) => {
  console.error("generate-events failed:", error);
  process.exitCode = 1;
});
