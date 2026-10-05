"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Save, Search, X } from "lucide-react";
import {
  useGetClassAttendanceQuery,
  useSaveClassAttendanceMutation,
  type AttendanceRow,
  type AttendanceStatus,
  type CourseClass,
} from "@/redux/api/classesApi";
import { extractErrorMessage } from "@/lib/api-error";

const statuses: { value: AttendanceStatus; label: string; tone: string }[] = [
  { value: "", label: "চিহ্নিত নয়", tone: "text-slate-300" },
  { value: "present", label: "উপস্থিত", tone: "text-emerald-300" },
  { value: "late", label: "দেরিতে", tone: "text-amber-300" },
  { value: "absent", label: "অনুপস্থিত", tone: "text-red-300" },
  { value: "excused", label: "ছুটি", tone: "text-cyan-300" },
];

export default function AttendanceModal({
  courseClass,
  onClose,
}: {
  courseClass: CourseClass;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useGetClassAttendanceQuery(courseClass.id);
  const [saveAttendance, { isLoading: isSaving }] = useSaveClassAttendanceMutation();
  const [draftRows, setDraftRows] = useState<AttendanceRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const rows = draftRows ?? data?.rows ?? [];

  const filtered = (() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      [row.student_name, row.student_code, row.student_phone]
        .join(" ")
        .toLocaleLowerCase()
        .includes(needle),
    );
  })();

  const update = (student: number, patch: Partial<AttendanceRow>) => {
    setDraftRows((current) =>
      (current ?? data?.rows ?? []).map((row) =>
        row.student === student ? { ...row, ...patch } : row,
      ),
    );
  };

  const markEveryone = (status: AttendanceStatus) => {
    setDraftRows((current) =>
      (current ?? data?.rows ?? []).map((row) => ({ ...row, status })),
    );
  };

  const save = async () => {
    setMessage(null);
    try {
      const result = await saveAttendance({
        classId: courseClass.id,
        rows: rows.map(({ student, status, note }) => ({ student, status, note })),
      }).unwrap();
      setDraftRows(result.rows);
      setMessage({ tone: "ok", text: "উপস্থিতি সংরক্ষণ হয়েছে।" });
    } catch (error) {
      setMessage({ tone: "error", text: extractErrorMessage(error) });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-3 sm:p-6">
      <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4 sm:p-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-50">উপস্থিতি · {courseClass.title}</h2>
            <p className="mt-1 text-xs text-slate-400">প্রতি শিক্ষার্থীর অবস্থা বেছে নিয়ে একবারে সংরক্ষণ করুন।</p>
          </div>
          <button type="button" onClick={onClose} aria-label="বন্ধ করুন" className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/5 text-slate-300">
            <X size={17} />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/40 px-3">
            <Search size={15} className="text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="নাম, আইডি বা ফোন দিয়ে খুঁজুন" className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500" />
          </label>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button type="button" onClick={() => markEveryone("present")} className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200">সবাই উপস্থিত</button>
            <button type="button" onClick={() => markEveryone("")} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300">সব মুছুন</button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? <p className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" /> শিক্ষার্থী লোড হচ্ছে…</p> : null}
          {isError ? <p className="py-12 text-center text-sm text-red-300">উপস্থিতির তালিকা আনা যায়নি।</p> : null}
          {!isLoading && !isError && rows.length === 0 ? <p className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">এই ব্যাচে কোনো সক্রিয় শিক্ষার্থী নেই।</p> : null}
          <div className="flex flex-col gap-3">
            {filtered.map((row) => (
              <article key={row.student} className="grid gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3 sm:grid-cols-[minmax(180px,1fr)_170px_minmax(180px,1fr)] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{row.student_name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{[row.student_code, row.student_phone].filter(Boolean).join(" · ") || `#${row.student}`}</p>
                </div>
                <select value={row.status} onChange={(event) => update(row.student, { status: event.target.value as AttendanceStatus })} className={`min-h-10 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm font-semibold outline-none ${statuses.find((item) => item.value === row.status)?.tone ?? "text-slate-300"}`}>
                  {statuses.map((status) => <option key={status.value || "none"} value={status.value}>{status.label}</option>)}
                </select>
                <input value={row.note} maxLength={255} onChange={(event) => update(row.student, { note: event.target.value })} placeholder="নোট (ঐচ্ছিক)" className="min-h-10 rounded-xl border border-slate-700 bg-slate-950/40 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500" />
              </article>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 p-4 sm:px-6">
          {message ? <p className={`mb-3 flex items-center gap-2 text-sm ${message.tone === "ok" ? "text-emerald-300" : "text-red-300"}`}>{message.tone === "ok" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}{message.text}</p> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-slate-700 px-5 text-sm font-bold text-slate-300">বন্ধ করুন</button>
            <button type="button" onClick={save} disabled={isSaving || isLoading || rows.length === 0} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white disabled:opacity-50">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? "সংরক্ষণ হচ্ছে…" : "উপস্থিতি সংরক্ষণ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
