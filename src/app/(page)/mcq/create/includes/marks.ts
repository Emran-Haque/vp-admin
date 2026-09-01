import type { Question } from "./types";

/**
 * What a paper is actually worth, given that a question's `marks` may be blank.
 *
 * A blank means "inherit the exam default" rather than zero — that is what lets
 * an ordinary 1-mark paper (and any CSV with no `marks` column) be authored
 * without touching the field at all. The same resolution happens server-side
 * when the question is saved, so these figures match what the API will store.
 */
export type MarksTally = {
  /** Sum of every question's effective marks. */
  total: number;
  /** Distinct mark values present, cheapest first. */
  tiers: string[];
  /** True when the paper mixes more than one mark value — CU C unit does. */
  isMixed: boolean;
  /** Human summary of the mix, e.g. "75 × 1 + 25 × 2". Empty when uniform. */
  summary: string;
};

export function tallyMarks(questions: Question[], defaultMarks: string): MarksTally {
  const effective = questions.map((q) => q.marks.trim() || defaultMarks);
  const total = effective.reduce((sum, value) => sum + (Number(value) || 0), 0);
  const tiers = [...new Set(effective)].sort((a, b) => Number(a) - Number(b));
  const isMixed = tiers.length > 1;

  return {
    total,
    tiers,
    isMixed,
    summary: isMixed
      ? tiers
          .map((tier) => `${effective.filter((mark) => mark === tier).length} × ${tier}`)
          .join(" + ")
      : "",
  };
}

/** Re-exported so the wizard keeps one import for everything marks-related. */
export { formatMarks as normalizeMarks } from "@/lib/marks";
