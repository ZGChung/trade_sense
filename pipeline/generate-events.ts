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

interface SeedEvent {
  date: string;
  titleEn: string;
  sourceUrl: string;
}

interface GeminiEvent {
  date: string;
  descriptionZh: string;
}

const MIN_EVENTS_PER_STOCK = 3;
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

type LLMProvider = "gemini" | "minimax";

function getLLMConfig(): { provider: LLMProvider; apiKey: string } {
  const minimaxKey = process.env.MINIMAX_API_KEY?.trim() || "";
  if (minimaxKey) {
    return { provider: "minimax", apiKey: minimaxKey };
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim() || process.env.VITE_GEMINI_API_KEY?.trim() || "";
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

function toDateString(input: string, fallback: string): string {
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

function withTickerPrefix(symbol: string, description: string): string {
  const trimmed = description.trim();
  if (!trimmed) return trimmed;
  if (trimmed.toUpperCase().includes(symbol.toUpperCase())) {
    return trimmed;
  }
  return `${symbol}：${trimmed}`;
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

function isRelevantNewsItem(symbol: string, symbolName: string, item: NormalizedNews): boolean {
  const haystack = normalizeHaystack(item.title, item.description || item.title);
  if (haystack.includes(symbol.toLowerCase())) {
    return true;
  }

  const normalizedName = normalizeEntityName(symbolName);
  if (normalizedName.length >= 4 && haystack.includes(normalizedName)) {
    return true;
  }

  return false;
}

function canonicalDescription(input: string): string {
  return normalizeZhText(input)
    .toLowerCase()
    .replace(/[，。！？、：；,.!?;:]/g, "");
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

function dedupeNewsByTitle(items: NormalizedNews[]): NormalizedNews[] {
  const unique: NormalizedNews[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const key = item.title.trim().toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(item);
  }

  return unique;
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return text.slice(start, end + 1);
}

function buildPrompt(symbol: string, stockName: string, seedEvents: SeedEvent[]): string {
  const lines = seedEvents
    .map((event, index) => `${index + 1}. ${event.date} | ${event.titleEn}`)
    .join("\n");

  return `你是金融内容编辑，请把股票事件整理为中文训练样本。\n\n股票：${stockName} (${symbol})\n英文事件：\n${lines}\n\n任务：\n1) 先把以上英文事件全部翻译成简体中文。\n2) 如果事件数量不足 ${MIN_EVENTS_PER_STOCK} 条，再补充到 ${MIN_EVENTS_PER_STOCK} 条，补充事件也要是中文、与该股票近期市场关注点相关。\n3) 允许仿写新增事件，但必须像真实新闻事件句式，且不能复述同一句。\n4) 每条事件描述必须包含股票代码 ${symbol}，建议以“${symbol}：”开头。\n5) 除股票代码外禁止输出英文，禁止输出解释，禁止 Markdown。\n6) 每条事件描述控制在 14~38 字。\n7) 日期使用 YYYY-MM-DD。\n8) 所有事件描述必须互不重复。\n\n只返回严格 JSON：\n{\n  "events": [\n    {"date": "YYYY-MM-DD", "description_zh": "中文事件描述"}\n  ]\n}\n\n要求返回 events 数组长度恰好为 ${MIN_EVENTS_PER_STOCK}，且描述不可重复。`;
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
          maxOutputTokens: 500,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GEMINI_HTTP_${response.status}:${errorText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("GEMINI_EMPTY_RESPONSE");
  }

  return text;
}

async function callMinimaxOpenAI(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(`${MINIMAX_OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 500,
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

async function callMinimaxAnthropic(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(`${MINIMAX_ANTHROPIC_BASE_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      Authorization: `Bearer ${apiKey}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      max_tokens: 500,
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

async function callMinimax(apiKey: string, prompt: string): Promise<string> {
  if (apiKey.trim().startsWith("sk-cp-")) {
    return callMinimaxAnthropic(apiKey, prompt);
  }

  try {
    return await callMinimaxOpenAI(apiKey, prompt);
  } catch (error) {
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

function normalizeGeminiEvents(raw: unknown, seedEvents: SeedEvent[], symbol: string): GeminiEvent[] {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  const maybeEvents = (raw as { events?: unknown }).events;
  if (!Array.isArray(maybeEvents)) {
    return [];
  }

  const baseDate = seedEvents[0]?.date || new Date().toISOString().split("T")[0];
  const normalized = maybeEvents
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const row = item as { date?: unknown; description_zh?: unknown };
      if (typeof row.description_zh !== "string") {
        return null;
      }

      const descriptionZh = normalizeZhText(row.description_zh);
      if (!descriptionZh) {
        return null;
      }

      // Ensure each event is explicitly tied to the stock to avoid confusing cross-symbol contamination.
      if (!descriptionZh.toUpperCase().includes(symbol.toUpperCase())) {
        return null;
      }

      const fallbackDate = seedEvents[index]?.date || shiftDate(baseDate, -index);
      const date =
        typeof row.date === "string"
          ? toDateString(row.date, fallbackDate)
          : fallbackDate;

      return {
        date,
        descriptionZh,
      };
    })
    .filter((item): item is GeminiEvent => Boolean(item));

  return dedupeGeminiEvents(normalized).slice(0, MIN_EVENTS_PER_STOCK);
}

async function enrichEventsWithGemini(
  config: { provider: LLMProvider; apiKey: string },
  symbol: string,
  stockName: string,
  seedEvents: SeedEvent[]
): Promise<GeminiEvent[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const prompt = buildPrompt(symbol, stockName, seedEvents);
      const text = await callLLM(config, prompt);
      const jsonText = extractJsonObject(text) ?? text;
      const parsed = JSON.parse(jsonText) as unknown;
      const normalized = normalizeGeminiEvents(parsed, seedEvents, symbol);

      if (normalized.length >= MIN_EVENTS_PER_STOCK) {
        return normalized.slice(0, MIN_EVENTS_PER_STOCK);
      }

      throw new Error(`GEMINI_TOO_FEW_EVENTS:${normalized.length}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const message = lastError.message;

      if (message.startsWith("GEMINI_HTTP_429") || message.startsWith("MINIMAX_HTTP_429")) {
        // Respect free-tier RPM limits and retry.
        await sleep(6000 * attempt);
        continue;
      }

      if (message.startsWith("GEMINI_HTTP_5") || message.startsWith("MINIMAX_HTTP_5")) {
        await sleep(1200 * attempt);
        continue;
      }

      if (attempt < 3) {
        await sleep(1200 * attempt);
        continue;
      }
    }
  }

  throw lastError ?? new Error(`Gemini enrichment failed for ${symbol}`);
}

async function buildGeneratedEventGroups(
  news: NormalizedNews[],
  prices: NormalizedPriceMove[],
  llmConfig: { provider: LLMProvider; apiKey: string }
): Promise<GeneratedEventGroup[]> {
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
  let processedSymbols = 0;

  for (const [symbol, items] of groupedBySymbol.entries()) {
    const price = priceMap.get(symbol);
    if (!price) {
      continue;
    }

    const sortedNews = [...items].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    const uniqueNews = dedupeNewsByTitle(sortedNews);

    const symbolName = uniqueNews[0]?.symbolName || symbol;
    const relevantNews = uniqueNews.filter((item) => isRelevantNewsItem(symbol, symbolName, item));

    const topNews = relevantNews.slice(0, Math.max(MIN_EVENTS_PER_STOCK, 1));
    if (topNews.length === 0) {
      continue;
    }

    const seedEvents: SeedEvent[] = topNews.map((item) => ({
      date: toDateString(item.publishedAt, new Date().toISOString().split("T")[0]),
      titleEn: item.title,
      sourceUrl: item.sourceUrl,
    }));

    try {
      const enrichedEvents = await enrichEventsWithGemini(
        llmConfig,
        symbol,
        symbolName,
        seedEvents
      );

      const events: GeneratedEvent[] = enrichedEvents.map((item, index) => ({
        description: withTickerPrefix(symbol, item.descriptionZh),
        eventDate: item.date,
        stockSymbol: symbol,
        stockName: symbolName,
        actualPerformance: price.performance,
        daysAfterEvent: 1,
        sourceUrl: seedEvents[index]?.sourceUrl ?? "",
      }));

      if (events.length < MIN_EVENTS_PER_STOCK) {
        console.warn(`Skip ${symbol}: insufficient events after Gemini enrichment.`);
        continue;
      }

      result.push({
        stockSymbol: symbol,
        stockName: symbolName,
        category: "其他",
        source: "auto",
        events,
      });

      processedSymbols += 1;
      if (GEMINI_DELAY_MS > 0) {
        await sleep(GEMINI_DELAY_MS);
      }
    } catch (error) {
      console.warn(
        `Skip symbol ${symbol}: Gemini enrichment failed:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  console.log(`Gemini-enriched symbols: ${processedSymbols}`);
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
  const llmConfig = getLLMConfig();
  const news = await readJson<NormalizedNews[]>("news.json");
  const prices = await readJson<NormalizedPriceMove[]>("prices.json");

  const generated = await buildGeneratedEventGroups(news, prices, llmConfig);
  await writeJson("generated-events.json", generated);

  await pushToSupabase(generated);

  console.log(`Generated ${generated.length} auto event groups.`);
}

main().catch((error) => {
  console.error("generate-events failed:", error);
  process.exitCode = 1;
});
