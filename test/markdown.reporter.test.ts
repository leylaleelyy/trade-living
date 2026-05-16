import { describe, expect, it } from "vitest";
import { toMarkdownReport } from "../src/report/markdown.reporter.js";
import { analyzeKLines } from "../src/systems/setup-engine.js";
import { fixtureKLines } from "./fixtures.js";

describe("markdown reporter", () => {
  it("renders analysis as a structured interpretation template", () => {
    const analysis = analyzeKLines("AAPL.US", fixtureKLines);
    const markdown = toMarkdownReport("Analysis AAPL.US", analysis);

    expect(markdown).toContain("# Analysis AAPL.US");
    expect(markdown).toContain("**重点结论：");
    expect(markdown).toContain('<span style="color:');
    expect(markdown).toContain("## 信号总览");
    expect(markdown).toContain("Market Regime（市场状态）");
    expect(markdown).toContain("Triple Screen（三重滤网）");
    expect(markdown).toContain("RR（风险收益比）");
    expect(markdown).toContain("MACD（移动平均收敛/发散）");
    expect(markdown).toContain("Force Index（强力指数）");
    expect(markdown).toMatch(/trending bull（趋势多头）|trending bear（趋势空头）|range（区间震荡）|volatile（高波动）|compression（波动压缩）/);
    expect(markdown).toMatch(/A\+（极高质量）|A（高质量）|B（可观察）|C（质量一般）|Avoid（回避）/);
    expect(markdown).toContain("## 三重滤网状态");
    expect(markdown).toMatch(/月线趋势[\s\S]+bullish（看涨）|月线趋势[\s\S]+bearish（看跌）|月线趋势[\s\S]+neutral（中性）/);
    expect(markdown).toContain("## RR 分析");
    expect(markdown).toContain("风险收益比");
    expect(markdown).toContain("## 视觉评分");
    expect(markdown).toContain("▰");
    expect(markdown).toContain("## 价格地图");
    expect(markdown).toContain("价格阶梯");
    expect(markdown).toContain("## 交易计划模板");
    expect(markdown).not.toContain('"tradePlan":');
  });

  it("renders holding context when analysis includes a matched position", () => {
    const analysis = {
      ...analyzeKLines("AAPL.US", fixtureKLines),
      position: {
        status: "held" as const,
        holding: {
          symbol: "AAPL.US",
          quantity: 10,
          avgCost: 190,
          marketPrice: 210,
          marketValue: 2100,
          unrealizedPnl: 200
        },
        costBasis: 1900,
        marketValue: 2100,
        unrealizedPnl: 200,
        unrealizedPnlPct: 10.53,
        portfolioWeightPct: 15.2,
        priceVsCostPct: 10.53,
        riskToStop: 120,
        riskToStopPct: 5.71,
        notes: ["Existing holding detected; evaluate this as position management."]
      }
    };
    const markdown = toMarkdownReport("Analysis AAPL.US", analysis);

    expect(markdown).toContain("## 持仓上下文");
    expect(markdown).toContain("Unrealized P/L（未实现盈亏）");
    expect(markdown).toContain("Existing holding detected");
    expect(markdown).toContain("检测到已有持仓");
  });

  it("renders portfolio output as a structured template", () => {
    const markdown = toMarkdownReport("Portfolio", {
      holdings: [
        {
          symbol: "AAPL.US",
          quantity: 10,
          avgCost: 190,
          marketPrice: 210,
          marketValue: 2100,
          unrealizedPnl: 200
        },
        {
          symbol: "PLTR270115C150000.US",
          quantity: 1,
          avgCost: 21.45,
          name: "PLTR 270115 150 Call",
          currency: "USD"
        }
      ],
      risk: {
        totalMarketValue: 2100,
        totalUnrealizedPnl: 200,
        grossExposure: 1,
        maxSinglePositionPct: 100
      }
    });

    expect(markdown).toContain("# Portfolio");
    expect(markdown).toContain("**组合重点：");
    expect(markdown).toContain("## 组合总览");
    expect(markdown).toContain("## 配置视图");
    expect(markdown).toContain("Top allocations（主要配置）");
    expect(markdown).toContain("Unrealized P/L（未实现盈亏）");
    expect(markdown).toContain("P/L（盈亏）");
    expect(markdown).toContain("priced（已计价）");
    expect(markdown).toContain("cost-only（仅成本价）");
    expect(markdown).toContain("## 持仓明细");
    expect(markdown).toContain("## 报价质量");
    expect(markdown).toContain("PLTR270115C150000.US");
    expect(markdown).not.toContain('"holdings":');
  });
});
