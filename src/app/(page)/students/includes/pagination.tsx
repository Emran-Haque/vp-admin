import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  count: number;
  page: number;
  pageSize: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  /** Screen-reader name of the list. Defaults to the student list's. */
  ariaLabel?: string;
  /** "Showing x–y of n" line. Defaults to the student list's wording. */
  summary?: (range: { start: number; end: number; count: number }) => string;
  /** For a pager inside an existing card: no box of its own. */
  compact?: boolean;
};

/** First, last, and the current page with one neighbour each side; gaps become "…". */
function pageItems(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  // Near an edge, widen the run so the bar doesn't shrink to three buttons.
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((p) => pages.add(p));

  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    const gap = i > 0 ? p - sorted[i - 1] : 1;
    // A "…" standing in for a single page hides nothing worth hiding.
    if (gap === 2) items.push(p - 1);
    else if (gap > 2) items.push("gap");
    items.push(p);
  });
  return items;
}

const navButton =
  "flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors duration-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

export default function Pagination({
  count,
  page,
  pageSize,
  disabled = false,
  onPageChange,
  ariaLabel = "শিক্ষার্থী তালিকার পাতা",
  summary,
  compact = false,
}: Props) {
  if (count === 0) return null;

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, count);

  return (
    <nav
      aria-label={ariaLabel}
      className={
        compact
          ? "flex flex-col items-center gap-2.5 sm:flex-row sm:justify-between sm:gap-3"
          : "flex flex-col items-center gap-2.5 rounded-2xl border border-slate-800 bg-slate-900 px-3 py-3 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-3 sm:rounded-3xl sm:px-5 sm:py-4"
      }
    >
      <p className="text-xs text-slate-400">
        {summary ? summary({ start, end, count }) : `মোট ${count} জন শিক্ষার্থীর মধ্যে ${start}–${end} দেখানো হচ্ছে`}
      </p>

      {totalPages > 1 && (
        // Phones: prev · "3 / 12" · next, so the bar never wraps or overflows.
        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="আগের পাতা"
            className={navButton}
          >
            <ChevronLeft size={14} />
          </button>
          <span aria-current="page" className="min-w-16 text-center text-sm font-medium text-slate-300">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={disabled || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="পরের পাতা"
            className={navButton}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {totalPages > 1 && (
        <div className="hidden flex-wrap items-center gap-1.5 sm:flex">
          <button
            type="button"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="আগের পাতা"
            className={navButton}
          >
            <ChevronLeft size={14} />
          </button>

          {pageItems(page, totalPages).map((item, i) =>
            item === "gap" ? (
              <span key={`gap-${i}`} className="flex size-8 items-center justify-center text-sm text-slate-500">
                …
              </span>
            ) : item === page ? (
              <span
                key={item}
                aria-current="page"
                className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-blue-500 px-2 text-sm font-medium text-white"
              >
                {item}
              </span>
            ) : (
              <button
                key={item}
                type="button"
                disabled={disabled}
                onClick={() => onPageChange(item)}
                className="flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-800 px-2 text-sm text-slate-300 transition-colors duration-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {item}
              </button>
            )
          )}

          <button
            type="button"
            disabled={disabled || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="পরের পাতা"
            className={navButton}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </nav>
  );
}
