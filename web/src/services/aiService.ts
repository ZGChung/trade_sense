import type { HistoricalEvent, PredictionOption } from "../models/types";

const AI_SETTINGS_KEY = "tradesense_ai_settings_v1";

export type AIProviderMode = "gemini-free" | "user-key";
export type UserAIProvider = "deepseek" | "openai" | "gemini";

export interface AISettings {
  mode: AIProviderMode;
  userProvider: UserAIProvider;
  userApiKey: string;
  userModel: string;
  userBaseUrl: string;
}

export interface AIExplanationResult {
  text: string;
  source: "gemini-free" | "user-key" | "static-template";
  providerLabel: string;
  errorMessage?: string;
}

const DEFAULT_SETTINGS: AISettings = {
  mode: "gemini-free",
  userProvider: "deepseek",
  userApiKey: "",
  userModel: "",
  userBaseUrl: "",
};

const DEFAULT_MODELS: Record<UserAIProvider, string> = {
  deepseek: "deepseek-chat",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.5-flash-lite",
};

class AIProviderError extends Error {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "AIProviderError";
    this.statusCode = statusCode;
  }
}

function parseJSONSafely<T>(input: string | null): T | null {
  if (!input) {
    return null;
  }

  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}

function truncateText(text: string, maxChars = 260): string {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}...`;
}

class AIService {
  private readonly freeGeminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

  getSettings(): AISettings {
    const parsed = parseJSONSafely<Partial<AISettings>>(localStorage.getItem(AI_SETTINGS_KEY));

    if (!parsed) {
      return { ...DEFAULT_SETTINGS };
    }

    const mode = parsed.mode === "user-key" ? "user-key" : "gemini-free";
    const userProvider =
      parsed.userProvider === "openai" || parsed.userProvider === "gemini" || parsed.userProvider === "deepseek"
        ? parsed.userProvider
        : "deepseek";

    return {
      mode,
      userProvider,
      userApiKey: parsed.userApiKey?.trim() ?? "",
      userModel: parsed.userModel?.trim() ?? "",
      userBaseUrl: parsed.userBaseUrl?.trim() ?? "",
    };
  }

  updateSettings(next: Partial<AISettings>): AISettings {
    const merged = {
      ...this.getSettings(),
      ...next,
    };

    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(merged));
    return merged;
  }

  private buildPrompt(
    events: HistoricalEvent[],
    stockName: string,
    correctAnswer: PredictionOption,
    userPrediction: PredictionOption,
    actualPerformance: number
  ): string {
    const eventsDescription = events
      .map((event, index) => `事件${index + 1}: ${event.description} (日期: ${event.date})`)
      .join("\n");

    return `你是一位股票交易教练，请直接对用户解释这道题。\n\n股票：${stockName}\n\n相关事件：\n${eventsDescription}\n\n实际表现：${(actualPerformance * 100).toFixed(2)}%\n正确答案：${correctAnswer}\n用户预测：${userPrediction}\n\n要求：\n1. 用中文回答，120字以内\n2. 解释事件如何影响市场预期\n3. 如果用户预测错误，直接指出可改进的思路\n4. 语气直接，使用“你”\n\n请给出一段完整结论。`;
  }

  private async callGemini(apiKey: string, prompt: string, model = "gemini-2.5-flash-lite"): Promise<string> {
    if (!apiKey) {
      throw new AIProviderError("Gemini API Key 未配置");
    }

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
            temperature: 0.6,
            maxOutputTokens: 240,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new AIProviderError(`Gemini 请求失败: ${truncateText(errorText)}`, response.status);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      throw new AIProviderError("Gemini 返回为空");
    }

    return text;
  }

  private async callOpenAI(apiKey: string, prompt: string, model: string, baseUrl: string): Promise<string> {
    const endpoint = baseUrl || "https://api.openai.com/v1/chat/completions";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 240,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AIProviderError(`OpenAI 请求失败: ${truncateText(errorText)}`, response.status);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new AIProviderError("OpenAI 返回为空");
    }

    return text;
  }

  private async callDeepSeek(apiKey: string, prompt: string, model: string, baseUrl: string): Promise<string> {
    const endpoint = baseUrl || "https://api.deepseek.com/chat/completions";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 240,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AIProviderError(`DeepSeek 请求失败: ${truncateText(errorText)}`, response.status);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new AIProviderError("DeepSeek 返回为空");
    }

    return text;
  }

  private async callUserProvider(settings: AISettings, prompt: string): Promise<string> {
    if (!settings.userApiKey) {
      throw new AIProviderError("未配置用户 API Key");
    }

    const model = settings.userModel || DEFAULT_MODELS[settings.userProvider];

    if (settings.userProvider === "openai") {
      return this.callOpenAI(settings.userApiKey, prompt, model, settings.userBaseUrl);
    }

    if (settings.userProvider === "gemini") {
      return this.callGemini(settings.userApiKey, prompt, model);
    }

    return this.callDeepSeek(settings.userApiKey, prompt, model, settings.userBaseUrl);
  }

  private buildStaticFallback(events: HistoricalEvent[], actualPerformance: number): string {
    const finalEvent = events[events.length - 1] ?? events[0];
    const percent = (actualPerformance * 100).toFixed(1);

    if (!finalEvent) {
      return `该股票在事件后出现了${percent}%的波动。你可以重点关注事件发布前后的预期差，避免只看消息标题做判断。`;
    }

    if (Math.abs(actualPerformance) <= 0.01) {
      return `该股票在事件后${finalEvent.daysAfterEvent}天波动约${percent}%。消息“${finalEvent.description}”对预期有影响，但价格反应相对温和，你可以继续观察交易量和后续验证数据。`;
    }

    const direction = actualPerformance >= 0 ? "上涨" : "下跌";
    return `该股票在事件后${finalEvent.daysAfterEvent}天${direction}${Math.abs(actualPerformance * 100).toFixed(1)}%。主要受“${finalEvent.description}”影响，市场在定价预期变化。你可以先判断消息是否超预期，再决定涨跌方向。`;
  }

  async explainPredictionResult(
    events: HistoricalEvent[],
    stockName: string,
    correctAnswer: PredictionOption,
    userPrediction: PredictionOption,
    actualPerformance: number
  ): Promise<AIExplanationResult> {
    const settings = this.getSettings();
    const prompt = this.buildPrompt(events, stockName, correctAnswer, userPrediction, actualPerformance);
    const providerErrors: string[] = [];

    const providerOrder: Array<"gemini-free" | "user-key"> =
      settings.mode === "user-key" ? ["user-key", "gemini-free"] : ["gemini-free", "user-key"];

    for (const source of providerOrder) {
      try {
        if (source === "gemini-free") {
          const text = await this.callGemini(this.freeGeminiApiKey, prompt);
          return {
            text,
            source: "gemini-free",
            providerLabel: "Gemini 2.5 Flash-Lite (免费)",
          };
        }

        const text = await this.callUserProvider(settings, prompt);
        return {
          text,
          source: "user-key",
          providerLabel: `用户 Key (${settings.userProvider.toUpperCase()})`,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        providerErrors.push(message);
      }
    }

    return {
      text: this.buildStaticFallback(events, actualPerformance),
      source: "static-template",
      providerLabel: "静态模板兜底",
      errorMessage: providerErrors.length > 0 ? providerErrors.join(" | ") : undefined,
    };
  }
}

export const aiService = new AIService();
