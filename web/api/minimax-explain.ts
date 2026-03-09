import type { VercelRequest, VercelResponse } from "@vercel/node";

type RequestBody = {
  prompt?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
};

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function getBody(req: VercelRequest): RequestBody {
  const raw = req.body;
  if (!raw) return {};
  if (typeof raw === "object") return raw as RequestBody;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as RequestBody;
    } catch {
      return {};
    }
  }
  return {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const apiKey = process.env.MINIMAX_API_KEY?.trim() || "";
  if (!apiKey) {
    res.status(500).json({ error: "MINIMAX_API_KEY is not configured" });
    return;
  }

  const body = getBody(req);
  const prompt = body.prompt?.trim() || "";
  if (!prompt) {
    res.status(400).json({ error: "Missing prompt" });
    return;
  }
  if (prompt.length > 4000) {
    res.status(400).json({ error: "Prompt too long" });
    return;
  }

  const model = (body.model?.trim() || process.env.MINIMAX_MODEL?.trim() || "MiniMax-M2.5").trim();
  const baseUrl = (process.env.MINIMAX_BASE_URL?.trim() || "https://api.minimax.io/v1").replace(/\/+$/, "");
  const temperature = clampNumber(body.temperature, 0.6, 0, 2);
  const maxTokens = clampNumber(body.max_tokens, 240, 32, 512);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
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
    res.status(response.status).json({ error: errorText || "MiniMax request failed" });
    return;
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = data.choices?.[0]?.message?.content?.trim() || "";
  if (!text) {
    res.status(502).json({ error: "MiniMax returned empty response" });
    return;
  }

  res.status(200).json({ text });
}

