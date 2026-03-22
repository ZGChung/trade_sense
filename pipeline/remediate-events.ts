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
const MINIMAX_MODEL =
  process.env.PIPELINE_MINIMAX_MODEL?.trim() || process.env.MINIMAX_MODEL?.trim() || "MiniMax-M2.5";
const MINIMAX_OPENAI_BASE_URL = (
  process.env.PIPELINE_MINIMAX_BASE_URL?.trim() ||
  process.env.MINIMAX_BASE_URL?.trim() ||
  "https://api.minimax.io/v1"
).replace(/\/+$/, "");
const MINIMAX_ANTHROPIC_BASE_URL = (
  process.env.PIPELINE_MINIMAX_ANTHROPIC_BASE_URL?.trim() ||
  process.env.MINIMAX_ANTHROPIC_BASE_URL?.trim() ||
  "https://api.minimax.io/anthropic"
).replace(/\/+$/, "");
const MINIMAX_ANTHROPIC_FALLBACK_BASE_URL = ((): string => {
  if (MINIMAX_ANTHROPIC_BASE_URL.includes("minimaxi.com")) {
    return "https://api.minimax.io/anthropic";
  }
  return "https://api.minimaxi.com/anthropic";
})();
const MAX_GROUPS = Math.max(1, Number(process.env.PIPELINE_REMEDIATE_MAX_GROUPS ?? "10000"));
const TARGET_SYMBOLS = new Set(
  (process.env.PIPELINE_REMEDIATE_SYMBOLS ?? process.env.PIPELINE_REMEDIATE_SYMBOL ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean)
);
const HTTP_TIMEOUT_MS = Math.max(5_000, Number(process.env.PIPELINE_HTTP_TIMEOUT_MS ?? "15000"));
const VERBOSE = String(process.env.PIPELINE_VERBOSE ?? "").toLowerCase() === "true";

type LLMProvider = "gemini" | "minimax";

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function getLLMConfig(): { provider: LLMProvider; apiKey: string } {
  const minimaxKey = process.env.MINIMAX_API_KEY?.trim() || "";
  if (minimaxKey) {
    return { provider: "minimax", apiKey: minimaxKey };
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim() || "";
  if (geminiKey) {
    return { provider: "gemini", apiKey: geminiKey };
  }

  throw new Error("Missing required env: MINIMAX_API_KEY or GEMINI_API_KEY");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function fetchWithTimeout(timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const nextInit = { ...(init ?? {}) } as RequestInit;
      if (nextInit.signal) {
        // If caller already passed a signal, race both.
        nextInit.signal = (AbortSignal as any).any
          ? (AbortSignal as any).any([nextInit.signal, controller.signal])
          : controller.signal;
      } else {
        nextInit.signal = controller.signal;
      }
      return await fetch(input, nextInit);
    } finally {
      clearTimeout(timer);
    }
  };
}

function hasEnglishLetters(input: string): boolean {
  return /[A-Za-z]/.test(input);
}

function canonicalDescription(input: string): string {
  return normalizeZhText(input)
    .toLowerCase()
    .replace(/[，。！？、：；,.!?;:]/g, "");
}

