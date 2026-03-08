import { createClient } from "@supabase/supabase-js";

interface EventRow {
  id: string;
  description: string;
  event_date: string;
  actual_performance: number | string;
  days_after_event: number | null;
  source_url: string | null;
}

interface EventGroupRow {
  id: string;
  stock_symbol: string;
  stock_name: string;
  events: EventRow[] | null;
}

interface GeminiEvent {
  date: string;
  descriptionZh: string;
}

const MIN_EVENTS_PER_STOCK = 3;
const PAGE_SIZE = 200;
const GEMINI_MODEL = process.env.PIPELINE_GEMINI_MODEL?.trim() || "gemini-2.5-flash-lite";
const GEMINI_DELAY_MS = Math.max(0, Number(process.env.PIPELINE_GEMINI_DELAY_MS ?? "4200"));
const MAX_GROUPS = Math.max(1, Number(process.env.PIPELINE_REMEDIATE_MAX_GROUPS ?? "10000"));
const TARGET_SYMBOLS = new Set(
  (process.env.PIPELINE_REMEDIATE_SYMBOLS ?? process.env.PIPELINE_REMEDIATE_SYMBOL ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean)
);

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function hasEnglishLetters(input: string): boolean {
  return /[A-Za-z]/.test(input);
}

function canonicalDescription(input: string): string {
  return normalizeZhText(input)
    .toLowerCase()
    .replace(/[，。！？、：；,.!?;:]/g, "");
}

function splitUniqueEvents(events: EventRow[]): { unique: EventRow[]; duplicates: EventRow[] } {
  const unique: EventRow[] = [];
  const duplicates: EventRow[] = [];
  const seen = new Set<string>();

  for (const event of events) {
    const key = canonicalDescription(event.description);
    if (!key) {
      duplicates.push(event);
      continue;
    }

    if (seen.has(key)) {
      duplicates.push(event);
      continue;
    }

    seen.add(key);
    unique.push(event);
  }

  return { unique, duplicates };
}

function pickRuleBasedSummary(stockName: string, englishText: string): string {
  const lower = englishText.toLowerCase();

  if (/(earnings|revenue|guidance|eps|quarter|q[1-4])/.test(lower)) {
    return `${stockName}发布财报与业绩指引，市场重新评估盈利预期`;
  }
  if (/(acquir|merger|deal|buyout)/.test(lower)) {
    return `${stockName}传出并购交易相关进展，估值预期出现波动`;
  }
  if (/(fda|approval|clinical|trial|drug|phase)/.test(lower)) {
    return `${stockName}披露产品审批与临床进展，风险偏好明显变化`;
  }
  if (/(partnership|collaboration|contract|agreement)/.test(lower)) {
    return `${stockName}公布合作与合同动态，市场关注后续兑现能力`;
  }
  if (/(layoff|restructur|cost|efficienc)/.test(lower)) {
    return `${stockName}推进组织与成本优化，盈利弹性预期被上修`;
  }
  if (/(regulat|investigation|lawsuit|compliance)/.test(lower)) {
    return `${stockName}面临监管与合规消息扰动，短期情绪趋于谨慎`;
  }

  return `${stockName}出现重要公司消息，投资者关注其对业绩与估值的影响`;
}

function ensureUniqueGeminiEvents(
  items: GeminiEvent[],
  targetCount: number,
  stockName: string
): GeminiEvent[] {
  const unique: GeminiEvent[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const key = canonicalDescription(item.descriptionZh);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(item);
  }

  const fallbackTemplates = [
    `${stockName}公布阶段性经营更新，市场重新评估增长持续性`,
    `${stockName}披露关键业务指标变化，资金调整中短期仓位`,
    `${stockName}传出战略推进进展，投资者关注后续兑现节奏`,
    `${stockName}出现经营预期修正信号，估值分歧有所放大`,
    `${stockName}发布行业相关动态，市场风险偏好出现变化`,
  ];

  let idx = 0;
  while (unique.length < targetCount) {
    const baseDate = unique[unique.length - 1]?.date ?? new Date().toISOString().split("T")[0];
    const candidate = fallbackTemplates[idx % fallbackTemplates.length];
    idx += 1;

    const key = canonicalDescription(candidate);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push({
      date: shiftDate(baseDate, -1),
      descriptionZh: candidate,
    });
  }

  return unique.slice(0, targetCount);
}

function dedupeGeminiEvents(items: GeminiEvent[]): GeminiEvent[] {
  const unique: GeminiEvent[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const key = canonicalDescription(item.descriptionZh);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(item);
  }

  return unique;
}

