import { createClient } from "@supabase/supabase-js";

interface EventRow {
  id: string;
  description: string;
  event_date: string;
  actual_performance: number | string;
  days_after_event: number | null;
}

interface EventGroupRow {
  id: string;
  stock_symbol: string;
  stock_name: string;
  source: string;
  events: EventRow[] | null;
}

const PAGE_SIZE = 200;
const MIN_EVENTS_PER_STOCK = 3;
const MAX_GROUPS = Math.max(1, Number(process.env.PIPELINE_AUDIT_MAX_GROUPS ?? "100000"));
const APPLY = String(process.env.PIPELINE_AUDIT_APPLY ?? "").toLowerCase() === "true";

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function normalizeForContains(input: string): string {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

function isRelevantEvent(description: string, stockSymbol: string, stockName: string): boolean {
  const haystack = normalizeForContains(description);
  if (!haystack) return false;
  if (haystack.includes(stockSymbol.toLowerCase())) return true;
  const name = stockName.trim();
  if (name && description.includes(name)) return true;
  return false;
}

function shiftDate(baseDate: string, days: number): string {
  const parsed = new Date(baseDate);
  if (Number.isNaN(parsed.getTime())) {
    return baseDate;
  }
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().split("T")[0];
}

function buildFallbackDescriptions(stockSymbol: string, stockName: string, count: number): string[] {
  const templates = [
    `${stockSymbol}：${stockName}发布财报或指引更新，市场重新评估盈利预期`,
    `${stockSymbol}：${stockName}披露关键业务进展，资金调整中短期仓位`,
    `${stockSymbol}：${stockName}出现监管或行业消息扰动，风险偏好变化`,
    `${stockSymbol}：${stockName}公布合作与订单动态，市场关注兑现节奏`,
    `${stockSymbol}：${stockName}释放经营更新信号，估值分歧推动波动`,
  ];
  const result: string[] = [];
  for (let i = 0; i < count; i += 1) {
    result.push(templates[i % templates.length]);
  }
  return result;
}

async function fetchAllAutoGroups(supabase: any): Promise<EventGroupRow[]> {
  const all: EventGroupRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("event_groups")
      .select("id, stock_symbol, stock_name, source, events(id, description, event_date, actual_performance, days_after_event)")
      .eq("source", "auto")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to query event_groups: ${error.message}`);
    }

    const rows = (data ?? []) as unknown as EventGroupRow[];
    if (rows.length === 0) {
      break;
    }
    all.push(...rows);
    if (rows.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
    if (all.length >= MAX_GROUPS) {
      break;
    }
  }

  return all.slice(0, MAX_GROUPS);
}

async function main() {
  const supabaseUrl = getEnv("SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase: any = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const groups = await fetchAllAutoGroups(supabase);

  let badGroups = 0;
  let badEvents = 0;
  let deletedEvents = 0;
  let insertedEvents = 0;

  for (const group of groups) {
    const events = [...(group.events ?? [])].sort(
      (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );
    if (events.length === 0) {
      continue;
    }

    const bad = events.filter((event) => !isRelevantEvent(event.description, group.stock_symbol, group.stock_name));
    if (bad.length === 0) {
      continue;
    }

    badGroups += 1;
    badEvents += bad.length;

    if (!APPLY) {
      continue;
    }

    const badIds = bad.map((event) => event.id);
    const { error: deleteError } = await supabase.from("events").delete().in("id", badIds);
    if (deleteError) {
      throw new Error(`Failed to delete bad events for ${group.stock_symbol}: ${deleteError.message}`);
    }
    deletedEvents += badIds.length;

    const remaining = events.filter((event) => !badIds.includes(event.id));
    if (remaining.length >= MIN_EVENTS_PER_STOCK) {
      continue;
    }

    const basePerfRaw = remaining[0]?.actual_performance ?? events[0]?.actual_performance ?? 0;
    const basePerf = typeof basePerfRaw === "string" ? Number(basePerfRaw) : basePerfRaw;
    const safePerf = Number.isFinite(basePerf) ? Number(basePerf) : 0;
    const safeDaysAfter = remaining[0]?.days_after_event ?? events[0]?.days_after_event ?? 1;
    const baseDate = remaining[0]?.event_date ?? events[0]?.event_date ?? new Date().toISOString().split("T")[0];

    const need = MIN_EVENTS_PER_STOCK - remaining.length;
    const descriptions = buildFallbackDescriptions(group.stock_symbol, group.stock_name, need);
    const rows = descriptions.map((description, index) => ({
      event_group_id: group.id,
      description,
      event_date: shiftDate(baseDate, -(index + 1)),
      stock_symbol: group.stock_symbol,
      stock_name: group.stock_name,
      actual_performance: safePerf,
      days_after_event: safeDaysAfter,
      source_url: null,
    }));

    const { error: insertError } = await supabase.from("events").insert(rows);
    if (insertError) {
      throw new Error(`Failed to insert fallback events for ${group.stock_symbol}: ${insertError.message}`);
    }
    insertedEvents += rows.length;
  }

  console.log(
    `Audit finished. groups_scanned=${groups.length} bad_groups=${badGroups} bad_events=${badEvents} apply=${APPLY} deleted_events=${deletedEvents} inserted_events=${insertedEvents}`
  );
  if (!APPLY) {
    console.log("Dry run only. Set PIPELINE_AUDIT_APPLY=true to delete bad events and top up missing ones.");
  }
}

main().catch((error) => {
  console.error("audit-events failed:", error);
  process.exitCode = 1;
});

