import { Search } from "lucide-react";

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
          placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
          className="w-full rounded-xl border border-slate-800 bg-gray-800 py-3 pl-11 pr-4 text-base text-white placeholder:text-slate-400 focus:outline-none"
        />
      </div>
    </section>
  );
}
