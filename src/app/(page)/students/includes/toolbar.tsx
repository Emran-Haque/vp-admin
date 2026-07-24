"use client";

import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, ChevronDown, Download } from "lucide-react";

export type StatusFilter = "" | "active" | "inactive" | "pending";

type Option = { value: string; label: string };

const STATUS_OPTIONS: Option[] = [
  { value: "active", label: "সক্রিয়" },
  { value: "inactive", label: "নিষ্ক্রিয়" },
  { value: "pending", label: "অপেক্ষমাণ" },
];

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  batch: string;
  onBatchChange: (value: string) => void;
  batchOptions: string[];
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
};

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-6 rounded-xl border border-slate-800 bg-gray-800 px-5 py-3 text-base text-white"
      >
        {selectedLabel ?? label}
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-800 bg-gray-800 p-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 ${
              value === "" ? "bg-slate-700 text-white" : ""
            }`}
          >
            {label}
          </button>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 ${
                value === option.value ? "bg-slate-700 text-white" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Toolbar({
  search,
  onSearchChange,
  batch,
  onBatchChange,
  batchOptions,
  status,
  onStatusChange,
}: Props) {
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

      <FilterDropdown
        label="সব ব্যাচ"
        value={batch}
        onChange={onBatchChange}
        options={batchOptions.map((b) => ({ value: b, label: b }))}
      />

      <FilterDropdown label="স্ট্যাটাস" value={status} onChange={(v) => onStatusChange(v as StatusFilter)} options={STATUS_OPTIONS} />

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
