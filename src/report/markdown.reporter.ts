export function toMarkdownReport(title: string, rows: Record<string, unknown>): string {
  const body = Object.entries(rows)
    .map(([key, value]) => `- **${key}**: ${formatValue(value)}`)
    .join("\n");

  return `# ${title}\n\n${body}\n`;
}

function formatValue(value: unknown): string {
  if (typeof value === "object" && value !== null) {
    return `\`${JSON.stringify(value)}\``;
  }

  return String(value);
}
