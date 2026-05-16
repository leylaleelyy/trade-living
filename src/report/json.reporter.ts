import {
  buildAnalyzeInterpretation,
  isAnalyzeResult
} from "./analyze-interpretation.js";

export function toJsonReport(value: unknown): string {
  return JSON.stringify(enrichJsonValue(value), null, 2);
}

function enrichJsonValue(value: unknown): unknown {
  if (isAnalyzeResult(value)) {
    return {
      ...value,
      interpretation: buildAnalyzeInterpretation(value)
    };
  }

  return value;
}
