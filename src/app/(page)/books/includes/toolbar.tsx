"use client";

import { Search } from "lucide-react";
import { useGetBookCategoriesQuery } from "@/redux/api/booksApi";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  availability: string;
  onAvailabilityChange: (value: string) => void;
};

export default function Toolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  availability,
  onAvailabilityChange,
}: Props) {
  const { data: categoriesData } = useGetBookCategoriesQuery();
  const categories = categoriesData?.results ?? [];

  return (
    <section className="flex flex-wrap items-center gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="relative min-w-64 flex-1">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="নাম, লেখক বা প্রকাশক দিয়ে খুঁজুন..."
          className="w-full rounded-xl border border-slate-800 bg-gray-800 py-3 pl-11 pr-4 text-base text-white placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="cursor-pointer rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-white focus:outline-none"
      >
        <option value="">সব ক্যাটাগরি</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={availability}
        onChange={(e) => onAvailabilityChange(e.target.value)}
        className="cursor-pointer rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-white focus:outline-none"
      >
        <option value="">সব স্ট্যাটাস</option>
        <option value="true">উপলব্ধ</option>
        <option value="false">অনুপলব্ধ</option>
      </select>
    </section>
  );
}
