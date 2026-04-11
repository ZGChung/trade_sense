/**
 * web/api/ai-explain.ts
 *
 * Unified AI explanation endpoint with Supabase-backed cross-user cache.
 *
 * POST body:
 *   {
 *     stockSymbol: string,
 *     eventIds: string[],       // array of event UUIDs (order doesn't matter — sorted for key)
 *     correctAnswer: string,    // "涨" | "跌" | "平"
 *     userPrediction: string,  // "涨" | "跌" | "平"
 *     prompt?: string,          // optional pre-built prompt (for backwards compat)
 *     model?: string,
 *     temperature?: number,
 *     maxTokens?: number,
 *   }
 *
 * Response:
 *   { text: string, source: "cache" | "minimax" | "gemini" | "static-template", cached?: boolean }
 *
 * Environment variables required (Vercel project settings):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   MINIMAX_API_KEY        (used by /api/minimax-explain proxy)
 *   MINIMAX_MODEL          (optional, default MiniMax-M2.5)
 *   MINIMAX_BASE_URL       (optional)
 *   GEMINI_API_KEY         (fallback)
 *   GEMINI_MODEL           (optional)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function getBody(req: VercelRequest): Record<string, unknown> {
  const raw = req.body;
  if (!raw) return {};
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function sortEventIds(ids: string[]): string {
  return [...ids].sort().join(",");
}

function truncateText(text: string, maxChars = 260): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}...`;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 15000, ...fetchInit } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...fetchInit, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// MiniMax proxy call (same pattern as /api/minimax-explain)
// ---------------------------------------------------------------------------

async function callMinimaxProxy(
  prompt: string,
  model: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY?.trim() || "";
  const baseUrl = (process.env.MINIMAX_BASE_URL?.trim() || "https://api.minimax.io/v1").replace(/\/+$/, "");
  const endpoint = `${baseUrl}/chat/completions`;

  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    timeoutMs: 20000,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MINIMAX_HTTP_${response.status}:${truncateText(errorText)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("MINIMAX_EMPTY_RESPONSE");
  return text;
}

// ---------------------------------------------------------------------------
// Gemini proxy call (fallback)
// ---------------------------------------------------------------------------

async function callGeminiProxy(
  prompt: string,
  model: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || "";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    timeoutMs: 15000,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GEMINI_HTTP_${response.status}:${truncateText(errorText)}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("GEMINI_EMPTY_RESPONSE");
  return text;
}

// ---------------------------------------------------------------------------
// Static fallback (copied from aiService.ts)
// ---------------------------------------------------------------------------

function buildStaticFallback(actualPerformance: number): string {
  const percent = (actualPerformance * 100).toFixed(1);
  if (Math.abs(actualPerformance) <= 0.01) {
    return `该股票出现了${percent}%的波动。你可以重点关注事件发布前后的预期差，避免只看消息标题做判断。`;
  }
  const direction = actualPerformance >= 0 ? "上涨" : "下跌";
  return `该股票${direction}${Math.abs(actualPerformance * 100).toFixed(1)}%。主要受相关事件影响，市场在定价预期变化。你可以先判断消息是否超预期，再决定涨跌方向。`;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const body = getBody(req);
  const stockSymbol = String(body.stockSymbol ?? "").trim();
  const eventIdsRaw = body.eventIds;
  const correctAnswer = String(body.correctAnswer ?? "").trim();
  const userPrediction = String(body.userPrediction ?? "").trim();
  const promptFromBody = String(body.prompt ?? "").trim();
  const model = (body.model as string)?.trim() || process.env.MINIMAX_MODEL?.trim() || "MiniMax-M2.5";
  const temperature = clampNumber(body.temperature, 0.6, 0, 2);
  const maxTokens = clampNumber(body.maxTokens, 240, 32, 512);

  // Validate required fields
  if (!stockSymbol || !eventIdsRaw || !correctAnswer || !userPrediction) {
    res.status(400).json({ error: "Missing required fields: stockSymbol, eventIds, correctAnswer, userPrediction" });
    return;
  }

  const eventIds = Array.isArray(eventIdsRaw) ? eventIdsRaw.map((id) => String(id).trim()).filter(Boolean) : [];
  if (eventIds.length === 0) {
    res.status(400).json({ error: "eventIds must be a non-empty array" });
    return;
  }

  const eventIdsSorted = sortEventIds(eventIds);

  // ---------------------------------------------------------------------------
  // Check Supabase cache
  // ---------------------------------------------------------------------------
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  let cachedText: string | null = null;

  if (supabaseUrl && serviceRoleKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: rows, error } = await supabase
        .from("ai_explanation_cache")
        .select("explanation")
        .eq("stock_symbol", stockSymbol)
        .eq("event_ids", eventIdsSorted)
        .eq("correct_answer", correctAnswer)
        .eq("user_prediction", userPrediction)
        .limit(1);

      if (!error && rows && rows.length > 0) {
        cachedText = rows[0].explanation;
      }
    } catch (err) {
      // Cache check failed — proceed to compute (non-fatal)
      console.error("[ai-explain] Cache lookup error:", err);
    }
  }

  // ---------------------------------------------------------------------------
  // Return from cache if found
  // ---------------------------------------------------------------------------
  if (cachedText) {
    res.status(200).json({ text: cachedText, source: "cache", cached: true });
    return;
  }

  // ---------------------------------------------------------------------------
  // Compute explanation (MiniMax, then Gemini, then static)
  // ---------------------------------------------------------------------------
  const prompt = promptFromBody || `请用120字以内解释股价涨跌原因，使用中文，直接给出结论。`;

  let text = "";
  let source: "minimax" | "gemini" | "static-template" = "minimax";

  try {
    text = await callMinimaxProxy(prompt, model, temperature, maxTokens);
  } catch (minimaxErr) {
    console.error("[ai-explain] MiniMax error:", minimaxErr);
    try {
      const geminiModel = (body.model as string)?.trim() || process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash-lite";
      text = await callGeminiProxy(prompt, geminiModel, temperature, maxTokens);
      source = "gemini";
    } catch (geminiErr) {
      console.error("[ai-explain] Gemini fallback error:", geminiErr);
      // Parse actual performance from prompt if present, default to 0
      let actualPerformance = 0;
      const perfMatch = prompt.match(/实际表现：([-+]?[\d.]+)%/);
      if (perfMatch) {
        actualPerformance = parseFloat(perfMatch[1]) / 100;
      }
      text = buildStaticFallback(actualPerformance);
      source = "static-template";
    }
  }

  // ---------------------------------------------------------------------------
  // Store in cache (fire-and-forget, non-blocking)
  // ---------------------------------------------------------------------------
  if (supabaseUrl && serviceRoleKey && text && source !== "static-template") {
    // Determine stock name from prompt or use symbol
    const stockNameMatch = prompt.match(/股票[：:](.+?)(?:\n|$)/);
    const stockName = stockNameMatch ? stockNameMatch[1].trim() : stockSymbol;

    createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
      .from("ai_explanation_cache")
      .upsert(
        {
          stock_symbol: stockSymbol,
          stock_name: stockName,
          event_ids: eventIdsSorted,
          correct_answer: correctAnswer,
          user_prediction: userPrediction,
          explanation: text,
          provider: source,
        },
        { onConflict: "stock_symbol,event_ids,correct_answer,user_prediction" }
      )
      .then(({ error }) => {
        if (error) console.error("[ai-explain] Cache store error:", error);
      })
      .catch(() => {});
  }

  res.status(200).json({ text, source, cached: false });
}
