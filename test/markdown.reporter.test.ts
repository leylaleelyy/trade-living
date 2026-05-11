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
});

