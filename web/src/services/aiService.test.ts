import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAIService } from "./aiService";
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

describe("aiService", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("calls /api/ai-explain and returns result", async () => {
    const aiService = createAIService({});

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: "这是一次测试解释", source: "minimax", cached: false }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await aiService.explainPredictionResult(
      events,
      "AAPL",
      "Apple Inc.",
      PredictionOption.RISE,
      PredictionOption.RISE,
      0.034
    );

    expect(result.text).toBe("这是一次测试解释");
    expect(result.source).toBe("minimax-fallback");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/ai-explain");
    const body = JSON.parse(init?.body as string);
    expect(body.stockSymbol).toBe("AAPL");
    expect(body.stockName).toBe("Apple Inc.");
    expect(body.correctAnswer).toBe("涨");
    expect(body.userPrediction).toBe("涨");
    expect(body.eventIds).toEqual(["event-1", "event-2"]);
  });

  it("returns cache source when API returns cached=true", async () => {
    const aiService = createAIService({});

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: "缓存的解释", source: "cache", cached: true }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await aiService.explainPredictionResult(
      events,
      "AAPL",
      "Apple Inc.",
      PredictionOption.RISE,
      PredictionOption.RISE,
      0.034
    );

    expect(result.text).toBe("缓存的解释");
    expect(result.source).toBe("cache");
    expect(result.providerLabel).toBe("缓存结果 (跨用户共享)");
  });

  it("falls back to static template when API fails", async () => {
    const aiService = createAIService({});

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await aiService.explainPredictionResult(
      events,
      "AAPL",
      "Apple Inc.",
      PredictionOption.RISE,
      PredictionOption.FALL,
      0.034
    );

    expect(result.source).toBe("static-template");
    expect(result.providerLabel).toBe("静态模板兜底");
    expect(result.errorMessage).toContain("API 请求失败");
  });

  it("passes prompt to /api/ai-explain", async () => {
    const aiService = createAIService({});

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: "解释", source: "minimax", cached: false }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await aiService.explainPredictionResult(
      events,
      "AAPL",
      "Apple Inc.",
      PredictionOption.RISE,
      PredictionOption.FALL,
      0.034
    );

    const [, init] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(init?.body as string);
    expect(body.prompt).toContain("Apple Inc.");
    expect(body.prompt).toContain("涨");
    expect(body.prompt).toContain("跌");
  });
});
