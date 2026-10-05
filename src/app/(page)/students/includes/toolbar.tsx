"use client";

import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, ChevronDown, Download } from "lucide-react";

export type StatusFilter = "" | "active" | "inactive" | "pending";

export const NOT_ENROLLED_VALUE = "__not_enrolled__";

type Option = { value: string; label: string };

const STATUS_OPTIONS: Option[] = [
  { value: "active", label: "সক্রিয়" },
  { value: "inactive", label: "নিষ্ক্রিয়" },
  { value: "pending", label: "পেন্ডিং" },
];

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  course: string;
  onCourseChange: (value: string) => void;
  courseOptions: Option[];
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  canExport: boolean;
  onExport: () => void;
  isExporting: boolean;
};

function FilterDropdown({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  /** Wrapper width on phones (desktop keeps its natural width). */
  className?: string;
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
    <div ref={ref} className={`relative sm:w-auto ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-800 bg-gray-800 px-3.5 py-2.5 text-sm text-white sm:w-auto sm:justify-start sm:gap-6 sm:px-5 sm:py-3 sm:text-base"
      >
        <span className="min-w-0 truncate">{selectedLabel ?? label}</span>
        <ChevronDown size={16} className="shrink-0" />
      </button>

      {open && (
        // Phones: as wide as its button, so it never runs off the screen.
        <div className="absolute left-0 right-0 z-20 mt-2 rounded-xl border border-slate-800 bg-gray-800 p-1 shadow-lg sm:left-auto sm:w-48">
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
  course,
  onCourseChange,
  courseOptions,
  status,
  onStatusChange,
  canExport,
  onExport,
  isExporting,
}: Props) {
  return (
    <section className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-slate-800 bg-slate-900 p-3 sm:gap-4 sm:rounded-3xl sm:p-6">
      <div className="relative w-full sm:w-auto sm:min-w-64 sm:flex-1">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="নাম, আইডি, ফোন বা ইমেইল দিয়ে খুঁজুন..."
          className="w-full rounded-xl border border-slate-800 bg-gray-800 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-400 focus:outline-none sm:py-3 sm:text-base"
        />
      </div>

      <SlidersHorizontal size={20} className="hidden shrink-0 text-slate-400 sm:block" />

      <FilterDropdown
        label="সব কোর্স"
        value={course}
        onChange={onCourseChange}
        options={courseOptions}
        className="w-full"
      />

      <FilterDropdown
        label="স্ট্যাটাস"
        value={status}
        onChange={(v) => onStatusChange(v as StatusFilter)}
        options={STATUS_OPTIONS}
        className="flex-1 sm:flex-none"
      />

      {canExport && (
        <button
          type="button"
          onClick={onExport}
          disabled={!course || isExporting}
          title={!course ? "এক্সপোর্ট করতে একটি কোর্স নির্বাচন করুন" : undefined}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-semibold text-blue-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:rounded-2xl sm:py-2 sm:text-base"
        >
          <Download size={16} />
          {isExporting ? "এক্সপোর্ট হচ্ছে…" : "এক্সপোর্ট"}
        </button>
      )}
    </section>
  );
}
