import type { HistoricalEvent, PredictionOption } from "../models/types";

interface DeepSeekRequest {
  model: string;
  messages: DeepSeekMessage[];
  temperature: number;
  max_tokens: number;
  stream: boolean;
}

interface DeepSeekMessage {
  role: string;
  content: string;
}

interface DeepSeekResponse {
  choices: DeepSeekChoice[];
}

interface DeepSeekChoice {
  message: DeepSeekMessage;
}

export class DeepSeekError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeepSeekError";
  }
}

class DeepSeekService {
  private apiKey: string;
  private apiURL = "https://api.deepseek.com/chat/completions";
  private model = "deepseek-chat";

  constructor() {
    this.apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || "";
    
    if (!this.apiKey || this.apiKey === "YOUR_DEEPSEEK_API_KEY_HERE") {
      console.warn(
        "⚠️ API Key 未配置！请按照以下步骤配置：\n" +
        "1. 复制 .env.example 为 .env\n" +
        "2. 在 .env 中填入你的 DeepSeek API Key\n" +
        "3. .env 已自动加入 .gitignore，不会被提交到仓库"
      );
    }
  }

  async explainPredictionResult(
    events: HistoricalEvent[],
    stockName: string,
    correctAnswer: PredictionOption,
    userPrediction: PredictionOption,
    actualPerformance: number
  ): Promise<string> {
    // Check API Key
    if (!this.apiKey || this.apiKey === "YOUR_DEEPSEEK_API_KEY_HERE") {
      throw new DeepSeekError(
        "请按照 .env.example 模板创建 .env 配置文件并添加你的 DeepSeek API Key"
      );
    }

    // Build events description
    const eventsDescription = events
      .map(
        (event, index) =>
          `事件${index + 1}: ${event.description} (日期: ${event.date})`
      )
      .join("\n");

    // Build prompt
    const prompt = `作为一位资深的股票分析师，请直接对用户分析以下情况：

股票：${stockName}

相关事件：
${eventsDescription}

实际表现：${(actualPerformance * 100).toFixed(2)}%
正确答案：${correctAnswer}
你的预测：${userPrediction}

请用第二人称直接对用户说话，简洁地解释为什么股票会有这样的表现：
1. 分析这些事件对股价的影响机制
2. 解释市场反应的逻辑
3. 如果预测错误，直接告诉用户可能的原因（用"你"而不是"用户"）

请用中文回答，语气亲切直接，控制在150字以内。以"你"开头与用户对话。`;

    const request: DeepSeekRequest = {
      model: this.model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
      stream: false,
    };

    return this.performRequest(request);
  }

  private async performRequest(request: DeepSeekRequest): Promise<string> {
    try {
      const response = await fetch(this.apiURL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new DeepSeekError(`HTTP错误: ${response.status}`);
      }

      const data: DeepSeekResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new DeepSeekError("没有收到AI响应");
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (error instanceof DeepSeekError) {
        throw error;
      }
      throw new DeepSeekError(
        `网络错误: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

export const deepSeekService = new DeepSeekService();