function buildFallbackEvents(
  stockName: string,
  seed: Array<{ date: string; description: string }>,
  targetCount: number
): GeminiEvent[] {
  const fallback: GeminiEvent[] = seed.map((event) => ({
    date: event.date,
    descriptionZh: hasEnglishLetters(event.description)
      ? pickRuleBasedSummary(stockName, event.description)
      : normalizeZhText(event.description),
  }));

  const extraTemplates = [
    `${stockName}发布阶段性经营更新，资金对短期基本面进行重新定价`,
    `${stockName}相关业务预期出现调整，市场分歧推动波动放大`,
    `${stockName}披露关键运营信号，投资者关注后续兑现节奏`,
    `${stockName}释放经营改善迹象，市场开始重估未来盈利弹性`,
    `${stockName}出现战略执行新进展，交易资金关注兑现节奏变化`,
  ];

  let idx = 0;
  while (fallback.length < targetCount) {
    const baseDate = fallback[fallback.length - 1]?.date ?? new Date().toISOString().split("T")[0];
    fallback.push({
      date: shiftDate(baseDate, -1),
      descriptionZh: extraTemplates[idx % extraTemplates.length],
    });
    idx += 1;
  }

  return ensureUniqueGeminiEvents(fallback, targetCount, stockName);
}

function normalizeDate(input: string, fallback: string): string {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }
  return parsed.toISOString().split("T")[0];
}

function shiftDate(baseDate: string, days: number): string {
  const parsed = new Date(baseDate);
  if (Number.isNaN(parsed.getTime())) {
    return baseDate;
  }
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().split("T")[0];
}

function normalizeZhText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return text.slice(start, end + 1);
}

function buildPrompt(stockSymbol: string, stockName: string, existing: Array<{ date: string; description: string }>, targetCount: number): string {
  const lines = existing
    .map((event, index) => `${index + 1}. ${event.date} | ${event.description}`)
    .join("\n");

  return `你是金融训练题库编辑。请将以下事件处理成中文题目素材。\n\n股票：${stockName} (${stockSymbol})\n现有事件：\n${lines}\n\n要求：\n1) 把现有事件全部翻译为简体中文（保留原本含义）；\n2) 如果数量不足 ${targetCount} 条，补充到 ${targetCount} 条；\n3) 新增事件允许基于该公司业务进行仿写，但必须像真实新闻语句；\n4) 每条事件 14~38 字；\n5) 日期用 YYYY-MM-DD；\n6) 事件描述必须彼此不同，不能是重复句子。\n7) 仅输出 JSON，不要解释，不要 Markdown。\n\n输出格式：\n{\n  "events": [\n    {"date":"YYYY-MM-DD","description_zh":"中文事件描述"}\n  ]\n}\n\n注意：events 必须恰好 ${targetCount} 条且描述不可重复。`;
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 700,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GEMINI_HTTP_${response.status}:${errorText}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("GEMINI_EMPTY_RESPONSE");
  }

  return text;
}

function parseGeminiEvents(rawText: string, targetCount: number, baseDate: string): GeminiEvent[] {
  const jsonText = extractJsonObject(rawText) ?? rawText;
  const parsed = JSON.parse(jsonText) as { events?: Array<{ date?: string; description_zh?: string }> };

  if (!Array.isArray(parsed.events)) {
    throw new Error("GEMINI_BAD_JSON");
  }

  const normalized = parsed.events
    .map((item, index) => {
      if (!item || typeof item.description_zh !== "string") {
        return null;
      }

      const descriptionZh = normalizeZhText(item.description_zh);
      if (!descriptionZh) {
        return null;
      }

      const fallbackDate = shiftDate(baseDate, -index);
      const date = typeof item.date === "string" ? normalizeDate(item.date, fallbackDate) : fallbackDate;

      return { date, descriptionZh };
    })
    .filter((item): item is GeminiEvent => Boolean(item));

  const unique = dedupeGeminiEvents(normalized);
  if (unique.length < targetCount) {
    throw new Error(`GEMINI_TOO_FEW_EVENTS:${unique.length}`);
  }

  return unique.slice(0, targetCount);
}

async function fetchAllAutoGroups(supabase: any): Promise<EventGroupRow[]> {
  const all: EventGroupRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("event_groups")
      .select("id, stock_symbol, stock_name, events(id, description, event_date, actual_performance, days_after_event, source_url)")
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
  }

  return all;
}

