/**
 * pipeline/precompute-ai-cache.ts
 *
 * Pre-computes all AI explanation combinations for the ai_explanation_cache table.
 *
 * For each event_group with >= 3 events:
 *   - Sort events by date (oldest first), take top 5
 *   - For each (correct_answer × user_prediction) in {涨,跌,平} × {涨,跌,平} = 9 combos:
 *     - Build prompt, call MiniMax, insert into cache
 *
 * Run with:
 *   PIPELINE_PRECOMPUTE_DRY_RUN=true npx tsx precompute-ai-cache.ts    # show what would run
 *   PIPELINE_PRECOMPUTE_BATCH_SIZE=5 npx tsx precompute-ai-cache.ts    # control parallelism
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   MINIMAX_API_KEY (or MINIMAX_ANTHROPIC_BASE_URL via PIPELINE_MINIMAX_*)
 */

import { createClient } from "@supabase/supabase-js";

const MINIMAX_MODEL =
  process.env.PIPELINE_MINIMAX_MODEL?.trim() ||
  process.env.MINIMAX_MODEL?.trim() ||
  "MiniMax-M2.5";
const MINIMAX_ANTHROPIC_BASE_URL = (
  process.env.PIPELINE_MINIMAX_ANTHROPIC_BASE_URL?.trim() ||
  process.env.MINIMAX_ANTHROPIC_BASE_URL?.trim() ||
  "https://api.minimax.io/anthropic"
).replace(/\/+$/, "");
const MINIMAX_ANTHROPIC_FALLBACK_BASE_URL = MINIMAX_ANTHROPIC_BASE_URL.includes("minimaxi.com")
  ? "https://api.minimax.io/anthropic"
  : "https://api.minimaxi.com/anthropic";
const HTTP_TIMEOUT_MS = Math.max(5_000, Number(process.env.PIPELINE_HTTP_TIMEOUT_MS ?? "30000"));
const BATCH_SIZE = Math.max(1, Number(process.env.PIPELINE_PRECOMPUTE_BATCH_SIZE ?? "10"));
const DRY_RUN = String(process.env.PIPELINE_PRECOMPUTE_DRY_RUN ?? "").toLowerCase() === "true";
const VERBOSE = String(process.env.PIPELINE_VERBOSE ?? "").toLowerCase() === "true";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventRow {
  id: string;
  description: string;
  event_date: string;
  actual_performance: number | string;
}

