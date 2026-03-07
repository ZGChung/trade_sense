import { createClient } from "@supabase/supabase-js";
import { getStockCategory, mockData } from "../web/src/models/mockData";

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

async function ensureEventGroup(
  supabase: ReturnType<typeof createClient>,
  stockSymbol: string,
  stockName: string,
  category: string
): Promise<string> {
  const { data: existingRows, error: selectError } = await supabase
    .from("event_groups")
    .select("id")
    .eq("stock_symbol", stockSymbol)
    .eq("source", "seed")
    .limit(1);

  if (selectError) {
    throw new Error(`Failed to query existing group for ${stockSymbol}: ${selectError.message}`);
  }

  const existing = existingRows?.[0];
  if (existing?.id) {
    return existing.id;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("event_groups")
    .insert({
      stock_symbol: stockSymbol,
      stock_name: stockName,
      category,
      source: "seed",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    throw new Error(`Failed to insert group for ${stockSymbol}: ${insertError?.message}`);
  }

  return inserted.id;
}

async function seed() {
  const supabaseUrl = getEnv("SUPABASE_URL");
  const serviceRole = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  let insertedEvents = 0;

  for (const group of mockData) {
    const category = group.category ?? getStockCategory(group.stockSymbol);
    const eventGroupId = await ensureEventGroup(
      supabase,
      group.stockSymbol,
      group.stockName,
      category
    );

    const { data: existingEvents, error: existingError } = await supabase
      .from("events")
      .select("description, event_date")
      .eq("event_group_id", eventGroupId);

    if (existingError) {
      throw new Error(`Failed to query events for ${group.stockSymbol}: ${existingError.message}`);
    }

    const existingKeys = new Set(
      (existingEvents ?? []).map((item) => `${item.description}::${item.event_date}`)
    );

    const rows = group.events
      .filter((event) => !existingKeys.has(`${event.description}::${event.date}`))
      .map((event) => ({
        event_group_id: eventGroupId,
        description: event.description,
        event_date: event.date,
        stock_symbol: event.stockSymbol,
        stock_name: event.stockName,
        actual_performance: event.actualPerformance,
        days_after_event: event.daysAfterEvent,
      }));

    if (rows.length === 0) {
      continue;
    }

    const { error: insertError } = await supabase.from("events").insert(rows);
    if (insertError) {
      throw new Error(`Failed to insert events for ${group.stockSymbol}: ${insertError.message}`);
    }

    insertedEvents += rows.length;
  }

  console.log(`Seed completed. Inserted ${insertedEvents} events from mockData.`);
}

seed().catch((error) => {
  console.error("seed failed:", error);
  process.exitCode = 1;
});
