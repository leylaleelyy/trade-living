import type { AnalyzeResult, Holding, SupportResistanceLevel } from "../domain/types.js";

export function toMarkdownReport(
  title: string,
  rows: AnalyzeResult | Record<string, unknown>
): string {
  if (isAnalyzeResult(rows)) {
    return toAnalyzeMarkdownReport(title, rows);
  }

  if (isPortfolioReport(rows)) {
    return toPortfolioMarkdownReport(title, rows);
  }

  const body = Object.entries(rows)
    .map(([key, value]) => `- **${key}**: ${formatValue(value)}`)
    .join("\n");

  return `# ${title}\n\n${body}\n`;
}

interface PortfolioReport {
  holdings: Holding[];
  risk: {
    totalMarketValue: number;
    totalUnrealizedPnl: number;
    grossExposure: number;
    maxSinglePositionPct: number;
  };
}

function toAnalyzeMarkdownReport(title: string, analysis: AnalyzeResult): string {
  const bestTarget = analysis.tradePlan.targets.reduce(
    (best, target) => (target.rr > best.rr ? target : best),
    { price: 0, rr: 0 }
  );
  const action = decideAction(analysis, bestTarget.rr);
  const sections = [
    `# ${title}`,
    "",
    `<span style="color:${action.color}">■</span> **重点结论：${action.label}**`,
    "",
    action.reason,
    "",
    "## 信号总览",
    "",
    "| 模块 | 状态 | 解读 |",
    "|---|---:|---|",
    `| ${icon("trend")} 市场状态 | ${badge(formatRegime(analysis.marketRegime), regimeColor(analysis.marketRegime))} | ${regimeNarrative(analysis.marketRegime)} |`,
    `| ${icon("momentum")} 动量 | ${badge(String(analysis.momentum.score), scoreColor(analysis.momentum.score))} | ${scoreNarrative(analysis.momentum.score)} |`,
    `| ${icon("triple")} Triple Screen | ${badge(analysis.tripleScreen.decision, decisionColor(analysis.tripleScreen.decision))} | ${decisionNarrative(analysis.tripleScreen.decision)} |`,
    `| ${icon("quality")} 交易质量 | ${badge(`${analysis.tradeQuality.grade} / ${analysis.tradeQuality.score}`, qualityColor(analysis.tradeQuality.grade))} | ${qualityNarrative(analysis.tradeQuality.grade)} |`,
    `| ${icon("risk")} 最佳 RR | ${badge(formatNumber(bestTarget.rr), rrColor(bestTarget.rr))} | ${rrNarrative(bestTarget.rr)} |`,
    "",
    "## 视觉评分",
    "",
    `- 动量强度 ${scoreBar(analysis.momentum.score)} ${analysis.momentum.score}/100`,
    `- 交易质量 ${scoreBar(analysis.tradeQuality.score)} ${analysis.tradeQuality.score}/100`,
    "",
    "## 价格地图",
    "",
    "| 区域 | 价格 | 说明 |",
    "|---|---:|---|",
    ...levelRows("支撑", analysis.supports),
    `| ${icon("entry")} 入场区 | ${formatNumber(analysis.tradePlan.entryZone[0])} - ${formatNumber(analysis.tradePlan.entryZone[1])} | 计划观察区间 |`,
    `| ${icon("stop")} 止损 | ${formatNumber(analysis.tradePlan.stop)} | 失效位置 |`,
    ...analysis.tradePlan.targets.map(
      (target, index) =>
        `| ${icon("target")} 目标 ${index + 1} | ${formatNumber(target.price)} | RR ${badge(formatNumber(target.rr), rrColor(target.rr))} |`
    ),
    ...levelRows("阻力", analysis.resistances),
    "",
    priceLadder(analysis),
    "",
    "## 背离与风险",
    "",
    `- ${icon("divergence")} MACD 背离：${badge(analysis.divergence.macd, divergenceColor(analysis.divergence.macd))}`,
    `- ${icon("divergence")} Force Index 背离：${badge(analysis.divergence.forceIndex, divergenceColor(analysis.divergence.forceIndex))}`,
    ...warningRows(analysis.warnings),
    "",
    "## 交易计划模板",
    "",
    `1. 只在 ${highlight(formatNumber(analysis.tradePlan.entryZone[0]), "#2563eb")} - ${highlight(formatNumber(analysis.tradePlan.entryZone[1]), "#2563eb")} 区间内寻找确认。`,
    `2. 跌破 ${highlight(formatNumber(analysis.tradePlan.stop), "#dc2626")} 后计划失效。`,
    `3. 优先观察 ${highlight(formatNumber(bestTarget.price), "#16a34a")} 目标，当前最佳 RR 为 ${highlight(formatNumber(bestTarget.rr), rrColor(bestTarget.rr))}。`,
    "",
    "> 说明：本报告只做分析和交易计划质量评估，不构成自动交易指令。"
  ];

  return `${sections.join("\n")}\n`;
}