function withTickerPrefix(stockSymbol: string, description: string): string {
  const trimmed = description.trim();
  if (!trimmed) return trimmed;
  if (trimmed.toUpperCase().includes(stockSymbol.toUpperCase())) {
    return trimmed;
  }
  return `${stockSymbol}：${trimmed}`;
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
    return `${stockName}发布季度财报，营收利润均超预期引发股价大涨`;
  }
  if (/(acquir|merger|deal|buyout)/.test(lower)) {
    return `${stockName}传出重大并购消息，估值重估预期大幅提升`;
  }
  if (/(fda|approval|clinical|trial|drug|phase)/.test(lower)) {
    return `${stockName}核心产品获FDA批准上市，商业化前景彻底打开`;
  }
  if (/(partnership|collaboration|contract|agreement)/.test(lower)) {
    return `${stockName}签订重大战略合同，合同金额超市场预期`;
  }
  if (/(layoff|restructur|cost|efficienc)/.test(lower)) {
    return `${stockName}宣布大规模裁员，市场解读为盈利预警信号`;
  }
  if (/(regulat|investigation|lawsuit|compliance)/.test(lower)) {
    return `${stockName}遭监管调查或处罚，股价短期承压明显`;
  }

  return `${stockName}出现重大公司动态，投资者需重新评估其估值`;
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
    `${stockName}发布季度财报，营收和利润均超市场预期`,
    `${stockName}宣布重大战略合作，合同金额超预期引发关注`,
    `${stockName}收到FDA新药审批通过，商业化前景大幅提升`,
    `${stockName}因合规问题被监管机构调查，股价承压`,
    `${stockName}宣布大规模裁员以削减成本，市场解读为盈利预警`,
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
    `${stockName}发布季度财报，营收超预期但指引下调引发分歧`,
    `${stockName}宣布回购股票计划，管理层对估值修复充满信心`,
    `${stockName}核心产品获得监管批准，分析师大幅上调目标价`,
    `${stockName}因安全风险召回产品，经销商库存积压需消化`,
    `${stockName}竞争对手发布重磅新品，行业竞争格局面临洗牌`,
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

  return `你是金融训练题库编辑。请将以下事件处理成中文题目素材。\n\n股票：${stockName} (${stockSymbol})\n现有事件：\n${lines}\n\n⚠️ 重要要求：\n1) 只选择**对股价有明确影响**的事件（财报超预期、重大并购、FDA审批、裁员、监管处罚、产品发布、战略合作等）。\n2) 避免模糊无意义的泛泛而谈（如"公司参加行业会议"、\"感谢信\"等不直接影响股价的新闻）。\n3) 如果现有事件不足 ${targetCount} 条，补充的事件必须基于真实商业逻辑，有明确市场影响。\n4) 每条事件必须能让玩家判断"这个消息出来，股价大概会涨还是跌"。\n\n要求：\n1) 把现有事件翻译为简体中文（保留原本含义）；\n2) 如果数量不足 ${targetCount} 条，补充到 ${targetCount} 条；\n3) 补充事件必须像真实新闻语句，有实质市场影响；\n4) 每条事件必须包含股票代码 ${stockSymbol}，建议以"${stockSymbol}："开头；\n5) 每条事件 14~38 字；\n6) 日期用 YYYY-MM-DD；\n7) 事件描述必须彼此不同，不能是重复句子；\n8) 仅输出 JSON，不要解释，不要 Markdown。\n\n输出格式：\n{\n  "events": [\n    {"date":"YYYY-MM-DD","description_zh":"中文事件描述"}\n  ]\n}\n\n注意：events 必须恰好 ${targetCount} 条且描述不可重复。`;
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const response = await fetchWithTimeout(HTTP_TIMEOUT_MS)(
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

async function callMinimaxOpenAI(apiKey: string, prompt: string): Promise<string> {
  const response = await fetchWithTimeout(HTTP_TIMEOUT_MS)(`${MINIMAX_OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 700,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MINIMAX_HTTP_${response.status}:${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("MINIMAX_EMPTY_RESPONSE");
  }

  return text;
}

async function callMinimaxAnthropicWithBaseUrl(apiKey: string, prompt: string, baseUrl: string): Promise<string> {
  const response = await fetchWithTimeout(HTTP_TIMEOUT_MS)(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Anthropic-compatible auth headers (MiniMax supports this interface, including Coding Plan keys).
      "x-api-key": apiKey,
      Authorization: `Bearer ${apiKey}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      max_tokens: 700,
      temperature: 0.2,
      system: "You are a helpful assistant.",
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MINIMAX_HTTP_${response.status}:${errorText}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  const text =
    (data.content ?? [])
      .filter((block) => block && block.type === "text" && typeof block.text === "string")
      .map((block) => block.text!.trim())
      .filter(Boolean)
      .join("\n")
      .trim() || "";

  if (!text) {
    throw new Error("MINIMAX_EMPTY_RESPONSE");
  }

  return text;
}

async function callMinimaxAnthropic(apiKey: string, prompt: string): Promise<string> {
  try {
    return await callMinimaxAnthropicWithBaseUrl(apiKey, prompt, MINIMAX_ANTHROPIC_BASE_URL);
  } catch (error) {
    // Common mismatch: China keys require `api.minimaxi.com`, international keys require `api.minimax.io`.
    if (error instanceof Error && error.message.includes("MINIMAX_HTTP_401")) {
      return callMinimaxAnthropicWithBaseUrl(apiKey, prompt, MINIMAX_ANTHROPIC_FALLBACK_BASE_URL);
    }
    throw error;
  }
}

async function callMinimax(apiKey: string, prompt: string): Promise<string> {
  // Coding Plan keys (often `sk-cp-...`) are documented to work via the Anthropic-compatible interface.
  if (apiKey.trim().startsWith("sk-cp-")) {
    return callMinimaxAnthropic(apiKey, prompt);
  }

  try {
    return await callMinimaxOpenAI(apiKey, prompt);
  } catch (error) {
    // Fallback to Anthropic interface if OpenAI-compatible auth fails (common when key type differs).
    if (error instanceof Error && error.message.includes("MINIMAX_HTTP_401")) {
      return callMinimaxAnthropic(apiKey, prompt);
    }
    throw error;
  }
}

async function callLLM(config: { provider: LLMProvider; apiKey: string }, prompt: string): Promise<string> {
  if (config.provider === "minimax") {
    return callMinimax(config.apiKey, prompt);
  }
  return callGemini(config.apiKey, prompt);
}

function isRateLimitMessage(message: string): boolean {
  return message.startsWith("GEMINI_HTTP_429") || message.startsWith("MINIMAX_HTTP_429");
}

function isTransient5xxMessage(message: string): boolean {
  return message.startsWith("GEMINI_HTTP_5") || message.startsWith("MINIMAX_HTTP_5");
}

function parseGeminiEvents(rawText: string, targetCount: number, baseDate: string, stockSymbol: string): GeminiEvent[] {
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
      if (!descriptionZh.toUpperCase().includes(stockSymbol.toUpperCase())) {
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
    if (VERBOSE) {
      console.log(`Query auto groups: range=${from}..${from + PAGE_SIZE - 1}`);
    }
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
  llmConfig: { provider: LLMProvider; apiKey: string },
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
      console.log(`Calling LLM for ${group.stock_symbol}...`);
      const output = await callLLM(llmConfig, prompt);
      enriched = ensureUniqueGeminiEvents(
        parseGeminiEvents(
          output,
          targetCount,
          seed[0]?.date ?? new Date().toISOString().split("T")[0],
          group.stock_symbol
        ),
        targetCount,
        group.stock_name
      );
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const message = lastError.message;

      if (isRateLimitMessage(message)) {
        hitRateLimit = true;
        break;
      } else if (isTransient5xxMessage(message)) {
        await sleep(2500 * attempt);
      } else if (attempt < 5) {
        await sleep(1000 * attempt);
      }
    }
  }

  if (enriched.length < targetCount) {
    if (hitRateLimit || (lastError?.message && isRateLimitMessage(lastError.message))) {
      console.warn(
        `${llmConfig.provider} 429 for ${group.stock_symbol}, applying rule-based Chinese fallback.`
      );
      enriched = buildFallbackEvents(group.stock_name, seed, targetCount);
    } else {
      throw new Error(
        `LLM remediation failed for ${group.stock_symbol}: ${lastError?.message ?? "unknown"}`
      );
    }
  }

  enriched = enriched.map((item) => ({
    ...item,
    descriptionZh: withTickerPrefix(group.stock_symbol, item.descriptionZh),
  }));

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
  const llmConfig = getLLMConfig();

  const supabase: any = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: fetchWithTimeout(HTTP_TIMEOUT_MS),
    },
  });

  console.log(
    `Remediation start. provider=${llmConfig.provider} timeout_ms=${HTTP_TIMEOUT_MS} delay_ms=${GEMINI_DELAY_MS} max_groups=${MAX_GROUPS} symbols=${TARGET_SYMBOLS.size > 0 ? Array.from(TARGET_SYMBOLS).join(",") : "ALL"}`
  );

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
  let processed = 0;

  for (const group of targets) {
    try {
      processed += 1;
      if (VERBOSE || processed === 1 || processed % 5 === 0 || processed === targets.length) {
        console.log(`[${processed}/${targets.length}] Remediate ${group.stock_symbol} (${group.stock_name})`);
      }
      const result = await remediateGroup(supabase, llmConfig, group);
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
