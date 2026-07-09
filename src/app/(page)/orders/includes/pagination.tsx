import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  count: number;
  shown: number;
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
};

export default function Pagination({ count, shown, page, hasNext, hasPrev, onPageChange }: Props) {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-800 bg-slate-900 px-5 py-4">
      <p className="text-xs text-slate-400">
        মোট {count} টি অর্ডারের মধ্যে এই পাতায় {shown} টি দেখানো হচ্ছে
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={!hasPrev}
          onClick={() => onPageChange(page - 1)}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors duration-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronLeft size={14} />
        </button>

        <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500 text-sm font-medium text-white">
          {page}
        </span>

        <button
          type="button"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors duration-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