async function remediateGroup(
  supabase: any,
  geminiApiKey: string,
  group: EventGroupRow
): Promise<{ updated: boolean; inserted: number }> {
  const events = [...(group.events ?? [])].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );

  if (events.length === 0) {
    return { updated: false, inserted: 0 };
  }

  const { unique: uniqueEvents, duplicates } = splitUniqueEvents(events);
  const needTranslation = uniqueEvents.some((event) => hasEnglishLetters(event.description));
  const needTopup = uniqueEvents.length < MIN_EVENTS_PER_STOCK;
  const needDedup = duplicates.length > 0;

  if (!needTranslation && !needTopup && !needDedup) {
    return { updated: false, inserted: 0 };
  }

  const targetCount = Math.max(MIN_EVENTS_PER_STOCK, uniqueEvents.length);
  const seed = uniqueEvents.map((event) => ({
    date: normalizeDate(event.event_date, new Date().toISOString().split("T")[0]),
    description: event.description,
  }));

  let enriched: GeminiEvent[] = [];
  let lastError: Error | null = null;
  let hitRateLimit = false;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const prompt = buildPrompt(group.stock_symbol, group.stock_name, seed, targetCount);
      const output = await callGemini(geminiApiKey, prompt);
      enriched = ensureUniqueGeminiEvents(
        parseGeminiEvents(output, targetCount, seed[0]?.date ?? new Date().toISOString().split("T")[0]),
        targetCount,
        group.stock_name
      );
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const message = lastError.message;

      if (message.startsWith("GEMINI_HTTP_429")) {
        hitRateLimit = true;
        break;
      } else if (message.startsWith("GEMINI_HTTP_5")) {
        await sleep(2500 * attempt);
      } else if (attempt < 5) {
        await sleep(1000 * attempt);
      }
    }
  }

  if (enriched.length < targetCount) {
    if (hitRateLimit || lastError?.message?.startsWith("GEMINI_HTTP_429")) {
      console.warn(
        `Gemini 429 for ${group.stock_symbol}, applying rule-based Chinese fallback.`
      );
      enriched = buildFallbackEvents(group.stock_name, seed, targetCount);
    } else {
      throw new Error(
        `Gemini remediation failed for ${group.stock_symbol}: ${lastError?.message ?? "unknown"}`
      );
    }
  }

  for (let index = 0; index < uniqueEvents.length; index += 1) {
    const row = uniqueEvents[index];
    const next = enriched[index];

    const { error } = await supabase
      .from("events")
      .update({
        description: next.descriptionZh,
        event_date: next.date,
      })
      .eq("id", row.id);

    if (error) {
      throw new Error(`Failed to update event ${row.id}: ${error.message}`);
    }
  }

  let inserted = 0;
  if (duplicates.length > 0) {
    const duplicateIds = duplicates.map((event) => event.id);
    const { error } = await supabase.from("events").delete().in("id", duplicateIds);
    if (error) {
      throw new Error(`Failed to delete duplicate events for ${group.stock_symbol}: ${error.message}`);
    }
  }

  if (targetCount > uniqueEvents.length) {
    const basePerfRaw = uniqueEvents[0].actual_performance;
    const basePerf = typeof basePerfRaw === "string" ? Number(basePerfRaw) : basePerfRaw;
    const safePerf = Number.isFinite(basePerf) ? Number(basePerf) : 0;
    const safeDaysAfter = uniqueEvents[0].days_after_event ?? 1;

    const extraRows = enriched.slice(uniqueEvents.length).map((event) => ({
      event_group_id: group.id,
      description: event.descriptionZh,
      event_date: event.date,
      stock_symbol: group.stock_symbol,
      stock_name: group.stock_name,
      actual_performance: safePerf,
      days_after_event: safeDaysAfter,
      source_url: null,
    }));

    const { error } = await supabase.from("events").insert(extraRows);
    if (error) {
      throw new Error(`Failed to insert extra events for ${group.stock_symbol}: ${error.message}`);
    }

    inserted = extraRows.length;
  }

  if (GEMINI_DELAY_MS > 0) {
    await sleep(GEMINI_DELAY_MS);
  }

  return { updated: true, inserted };
}

async function main() {
  const supabaseUrl = getEnv("SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const geminiApiKey = getEnv("GEMINI_API_KEY");

  const supabase: any = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const groups = await fetchAllAutoGroups(supabase);
  const targets: EventGroupRow[] = [];

  for (const group of groups) {
    if (TARGET_SYMBOLS.size > 0 && !TARGET_SYMBOLS.has(group.stock_symbol.toUpperCase())) {
      continue;
    }

    const events = (group.events ?? []).sort(
      (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );
    const { unique, duplicates } = splitUniqueEvents(events);
    const needTranslation = unique.some((event) => hasEnglishLetters(event.description));
    const needTopup = unique.length > 0 && unique.length < MIN_EVENTS_PER_STOCK;
    const needDedup = duplicates.length > 0;

    if (needTranslation || needTopup || needDedup) {
      targets.push(group);
    }
    if (targets.length >= MAX_GROUPS) {
      break;
    }
  }

  let updatedGroups = 0;
  let insertedEvents = 0;
  let failedGroups = 0;

  for (const group of targets) {
    try {
      const result = await remediateGroup(supabase, geminiApiKey, group);
      if (result.updated) {
        updatedGroups += 1;
        insertedEvents += result.inserted;
      }
    } catch (error) {
      failedGroups += 1;
      console.warn(
        `Remediation failed for ${group.stock_symbol}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  console.log(
    `Remediation finished. auto_groups=${groups.length}, target_groups=${targets.length}, updated_groups=${updatedGroups}, inserted_events=${insertedEvents}, failed_groups=${failedGroups}`
  );
}

main().catch((error) => {
  console.error("remediate-events failed:", error);
  process.exitCode = 1;
});
