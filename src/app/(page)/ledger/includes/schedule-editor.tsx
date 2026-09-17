"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ScheduleRow } from "@/redux/api/ledgersApi";

export const bdt = (value: string | number) =>
  `৳${Number(value || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;

export const sumRows = (rows: ScheduleRow[]) =>
  rows.reduce((total, row) => total + (Number(row.amount) || 0), 0);

type Props = {
  rows: ScheduleRow[];
  onChange: (rows: ScheduleRow[]) => void;
  /** What the student still owes. The schedule must total exactly this. */
  remaining: number;
};

/**
 * Manual installment entry.
 *
 * Every amount and date is typed by the admin after the phone call — nothing
 * here divides the balance or picks dates. The only job of this component is to
 * show, live, whether what was typed adds up to the remaining balance.
 */
export default function ScheduleEditor({ rows, onChange, remaining }: Props) {
  const total = sumRows(rows);
  const difference = Number((total - remaining).toFixed(2));
  const balanced = difference === 0;

  const update = (index: number, patch: Partial<ScheduleRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const addRow = () => onChange([...rows, { amount: "", due_date: "" }]);
  const removeRow = (index: number) => onChange(rows.filter((_, i) => i !== index));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-200">নতুন কিস্তির তালিকা</h4>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
        >
          <Plus className="size-3.5" /> কিস্তি যোগ করুন
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-7 shrink-0 text-center text-xs text-slate-500">{index + 1}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={row.amount}
              onChange={(event) => update(index, { amount: event.target.value })}
              placeholder="পরিমাণ"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500"
            />
            <input
              type="date"
              value={row.due_date}
              onChange={(event) => update(index, { due_date: event.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500"
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              disabled={rows.length === 1}
              className="shrink-0 rounded-xl border border-slate-700 p-2 text-slate-400 hover:text-rose-400 disabled:opacity-30"
              aria-label="কিস্তি মুছুন"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      {/* The §4 reconciliation panel: never auto-corrected, only reported. */}
      <div
        className={`rounded-2xl border px-4 py-3 text-sm ${
          balanced
            ? "border-emerald-800 bg-emerald-950/40 text-emerald-300"
            : "border-amber-800 bg-amber-950/40 text-amber-300"
        }`}
      >
        <div className="flex justify-between">
          <span className="text-slate-400">বকেয়া ব্যালেন্স</span>
          <span className="font-medium">{bdt(remaining)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">নতুন তালিকার মোট</span>
          <span className="font-medium">{bdt(total)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-slate-700/60 pt-1 font-semibold">
          <span>পার্থক্য</span>
          <span>{balanced ? "০ — মিলে গেছে" : bdt(Math.abs(difference))}</span>
        </div>
        {!balanced && (
          <p className="mt-1.5 text-xs text-amber-400/80">
            মোট অঙ্ক বকেয়ার সমান না হলে কোড তৈরি করা যাবে না। ছাড় দিতে চাইলে আলাদাভাবে
            অনুমোদিত ডিসকাউন্ট হিসেবে রেকর্ড করুন।
          </p>
        )}
      </div>
    </div>
  );
}
