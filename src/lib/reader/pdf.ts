/** Confini condivisi tra controlli, collegamenti PDF e test. */
export function pdfPage(value: unknown, total: number): number {
  const page = Number(value);
  return Math.max(
    1,
    Math.min(Math.max(1, total), Number.isFinite(page) ? Math.trunc(page) : 1),
  );
}
export function pageFromHash(hash: string, total: number): number {
  return pdfPage(
    new URLSearchParams(hash.replace(/^#/, "")).get("page"),
    total,
  );
}
export function safePdfLink(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["https:", "http:", "mailto:"].includes(url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function renderDensity(
  width: number,
  height: number,
  deviceRatio: number,
): number {
  return Math.min(
    Math.max(1, deviceRatio || 1),
    2,
    Math.sqrt(6_000_000 / Math.max(1, width * height)),
  );
}
