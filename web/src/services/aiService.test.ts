import { beforeEach, describe, expect, it, vi } from "vitest";
import { aiService } from "./aiService";
import { PredictionOption } from "../models/types";
import type { HistoricalEvent } from "../models/types";

const events: HistoricalEvent[] = [
  {
    id: "event-1",
    description: "公司发布季度财报并上调全年指引",
    date: "2026-01-12",
    stockSymbol: "AAPL",
    stockName: "Apple",
    actualPerformance: 0.034,
    daysAfterEvent: 1,
  },
  {
    id: "event-2",
    description: "管理层宣布扩大回购计划",
    date: "2026-01-15",
    stockSymbol: "AAPL",
    stockName: "Apple",
    actualPerformance: 0.034,
    daysAfterEvent: 1,
  },
];

function setUserProviderSettings() {
  localStorage.setItem(
    "tradesense_ai_settings_v1",
    JSON.stringify({
      mode: "user-key",
      userProvider: "deepseek",
      userApiKey: "fake-key",
      userModel: "deepseek-chat",
      userBaseUrl: "https://api.deepseek.com/chat/completions",
    })
  );
}

describe("aiService cache", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("reuses cached API explanation for same question + same scenario", async () => {
    setUserProviderSettings();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "这是一次测试解释" } }],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const first = await aiService.explainPredictionResult(
      events,
      "Apple",
      PredictionOption.RISE,
      PredictionOption.RISE,
      0.034
    );

    const second = await aiService.explainPredictionResult(
      events,
      "Apple",
      PredictionOption.RISE,
      PredictionOption.RISE,
      0.034
    );

    expect(first.text).toBe("这是一次测试解释");
    expect(second.text).toBe("这是一次测试解释");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps only two cache scenarios per question (correct/wrong)", async () => {
    setUserProviderSettings();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "缓存命中测试" } }],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    // wrong scenario
    await aiService.explainPredictionResult(
      events,
      "Apple",
      PredictionOption.RISE,
      PredictionOption.FALL,
      0.034
    );

    // another wrong scenario (different wrong option), should hit same cache key
    await aiService.explainPredictionResult(
      events,
      "Apple",
      PredictionOption.RISE,
      PredictionOption.FLAT,
      0.034
    );

    // correct scenario, should trigger one more API call
    await aiService.explainPredictionResult(
      events,
      "Apple",
      PredictionOption.RISE,
      PredictionOption.RISE,
      0.034
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
