export function sanitizeIdentifier(input: string): string {
  const normalized = input.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return normalized.replace(/_{2,}/g, "_").replace(/^_|_$/g, "");
}

export function quoteIdentifier(id: string): string {
  // Double-quote identifier and escape existing quotes
  return '"' + id.replace(/"/g, '""') + '"';
}
