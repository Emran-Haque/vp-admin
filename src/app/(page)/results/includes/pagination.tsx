import { ChevronLeft, ChevronRight } from "lucide-react";
import { results } from "./types";

export default function Pagination() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3.5">
      <p className="text-xs text-slate-400">
        মোট {results.length} টি ফলাফলের মধ্যে ১-{results.length} দেখানো হচ্ছে
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400"
        >
          <ChevronLeft size={14} />
        </button>
        {[1, 2, 3].map((page) => (
          <button
            key={page}
            type="button"
            className={`flex size-8 items-center justify-center rounded-lg text-sm font-medium ${
              page === 1 ? "bg-blue-500 text-white" : "border border-slate-800 text-slate-400"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
