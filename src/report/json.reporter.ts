export function toJsonReport(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
