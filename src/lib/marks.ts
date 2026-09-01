/**
 * Display a mark without its stored decimals.
 *
 * The API stores marks as fixed-point decimals, so a 2-mark question comes back
 * as "2.00" and a 100-mark assignment as "100.00". That is right for storage
 * and wrong for reading — every place that shows a mark to a person wants "2"
 * and "100". A genuine fraction keeps its decimals, so "1.50" still reads 1.5.
 */
export function formatMarks(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const parsed = Number(value);
  // Not a number (already formatted, or unexpected) — show it as-is rather
  // than swallowing it.
  if (!Number.isFinite(parsed)) return String(value);
  return String(parsed);
}