function toPortfolioMarkdownReport(title: string, portfolio: PortfolioReport): string {
  const pricedHoldings = portfolio.holdings.filter((holding) => holding.marketValue !== undefined);
  const unpricedHoldings = portfolio.holdings.filter((holding) => holding.marketValue === undefined);
  const totalMarketValue = portfolio.risk.totalMarketValue;
  const totalCost = portfolio.holdings.reduce(
    (sum, holding) => sum + holding.avgCost * holding.quantity * (isOptionLike(holding.symbol) ? 100 : 1),
    0
  );
  const pnlPct = totalCost > 0 ? (portfolio.risk.totalUnrealizedPnl / totalCost) * 100 : 0;
  const action = portfolioAction(portfolio, unpricedHoldings.length);
  const sorted = [...portfolio.holdings].sort(
    (a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0)
  );

  const sections = [
    `# ${title}`,
    "",
    `<span style="color:${action.color}">■</span> **组合重点：${action.label}**`,
    "",
    action.reason,
    "",
    "## 组合总览",
    "",
    "| 指标 | 数值 | 解读 |",
    "|---|---:|---|",
    `| ${icon("portfolio")} 已计价市值 | ${money(totalMarketValue)} | ${pricedHoldings.length}/${portfolio.holdings.length} 个持仓有市值 |`,
    `| ${icon("quality")} 未实现盈亏 | ${badge(`${money(portfolio.risk.totalUnrealizedPnl)} (${formatNumber(pnlPct)}%)`, pnlColor(portfolio.risk.totalUnrealizedPnl))} | ${pnlNarrative(portfolio.risk.totalUnrealizedPnl)} |`,
    `| ${icon("risk")} 最大单一持仓 | ${badge(`${formatNumber(portfolio.risk.maxSinglePositionPct)}%`, concentrationColor(portfolio.risk.maxSinglePositionPct))} | ${concentrationNarrative(portfolio.risk.maxSinglePositionPct)} |`,
    `| ${icon("warning")} 未计价持仓 | ${badge(String(unpricedHoldings.length), unpricedHoldings.length ? "#d97706" : "#16a34a")} | ${unpricedHoldings.length ? "需要补充报价或保守估值。" : "报价覆盖完整。"} |`,
    "",
    "## 配置视图",
    "",
    allocationBars(sorted, totalMarketValue),
    "",
    "## 持仓明细",
    "",
    "| 标的 | 数量 | 均价 | 市价 | 市值 | 盈亏 | 占比 | 数据质量 |",
    "|---|---:|---:|---:|---:|---:|---:|---|",
    ...sorted.map((holding) => holdingRow(holding, totalMarketValue)),
    "",
    "## 报价质量",
    "",
    `- ${icon("quality")} 已计价：${pricedHoldings.length} 个`,
    `- ${icon("warning")} 未计价：${unpricedHoldings.length} 个`,
    ...quoteQualityRows(unpricedHoldings),
    "",
    "> 说明：组合报告只用于风险识别和持仓质量评估，不构成交易指令。"
  ];

  return `${sections.join("\n")}\n`;
}

