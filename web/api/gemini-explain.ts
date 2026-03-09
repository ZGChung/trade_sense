import type { VercelRequest, VercelResponse } from "@vercel/node";

type RequestBody = {
  prompt?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
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

  const apiKey = process.env.GEMINI_API_KEY?.trim() || "";
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
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

  const model = (body.model?.trim() || process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash-lite").trim();
  const temperature = clampNumber(body.temperature, 0.6, 0, 2);
  const maxOutputTokens = clampNumber(body.maxOutputTokens, 240, 32, 512);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    res.status(response.status).json({ error: errorText || "Gemini request failed" });
    return;
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  if (!text) {
    res.status(502).json({ error: "Gemini returned empty response" });
    return;
  }

  res.status(200).json({ text });
}

