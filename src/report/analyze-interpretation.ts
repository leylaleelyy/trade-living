import type { AnalyzeResult } from "../domain/types.js";

export interface AnalyzeInterpretation {
  conclusion: {
    label: string;
    reason: string;
  };
  statuses: {
    marketRegime: StatusInterpretation;
    tripleScreen: StatusInterpretation;
    tradeQuality: StatusInterpretation;
    macdDivergence: StatusInterpretation;
    forceIndexDivergence: StatusInterpretation;
    monthlyTrend: StatusInterpretation;
    weeklyTrend: StatusInterpretation;
    riskReward: StatusInterpretation;
  };
  warningsZh: string[];
  positionNotesZh?: string[];
}

interface StatusInterpretation {
  value: string;
  label: string;
  zh: string;
  narrative: string;
}

export function isAnalyzeResult(value: unknown): value is AnalyzeResult {
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

export function buildAnalyzeInterpretation(analysis: AnalyzeResult): AnalyzeInterpretation {
  return {
    conclusion: decideAction(analysis),
    statuses: {
      marketRegime: {
        value: analysis.marketRegime,
        label: formatRegime(analysis.marketRegime),
        zh: regimeZh(analysis.marketRegime),
        narrative: regimeNarrative(analysis.marketRegime)
      },
      tripleScreen: {
        value: analysis.tripleScreen.decision,
        label: formatDecision(analysis.tripleScreen.decision),
        zh: decisionZh(analysis.tripleScreen.decision),
        narrative: decisionNarrative(analysis.tripleScreen.decision)
      },
      tradeQuality: {
        value: analysis.tradeQuality.grade,
        label: formatTradeQuality(analysis.tradeQuality.grade),
        zh: tradeQualityZh(analysis.tradeQuality.grade),
        narrative: qualityNarrative(analysis.tradeQuality.grade)
      },
      macdDivergence: {
        value: analysis.divergence.macd,
        label: formatDivergence(analysis.divergence.macd),
        zh: divergenceZh(analysis.divergence.macd),
        narrative: divergenceNarrative(analysis.divergence.macd)
      },
      forceIndexDivergence: {
        value: analysis.divergence.forceIndex,
        label: formatDivergence(analysis.divergence.forceIndex),
        zh: divergenceZh(analysis.divergence.forceIndex),
        narrative: divergenceNarrative(analysis.divergence.forceIndex)
      },
      monthlyTrend: {
        value: analysis.tripleScreen.monthlyTrend,
        label: formatTrend(analysis.tripleScreen.monthlyTrend),
        zh: trendZh(analysis.tripleScreen.monthlyTrend),
        narrative: trendNarrative(analysis.tripleScreen.monthlyTrend, "月线")
      },
      weeklyTrend: {
        value: analysis.tripleScreen.weeklyTrend,
        label: formatTrend(analysis.tripleScreen.weeklyTrend),
        zh: trendZh(analysis.tripleScreen.weeklyTrend),
        narrative: trendNarrative(analysis.tripleScreen.weeklyTrend, "周线")
      },
      riskReward: {
        value: String(bestRiskReward(analysis)),
        label: `${bestRiskReward(analysis)}（${riskRewardZh(bestRiskReward(analysis))}）`,
        zh: riskRewardZh(bestRiskReward(analysis)),
        narrative: riskRewardNarrative(bestRiskReward(analysis))
      }
    },
    warningsZh: analysis.warnings.map(formatWarning),
    ...(analysis.position
      ? { positionNotesZh: analysis.position.notes.map(formatPositionNote) }
      : {})
  };
}

export function decideAction(analysis: AnalyzeResult): { label: string; reason: string } {
  const bestRr = Math.max(...analysis.tradePlan.targets.map((target) => target.rr), 0);

  if (analysis.tradeQuality.grade === "Avoid" || analysis.tripleScreen.decision === "avoid") {
    return {
      label: "回避",
      reason: "系统质量或 Triple Screen（三重滤网）已经进入回避状态，优先保护本金。"
    };
  }

  if (analysis.momentum.score >= 75 && bestRr >= 1.5 && analysis.tripleScreen.decision !== "neutral") {
    return {
      label: "重点跟踪",
      reason: "趋势、动量和风险收益比同时满足较高质量条件，可以进入重点观察清单。"
    };
  }

  if (analysis.momentum.score >= 70) {
    return {
      label: "强势但等待触发",
      reason: "动量结构较强，但入场触发或风险收益比仍需改善，适合等待回踩或突破确认。"
    };
  }

  return {
    label: "普通观察",
    reason: "当前信号尚未形成高质量交易计划，适合继续观察关键价位。"
  };
}

export function formatRegime(regime: AnalyzeResult["marketRegime"]): string {
  return `${regime.replaceAll("_", " ")}（${regimeZh(regime)}）`;
}

export function formatDecision(decision: AnalyzeResult["tripleScreen"]["decision"]): string {
  return `${decision.replaceAll("_", " ")}（${decisionZh(decision)}）`;
}

export function formatTradeQuality(grade: AnalyzeResult["tradeQuality"]["grade"]): string {
  return `${grade}（${tradeQualityZh(grade)}）`;
}

export function formatDivergence(divergence: string): string {
  return `${divergence.replaceAll("_", " ")}（${divergenceZh(divergence)}）`;
}

export function formatTrend(trend: string): string {
  return `${trend.replaceAll("_", " ")}（${trendZh(trend)}）`;
}

export function formatWarning(warning: string): string {
  const labels: Record<string, string> = {
    "Risk/reward is below the preferred threshold.": "Risk/reward is below the preferred threshold.（风险收益比低于偏好阈值。）",
    "MACD bearish divergence detected.": "MACD bearish divergence detected.（MACD 出现看跌背离。）",
    "Force Index momentum is weakening.": "Force Index momentum is weakening.（强力指数动能正在走弱。）"
  };

  return labels[warning] ?? warning;
}

export function formatPositionNote(note: string): string {
  const labels: Record<string, string> = {
    "Existing holding detected; evaluate this as position management, not a fresh idea.": "Existing holding detected; evaluate this as position management, not a fresh idea.（检测到已有持仓，应按持仓管理评估，而不是当作新的买入想法。）",
    "Existing holding detected; evaluate this as position management.": "Existing holding detected; evaluate this as position management.（检测到已有持仓，应按持仓管理评估。）",
    "Position is currently profitable; protect against giving back gains if quality weakens.": "Position is currently profitable; protect against giving back gains if quality weakens.（当前持仓为浮盈，若质量走弱，应优先保护利润。）",
    "Position is currently at a loss; avoid averaging down without a fresh high-quality setup.": "Position is currently at a loss; avoid averaging down without a fresh high-quality setup.（当前持仓为浮亏，缺少新的高质量信号时避免摊低成本。）",
    "Current price is at or below the analysis stop; the existing plan is already invalidated.": "Current price is at or below the analysis stop; the existing plan is already invalidated.（当前价格已经触及或低于分析止损位，原计划已经失效。）",
    "Risk-to-stop is calculated from current holding size and the analysis stop.": "Risk-to-stop is calculated from current holding size and the analysis stop.（到止损风险按当前持仓数量和分析止损位估算。）",
    "Portfolio weight is high; concentration risk matters more than a standalone signal.": "Portfolio weight is high; concentration risk matters more than a standalone signal.（组合占比较高，集中度风险比单一信号更重要。）",
    "Trade quality or RR is weak; prioritize hold/reduce discipline over adding exposure.": "Trade quality or RR is weak; prioritize hold/reduce discipline over adding exposure.（交易质量或风险收益比偏弱，应优先执行持有/减仓纪律，而不是增加敞口。）"
  };

  return labels[note] ?? note;
}

export function regimeNarrative(regime: AnalyzeResult["marketRegime"]): string {
  const narratives: Record<AnalyzeResult["marketRegime"], string> = {
    trending_bull: "多头趋势占优，优先寻找顺势机会。",
    trending_bear: "空头趋势占优，避免逆势抄底。",
    range: "区间震荡，重视上下沿和假突破。",
    volatile: "波动放大，仓位和止损需要更保守。",
    compression: "波动压缩，等待方向选择。"
  };

  return narratives[regime];
}

export function decisionNarrative(decision: AnalyzeResult["tripleScreen"]["decision"]): string {
  const narratives: Record<AnalyzeResult["tripleScreen"]["decision"], string> = {
    buy_watch: "进入买入观察，但仍需触发条件。",
    sell_watch: "进入卖出观察，注意趋势转弱。",
    avoid: "系统建议回避。",
    neutral: "趋势存在，但触发条件不足。"
  };

  return narratives[decision];
}

export function qualityNarrative(grade: AnalyzeResult["tradeQuality"]["grade"]): string {
  if (grade === "A+" || grade === "A") return "交易计划质量较高。";
  if (grade === "B") return "可观察，但不是最优入场。";
  if (grade === "C") return "质量一般，需等待更好位置。";
  return "质量不足，应回避。";
}

export function riskRewardNarrative(rr: number): string {
  if (rr >= 2) return "风险收益比优秀，目标空间相对充分。";
  if (rr >= 1.5) return "风险收益比可接受，但仍需配合趋势和触发信号。";
  if (rr >= 1) return "风险收益比偏低，不适合在阻力附近追入。";
  return "目标空间不足，赔率不支持主动加仓。";
}

function regimeZh(regime: AnalyzeResult["marketRegime"]): string {
  const labels: Record<AnalyzeResult["marketRegime"], string> = {
    trending_bull: "趋势多头",
    trending_bear: "趋势空头",
    range: "区间震荡",
    volatile: "高波动",
    compression: "波动压缩"
  };

  return labels[regime];
}

function decisionZh(decision: AnalyzeResult["tripleScreen"]["decision"]): string {
  const labels: Record<AnalyzeResult["tripleScreen"]["decision"], string> = {
    buy_watch: "买入观察",
    sell_watch: "卖出观察",
    avoid: "回避",
    neutral: "中性"
  };

  return labels[decision];
}

function tradeQualityZh(grade: AnalyzeResult["tradeQuality"]["grade"]): string {
  if (grade === "A+") return "极高质量";
  if (grade === "A") return "高质量";
  if (grade === "B") return "可观察";
  if (grade === "C") return "质量一般";
  return "回避";
}

function trendZh(trend: string): string {
  const labels: Record<string, string> = {
    bullish: "看涨",
    bearish: "看跌",
    neutral: "中性"
  };

  return labels[trend] ?? trend;
}

function trendNarrative(trend: string, timeframe: "月线" | "周线"): string {
  if (trend === "bullish") return `${timeframe}趋势偏多，是三重滤网的顺势条件。`;
  if (trend === "bearish") return `${timeframe}趋势偏空，顺势条件偏防守。`;
  return `${timeframe}趋势中性，方向优势不明确。`;
}

function riskRewardZh(rr: number): string {
  if (rr >= 2) return "优秀";
  if (rr >= 1.5) return "可接受";
  if (rr >= 1) return "偏低";
  return "不足";
}

function divergenceZh(divergence: string): string {
  const labels: Record<string, string> = {
    none: "无",
    bullish: "看涨",
    bearish: "看跌",
    bearish_hidden: "隐性看跌"
  };

  return labels[divergence] ?? divergence;
}

function divergenceNarrative(divergence: string): string {
  if (divergence === "none") return "未检测到背离。";
  if (divergence === "bullish") return "检测到看涨背离，短线修复概率提高。";
  if (divergence === "bearish" || divergence === "bearish_hidden") return "检测到看跌背离，需警惕动能衰减。";
  return "背离状态未知。";
}

function bestRiskReward(analysis: AnalyzeResult): number {
  return Math.max(...analysis.tradePlan.targets.map((target) => target.rr), 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}