interface EventGroupRow {
  id: string;
  stock_symbol: string;
  stock_name: string;
  events: EventRow[] | null;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function getEnv(name: string, required = true): string {
  const value = process.env[name]?.trim();
  if (required && !value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value ?? "";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchWithTimeout(timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const nextInit = { ...(init ?? {}) } as RequestInit;
      if (nextInit.signal) {
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

function parseNumber(value: string | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function callMinimaxAnthropicWithBaseUrl(
  apiKey: string,
  prompt: string,
  baseUrl: string,
  maxTokens = 300
): Promise<string> {
  const response = await fetchWithTimeout(HTTP_TIMEOUT_MS)(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      Authorization: `Bearer ${apiKey}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      max_tokens: maxTokens,
      temperature: 0.6,
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
    if (error instanceof Error && error.message.includes("MINIMAX_HTTP_401")) {
      return callMinimaxAnthropicWithBaseUrl(apiKey, prompt, MINIMAX_ANTHROPIC_FALLBACK_BASE_URL);
    }
    throw error;
  }
}

async function callMinimax(apiKey: string, prompt: string): Promise<string> {
  if (apiKey.trim().startsWith("sk-cp-")) {
    return callMinimaxAnthropic(apiKey, prompt);
  }
  // For OpenAI-style keys, use anthropic interface as fallback
  try {
    return await callMinimaxAnthropic(apiKey, prompt);
  } catch (error) {
    if (error instanceof Error && error.message.includes("MINIMAX_HTTP_401")) {
      throw error;
    }
    throw error;
  }
}

function buildPrompt(
  events: EventRow[],
  stockName: string,
  correctAnswer: string,
  userPrediction: string,
  actualPerformance: number
): string {
  const eventsDescription = events
    .map((event, index) => `事件${index + 1}: ${event.description} (日期: ${event.event_date})`)
    .join("\n");

  return `你是一位股票交易教练，请直接对用户解释这道题。\n\n股票：${stockName}\n\n相关事件：\n${eventsDescription}\n\n实际表现：${(actualPerformance * 100).toFixed(2)}%\n正确答案：${correctAnswer}\n用户预测：${userPrediction}\n\n要求：\n1. 用中文回答，120字以内\n2. 解释事件如何影响市场预期\n3. 如果用户预测错误，直接指出可改进的思路\n4. 语气直接，使用"你"\n\n请给出一段完整结论。`;
}

function sortEventIdsDesc(ids: string[]): string {
  return [...ids].sort().join(",");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const ANSWERS = ["涨", "跌", "平"] as const;

async function main() {
  const supabaseUrl = getEnv("SUPABASE_URL");
  const serviceRole = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const minimaxKey = getEnv("MINIMAX_API_KEY", false) || getEnv("PIPELINE_MINIMAX_API_KEY", false);
  const pipelineMinimaxKey = process.env.PIPELINE_MINIMAX_API_KEY?.trim();

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("\n📊 Precomputing AI explanation cache...\n");
  if (DRY_RUN) console.log("🔎 DRY RUN — no API calls will be made, no rows written.\n");

  // ---------------------------------------------------------------------------
  // Step 1: Fetch all event groups with auto source and >= 3 events
  // ---------------------------------------------------------------------------
  console.log("Fetching event groups with >= 3 events...");

  const { data: groups, error: groupsError } = await supabase
    .from("event_groups")
    .select("id, stock_symbol, stock_name, events")
    .eq("source", "auto")
    .not("events", "is", null)
    .not("events", "eq", "[]");

  if (groupsError) {
    console.error(`❌ Failed to fetch event groups: ${groupsError.message}`);
    process.exit(1);
  }

  const filtered = (groups as EventGroupRow[] | null ?? []).filter(
    (g) => Array.isArray(g.events) && g.events.length >= 3
  );

  console.log(`   Found ${filtered.length} event groups with >= 3 events.\n`);

  // ---------------------------------------------------------------------------
  // Step 2: Build work items
  // ---------------------------------------------------------------------------
  type WorkItem = {
    group: EventGroupRow;
    events: EventRow[];
    correctAnswer: string;
    userPrediction: string;
    cacheKey: string;
    prompt: string;
    actualPerformance: number;
  };

  const workItems: WorkItem[] = [];

  for (const group of filtered) {
    const events = [...(group.events ?? [])].sort(
      (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );
    const topEvents = events.slice(0, 5);
    const actualPerformance = parseNumber(topEvents[0]?.actual_performance);
    const eventIdsSorted = sortEventIdsDesc(topEvents.map((e) => e.id));

    for (const correctAnswer of ANSWERS) {
      for (const userPrediction of ANSWERS) {
        const prompt = buildPrompt(topEvents, group.stock_name, correctAnswer, userPrediction, actualPerformance);
        const cacheKey = `${group.stock_symbol}::${eventIdsSorted}::${correctAnswer}::${userPrediction}`;

        workItems.push({
          group,
          events: topEvents,
          correctAnswer,
          userPrediction,
          cacheKey,
          prompt,
          actualPerformance,
        });
      }
    }
  }

  if (workItems.length === 0) {
    console.log("No work items to process. Exiting.");
    return;
  }

  console.log(`Total work items: ${workItems.length} (${filtered.length} stocks × 9 answer combos)\n`);

  if (DRY_RUN) {
    console.log("DRY RUN — would process the following stocks:\n");
    const stockSet = new Set(filtered.map((g) => g.stock_symbol));
    let idx = 1;
    for (const symbol of stockSet) {
      console.log(`  ${idx}. ${symbol} (9 combinations)`);
      idx++;
    }
    console.log(`\nTotal: ${stockSet.size} stocks, ${workItems.length} combinations`);
    return;
  }

  // ---------------------------------------------------------------------------
  // Step 3: Process work items in batches
  // ---------------------------------------------------------------------------
  if (!minimaxKey && !pipelineMinimaxKey) {
    console.error("❌ MINIMAX_API_KEY (or PIPELINE_MINIMAX_API_KEY) is required for precomputation.");
    process.exit(1);
  }

  const apiKey = pipelineMinimaxKey || minimaxKey;
  let processed = 0;
  let cached = 0;
  let errors = 0;
  const startTime = Date.now();

  for (let i = 0; i < workItems.length; i += BATCH_SIZE) {
    const batch = workItems.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(workItems.length / BATCH_SIZE);
    const item = batch[0];
    const groupIdx = filtered.findIndex((g) => g.id === item.group.id) + 1;

    console.log(
      `[${batchNum}/${totalBatches}] Precomputing group ${groupIdx}/${filtered.length}: ${item.group.stock_symbol} (${batch.length} items in batch)`
    );

    const results = await Promise.allSettled(
      batch.map(async (work) => {
        const { group, events, correctAnswer, userPrediction, cacheKey, prompt, actualPerformance } = work;

        // Check if already cached
        const eventIdsSorted = sortEventIdsDesc(events.map((e) => e.id));

        const { data: existing } = await supabase
          .from("ai_explanation_cache")
          .select("id")
          .eq("stock_symbol", group.stock_symbol)
          .eq("event_ids", eventIdsSorted)
          .eq("correct_answer", correctAnswer)
          .eq("user_prediction", userPrediction)
          .limit(1);

        if (existing && existing.length > 0) {
          return { status: "skipped" as const, cacheKey };
        }

        // Call MiniMax with retry + delay
        let explanation = "";
        let attempts = 0;
        const maxAttempts = 3;
        const baseDelay = 2000;

        while (attempts < maxAttempts) {
          try {
            explanation = await callMinimax(apiKey!, prompt);
            break;
          } catch (err) {
            attempts++;
            const errorMsg = err instanceof Error ? err.message : String(err);

            if (errorMsg.includes("MINIMAX_HTTP_429") || errorMsg.includes("MINIMAX_HTTP_529")) {
              const delay = baseDelay * attempts + Math.random() * 1000;
              console.warn(`   ⏳ Rate limited, retrying in ${Math.round(delay)}ms (attempt ${attempts}/${maxAttempts})`);
              await sleep(delay);
              continue;
            }

            if (attempts >= maxAttempts) {
              throw new Error(`MiniMax call failed after ${maxAttempts} attempts: ${errorMsg}`);
            }

            await sleep(500 * attempts);
          }
        }

        if (!explanation) {
          throw new Error("Empty response from MiniMax");
        }

        // Upsert into cache (idempotent)
        const { error: upsertError } = await (supabase as any)
          .from("ai_explanation_cache")
          .upsert(
            {
              stock_symbol: group.stock_symbol,
              stock_name: group.stock_name,
              event_ids: eventIdsSorted,
              correct_answer: correctAnswer,
              user_prediction: userPrediction,
              explanation,
              provider: "minimax",
            },
            {
              onConflict: "stock_symbol,event_ids,correct_answer,user_prediction",
            }
          );

        if (upsertError) {
          throw new Error(`Failed to upsert cache: ${upsertError.message}`);
        }

        return { status: "inserted" as const, cacheKey, explanation };
      })
    );

    for (const result of results) {
      if (result.status === "rejected") {
        errors++;
        if (VERBOSE) console.error(`   ❌ Error: ${result.reason?.message}`);
      } else {
        const value = result.value as { status: string; cacheKey: string; explanation?: string };
        if (value.status === "skipped") {
          cached++;
        } else {
          processed++;
          if (VERBOSE) console.log(`   ✅ ${value.cacheKey}: ${value.explanation?.slice(0, 40)}...`);
        }
      }
    }

    // Rate limit between batches
    if (i + BATCH_SIZE < workItems.length) {
      await sleep(500);
    }
  }

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
  const stockSet = new Set(filtered.map((g) => g.stock_symbol));

  console.log(`\n✅ Precomputation complete!`);
  console.log(`   Stocks processed: ${stockSet.size}`);
  console.log(`   New explanations inserted: ${processed}`);
  console.log(`   Already cached (skipped): ${cached}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Time: ${elapsedSec}s\n`);
}

main().catch((err) => {
  console.error("❌ Precomputation failed:", err);
  process.exit(1);
});
