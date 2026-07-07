import { Search, ChevronDown } from "lucide-react";

export default function Toolbar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
      <div className="relative min-w-64 flex-1">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="শিক্ষার্থী, আইডি বা পরীক্ষা খুঁজুন..."
          className="w-full rounded-2xl border border-slate-800 bg-gray-900 py-2 pl-8 pr-3 text-xs text-blue-50 placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      <button
        type="button"
        className="flex items-center gap-6 rounded-lg border border-slate-800 bg-gray-800 px-4 py-2.5 text-xs text-white"
      >
        সকল কোর্স
        <ChevronDown size={16} />
      </button>

      <button
        type="button"
        className="flex items-center gap-6 rounded-lg border border-slate-800 bg-gray-800 px-4 py-2.5 text-xs text-white"
      >
        স্ট্যাটাস
        <ChevronDown size={16} />
      </button>
    </div>
  );
}
