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
    expect(markdown).toContain("## 视觉评分");
    expect(markdown).toContain("▰");
    expect(markdown).toContain("## 价格地图");
    expect(markdown).toContain("价格阶梯");
    expect(markdown).toContain("## 交易计划模板");
    expect(markdown).not.toContain('"tradePlan":');
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
    expect(markdown).toContain("Top allocations");
    expect(markdown).toContain("## 持仓明细");
    expect(markdown).toContain("## 报价质量");
    expect(markdown).toContain("PLTR270115C150000.US");
    expect(markdown).not.toContain('"holdings":');
  });
});
