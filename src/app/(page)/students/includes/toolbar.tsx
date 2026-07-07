import { Search, SlidersHorizontal, ChevronDown, Download } from "lucide-react";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
};

export default function Toolbar({ search, onSearchChange }: Props) {
  return (
    <section className="flex flex-wrap items-center gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="relative min-w-64 flex-1">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
          className="w-full rounded-xl border border-slate-800 bg-gray-800 py-3 pl-11 pr-4 text-base text-white placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <SlidersHorizontal size={20} className="shrink-0 text-slate-400" />

      <button
        type="button"
        className="flex items-center gap-6 rounded-xl border border-slate-800 bg-gray-800 px-5 py-3 text-base text-white"
      >
        সব ব্যাচ
        <ChevronDown size={16} />
      </button>

      <button
        type="button"
        className="flex items-center gap-6 rounded-xl border border-slate-800 bg-gray-800 px-5 py-3 text-base text-white"
      >
        স্ট্যাটাস
        <ChevronDown size={16} />
      </button>

      <button
        type="button"
        className="flex items-center gap-2 rounded-2xl border border-slate-800 px-4 py-2 text-base font-semibold text-blue-50"
      >
        <Download size={16} />
        এক্সপোর্ট
      </button>
    </section>
  );
}
