"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useSaveCourseGridMutation, type LedgerRow } from "@/redux/api/ledgersApi";
import { extractErrorMessage } from "@/lib/api-error";
import { bdt } from "./schedule-editor";

export const PAYMENT_METHODS = [
  { value: "", label: "জানা নেই" },
  { value: "bkash", label: "বিকাশ" },
  { value: "nagad", label: "নগদ" },
  { value: "rocket", label: "রকেট" },
  { value: "cash", label: "ক্যাশ" },
  { value: "bank", label: "ব্যাংক" },
  { value: "online", label: "অনলাইন" },
];

/**
 * Opens a ledger for a student who was enrolled before ledgers existed.
 *
 * The fee comes pre-filled from the course, so the only thing the admin has to
 * find out is how much this student has already handed over.
 */
export default function SetupLedgerModal({
  row,
  onClose,
}: {
  row: LedgerRow;
  onClose: () => void;
}) {
  const [totalFee, setTotalFee] = useState(row.total_fee);
  const [paid, setPaid] = useState(row.opening_paid || "");
  const [method, setMethod] = useState(row.opening_method || "");
  const [note, setNote] = useState(row.opening_note || "");
  const [error, setError] = useState<string | null>(null);

  const [save, { isLoading }] = useSaveCourseGridMutation();

  const due = Math.max(Number(totalFee || 0) - Number(paid || 0), 0);
  const overpaid = Number(paid || 0) > Number(totalFee || 0);

  const submit = async () => {
    setError(null);
    try {
      const result = await save({
        courseId: row.course,
        rows: [
          {
            student: row.student,
            total_fee: String(totalFee),
            opening_paid: String(paid || 0),
            opening_method: method,
            opening_note: note,
          },
        ],
      }).unwrap();
      if (result.errors.length) {
        setError(result.errors[0].detail);
        return;
      }
      onClose();
    } catch (caught) {
      setError(extractErrorMessage(caught));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">লেজার সেটআপ</h3>
            <p className="text-sm text-slate-400">{row.student_name}</p>
            <p className="text-xs text-slate-500">{row.course_title}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-400">মোট কোর্স ফি</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={totalFee}
              onChange={(event) => setTotalFee(event.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-slate-500"
            />
            <span className="text-[11px] text-slate-600">
              কোর্সের দাম থেকে বসানো — বিশেষ রেট হলে বদলে দিন
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-400">এ পর্যন্ত যা পরিশোধ করেছে</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={paid}
              onChange={(event) => setPaid(event.target.value)}
              placeholder="০"
              autoFocus
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-slate-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-400">মাধ্যম</span>
              <select
                value={method}
                onChange={(event) => setMethod(event.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-slate-500"
              >
                {PAYMENT_METHODS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-400">নোট</span>
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="যেমন: ১২ আগস্ট"
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-slate-500"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">বকেয়া দাঁড়াবে</span>
              <span className={`font-semibold ${overpaid ? "text-rose-400" : "text-amber-400"}`}>
                {overpaid ? "পরিশোধ ফি-এর বেশি" : bdt(due)}
              </span>
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-800 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">
              {error}
            </p>
          )}

          <p className="text-[11px] leading-relaxed text-slate-500">
            সেটআপের পর কিস্তির তারিখ বসাতে পারবেন। কিস্তি না বসানো পর্যন্ত কারও কোর্স বন্ধ হবে না।
          </p>

          <button
            type="button"
            disabled={isLoading || !totalFee || overpaid}
            onClick={submit}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            সংরক্ষণ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