function formatValue(value: unknown): string {
  if (typeof value === "object" && value !== null) {
    return `\`${JSON.stringify(value)}\``;
  }

  return String(value);
}

function isAnalyzeResult(value: unknown): value is AnalyzeResult {
  if (!isRecord(value)) return false;

  return (
    typeof value.symbol === "string" &&
    typeof value.marketRegime === "string" &&
    isRecord(value.tripleScreen) &&
    isRecord(value.momentum) &&
    isRecord(value.tradePlan) &&
    isRecord(value.tradeQuality)
  );
}

function isPortfolioReport(value: unknown): value is PortfolioReport {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.holdings) || !isRecord(value.risk)) return false;
  return (
    typeof value.risk.totalMarketValue === "number" &&
    typeof value.risk.totalUnrealizedPnl === "number" &&
    typeof value.risk.grossExposure === "number" &&
    typeof value.risk.maxSinglePositionPct === "number"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function badge(label: string, color: string): string {
  return `<span style="color:${color};font-weight:700">${label}</span>`;
}

function highlight(label: string, color: string): string {
  return `<span style="color:${color};font-weight:700">${label}</span>`;
}

function icon(name: string): string {
  const icons: Record<string, string> = {
    trend: "▲",
    momentum: "●",
    triple: "◆",
    quality: "★",
    risk: "!",
    entry: "▶",
    stop: "■",
    target: "◎",
    divergence: "◇",
    warning: "!",
    portfolio: "▣"
  };

  return icons[name] ?? "•";
}

function portfolioAction(
  portfolio: PortfolioReport,
  unpricedCount: number
): { label: string; color: string; reason: string } {
  if (portfolio.risk.maxSinglePositionPct >= 25) {
    return {
      label: "集中度偏高",
      color: "#dc2626",
      reason: "最大单一持仓占比较高，优先检查仓位集中风险。"
    };
  }
  if (unpricedCount > 0) {
    return {
      label: "报价不完整",
      color: "#d97706",
      reason: "部分持仓缺少可用市价，组合风险和盈亏需要按保守口径解读。"
    };
  }
  return {
    label: "报价覆盖完整",
    color: "#16a34a",
    reason: "当前持仓均有市值，可直接用于组合风险和盈亏评估。"
  };
}

function allocationBars(holdings: Holding[], totalMarketValue: number): string {
  const rows = holdings
    .filter((holding) => holding.marketValue !== undefined)
    .slice(0, 10)
    .map((holding) => {
      const pct = totalMarketValue > 0 ? ((holding.marketValue ?? 0) / totalMarketValue) * 100 : 0;
      return `${holding.symbol.padEnd(22, " ")} ${scoreBar(Math.min(100, pct * 5))} ${formatNumber(pct)}%`;
    });

  return ["```text", "Top allocations", ...rows, "```"].join("\n");
}

function holdingRow(holding: Holding, totalMarketValue: number): string {
  const allocation =
    holding.marketValue !== undefined && totalMarketValue > 0
      ? `${formatNumber((holding.marketValue / totalMarketValue) * 100)}%`
      : "n/a";
  const quality = holding.quoteSource
    ? `${holding.quoteSource}/${holding.quoteDelay ?? "unknown"}`
    : holding.marketPrice !== undefined
      ? "priced"
      : "cost-only";

  return [
    `| ${holding.symbol}`,
    formatNumber(holding.quantity),
    money(holding.avgCost),
    holding.marketPrice === undefined ? "n/a" : money(holding.marketPrice),
    holding.marketValue === undefined ? "n/a" : money(holding.marketValue),
    holding.unrealizedPnl === undefined
      ? "n/a"
      : badge(money(holding.unrealizedPnl), pnlColor(holding.unrealizedPnl)),
    allocation,
    `${quality} |`
  ].join(" | ");
}

function quoteQualityRows(unpricedHoldings: Holding[]): string[] {
  if (unpricedHoldings.length === 0) {
    return [`- ${icon("quality")} 所有持仓均已有可用报价。`];
  }

  return [
    `- ${icon("warning")} 未计价标的：${unpricedHoldings.map((holding) => holding.symbol).join(", ")}`,
    "- 可配置 `--option-quote-provider tradier|marketdata|auto` 尝试延迟期权报价补全。"
  ];
}

function money(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function pnlColor(value: number): string {
  if (value > 0) return "#16a34a";
  if (value < 0) return "#dc2626";
  return "#2563eb";
}

function pnlNarrative(value: number): string {
  if (value > 0) return "组合当前为浮盈。";
  if (value < 0) return "组合当前为浮亏。";
  return "组合盈亏接近持平。";
}

function concentrationColor(value: number): string {
  if (value >= 25) return "#dc2626";
  if (value >= 15) return "#d97706";
  return "#16a34a";
}

function concentrationNarrative(value: number): string {
  if (value >= 25) return "集中度偏高。";
  if (value >= 15) return "集中度需要观察。";
  return "单一持仓集中度可控。";
}

function isOptionLike(symbol: string): boolean {
  return /\d{6}[CP]\d+\./.test(symbol);
}

function scoreBar(score: number): string {
  const filled = Math.max(0, Math.min(10, Math.round(score / 10)));
  return `${"▰".repeat(filled)}${"▱".repeat(10 - filled)}`;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatRegime(regime: AnalyzeResult["marketRegime"]): string {
  return regime.replaceAll("_", " ");
}

function decideAction(analysis: AnalyzeResult, bestRr: number): { label: string; color: string; reason: string } {
  if (analysis.tradeQuality.grade === "Avoid" || analysis.tripleScreen.decision === "avoid") {
    return {
      label: "回避",
      color: "#dc2626",
      reason: "系统质量或 Triple Screen 已经进入回避状态，优先保护本金。"
    };
  }

  if (analysis.momentum.score >= 75 && bestRr >= 1.5 && analysis.tripleScreen.decision !== "neutral") {
    return {
      label: "重点跟踪",
      color: "#16a34a",
      reason: "趋势、动量和风险收益比同时满足较高质量条件，可以进入重点观察清单。"
    };
  }

  if (analysis.momentum.score >= 70) {
    return {
      label: "强势但等待触发",
      color: "#d97706",
      reason: "动量结构较强，但入场触发或风险收益比仍需改善，适合等待回踩或突破确认。"
    };
  }

  return {
    label: "普通观察",
    color: "#2563eb",
    reason: "当前信号尚未形成高质量交易计划，适合继续观察关键价位。"
  };
}

function regimeColor(regime: AnalyzeResult["marketRegime"]): string {
  if (regime === "trending_bull") return "#16a34a";
  if (regime === "trending_bear") return "#dc2626";
  if (regime === "volatile") return "#d97706";
  return "#2563eb";
}

function scoreColor(score: number): string {
  if (score >= 75) return "#16a34a";
  if (score >= 55) return "#d97706";
  return "#dc2626";
}

function decisionColor(decision: AnalyzeResult["tripleScreen"]["decision"]): string {
  if (decision === "buy_watch") return "#16a34a";
  if (decision === "sell_watch" || decision === "avoid") return "#dc2626";
  return "#d97706";
}

function qualityColor(grade: AnalyzeResult["tradeQuality"]["grade"]): string {
  if (grade === "A+" || grade === "A") return "#16a34a";
  if (grade === "B") return "#d97706";
  return "#dc2626";
}

function rrColor(rr: number): string {
  if (rr >= 2) return "#16a34a";
  if (rr >= 1.5) return "#65a30d";
  if (rr >= 1) return "#d97706";
  return "#dc2626";
}

function divergenceColor(divergence: string): string {
  if (divergence === "none") return "#16a34a";
  if (divergence === "bullish") return "#2563eb";
  return "#dc2626";
}

function regimeNarrative(regime: AnalyzeResult["marketRegime"]): string {
  const narratives: Record<AnalyzeResult["marketRegime"], string> = {
    trending_bull: "多头趋势占优，优先寻找顺势机会。",
    trending_bear: "空头趋势占优，避免逆势抄底。",
    range: "区间震荡，重视上下沿和假突破。",
    volatile: "波动放大，仓位和止损需要更保守。",
    compression: "波动压缩，等待方向选择。"
  };

  return narratives[regime];
}

function scoreNarrative(score: number): string {
  if (score >= 75) return "动量强，价格结构有延续潜力。";
  if (score >= 55) return "动量中性偏强，需要确认。";
  return "动量不足，优先降低预期。";
}

function decisionNarrative(decision: AnalyzeResult["tripleScreen"]["decision"]): string {
  const narratives: Record<AnalyzeResult["tripleScreen"]["decision"], string> = {
    buy_watch: "进入买入观察，但仍需触发条件。",
    sell_watch: "进入卖出观察，注意趋势转弱。",
    avoid: "系统建议回避。",
    neutral: "趋势存在，但触发条件不足。"
  };

  return narratives[decision];
}

function qualityNarrative(grade: AnalyzeResult["tradeQuality"]["grade"]): string {
  if (grade === "A+" || grade === "A") return "交易计划质量较高。";
  if (grade === "B") return "可观察，但不是最优入场。";
  if (grade === "C") return "质量一般，需等待更好位置。";
  return "质量不足，应回避。";
}

function rrNarrative(rr: number): string {
  if (rr >= 2) return "风险收益比优秀。";
  if (rr >= 1.5) return "风险收益比可接受。";
  if (rr >= 1) return "风险收益比偏低。";
  return "目标空间不足，不适合追入。";
}

function levelRows(label: "支撑" | "阻力", levels: SupportResistanceLevel[]): string[] {
  const marker = label === "支撑" ? "支撑" : "阻力";
  return levels.slice(0, 5).map((level) => {
    const levelIcon = label === "支撑" ? "▔" : "▁";
    return `| ${levelIcon} ${marker} | ${formatNumber(level.price)} | ${level.type}, strength ${level.strength} |`;
  });
}

function priceLadder(analysis: AnalyzeResult): string {
  const prices = [
    ...analysis.supports.map((level) => level.price),
    ...analysis.resistances.map((level) => level.price),
    analysis.tradePlan.entryZone[0],
    analysis.tradePlan.entryZone[1],
    analysis.tradePlan.stop,
    ...analysis.tradePlan.targets.map((target) => target.price)
  ].sort((a, b) => b - a);
  const uniquePrices = [...new Set(prices.map((price) => formatNumber(price)))].slice(0, 12);

  const rows = uniquePrices.map((price) => {
    const tags: string[] = [];
    if (analysis.resistances.some((level) => formatNumber(level.price) === price)) tags.push("阻力");
    if (analysis.tradePlan.targets.some((target) => formatNumber(target.price) === price)) tags.push("目标");
    if (analysis.tradePlan.entryZone.map(formatNumber).includes(price)) tags.push("入场边界");
    if (formatNumber(analysis.tradePlan.stop) === price) tags.push("止损");
    if (analysis.supports.some((level) => formatNumber(level.price) === price)) tags.push("支撑");
    return `${price.padStart(8, " ")} │ ${tags.join(" / ")}`;
  });

  return ["```text", "价格阶梯", ...rows, "```"].join("\n");
}

function warningRows(warnings: string[]): string[] {
  if (warnings.length === 0) {
    return [`- ${icon("warning")} 风险提示：${badge("暂无系统警告", "#16a34a")}`];
  }

  return warnings.map((warning) => `- ${icon("warning")} 风险提示：${badge(warning, "#dc2626")}`);
}
