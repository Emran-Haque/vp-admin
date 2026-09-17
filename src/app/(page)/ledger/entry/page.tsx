"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Save, Table2, TriangleAlert } from "lucide-react";
import { useGetCoursesQuery } from "@/redux/api/coursesApi";
import {
  useGetCourseGridQuery,
  useSaveCourseGridMutation,
  type LedgerRow,
} from "@/redux/api/ledgersApi";
import { extractErrorMessage } from "@/lib/api-error";
import { PageLoader } from "@/components/loaders";
import LedgerTabs from "../includes/ledger-tabs";
import { bdt } from "../includes/schedule-editor";
import { PAYMENT_METHODS } from "../includes/setup-ledger-modal";

type Draft = { total_fee: string; opening_paid: string; opening_method: string; opening_note: string };

/**
 * Spreadsheet-style entry for one course at a time.
 *
 * Built for the backlog: the office picks a course, types down the "paid"
 * column for everyone enrolled in it, and saves the whole page at once. The fee
 * is pre-filled from the course, and the due column updates as they type.
 */
export default function Page() {
  const { data: courses } = useGetCoursesQuery({});
  const [courseId, setCourseId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [onlyPending, setOnlyPending] = useState(true);
  const [result, setResult] = useState<{ saved: number; errors: { student: number; detail: string }[] } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { data: grid, isLoading } = useGetCourseGridQuery(courseId as number, {
    skip: courseId === null,
  });
  const [save, { isLoading: saving }] = useSaveCourseGridMutation();

  // Reset the typed values whenever a different course is loaded, so figures
  // from one course can never be saved against another.
  useEffect(() => {
    if (!grid) return;
    const seeded: Record<number, Draft> = {};
    for (const row of grid.rows) {
      seeded[row.student] = {
        total_fee: row.total_fee,
        opening_paid: row.opening_paid ?? "",
        opening_method: row.opening_method ?? "",
        opening_note: row.opening_note ?? "",
      };
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrafts(seeded);
    setResult(null);
  }, [grid]);

  const visible = useMemo(() => {
    const rows = grid?.rows ?? [];
    return onlyPending ? rows.filter((row) => row.state === "no_ledger") : rows;
  }, [grid, onlyPending]);

  const update = (student: number, patch: Partial<Draft>) =>
    setDrafts((current) => ({ ...current, [student]: { ...current[student], ...patch } }));

  const dueFor = (student: number) => {
    const draft = drafts[student];
    if (!draft) return 0;
    return Math.max(Number(draft.total_fee || 0) - Number(draft.opening_paid || 0), 0);
  };

  const touched = visible.filter((row) => {
    const draft = drafts[row.student];
    return draft && draft.opening_paid !== "" && draft.opening_paid !== null;
  });

  const errorFor = (student: number) =>
    result?.errors.find((entry) => entry.student === student)?.detail;

  const submit = async () => {
    if (!courseId) return;
    setMessage(null);
    try {
      const response = await save({
        courseId,
        rows: touched.map((row) => ({
          student: row.student,
          total_fee: String(drafts[row.student].total_fee),
          opening_paid: String(drafts[row.student].opening_paid || 0),
          opening_method: drafts[row.student].opening_method,
          opening_note: drafts[row.student].opening_note,
        })),
      }).unwrap();
      setResult({ saved: response.saved.length, errors: response.errors });
      setMessage(
        response.errors.length
          ? `${response.saved.length} জন সংরক্ষিত, ${response.errors.length} জনে সমস্যা।`
          : `${response.saved.length} জনের হিসাব সংরক্ষিত হয়েছে।`,
      );
    } catch (caught) {
      setMessage(extractErrorMessage(caught));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-7">
        <div className="flex items-center gap-2 text-slate-100">
          <Table2 className="size-5" />
          <h1 className="text-xl font-semibold">দ্রুত এন্ট্রি</h1>
        </div>
        <p className="mt-1.5 max-w-3xl text-sm text-slate-400">
          একটি কোর্স বেছে নিন, তারপর প্রত্যেক শিক্ষার্থী এ পর্যন্ত কত টাকা দিয়েছেন সেটি লিখে
          এক ক্লিকে পুরো পাতা সংরক্ষণ করুন। ফি কোর্স থেকে বসানো থাকে, বকেয়া নিজে থেকেই হিসাব হয়।
        </p>
      </div>

      <LedgerTabs />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={courseId ?? ""}
          onChange={(event) => setCourseId(event.target.value ? Number(event.target.value) : null)}
          className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-slate-600"
        >
          <option value="">কোর্স বেছে নিন…</option>
          {(courses?.results ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>

        {grid && (
          <>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={onlyPending}
                onChange={(event) => setOnlyPending(event.target.checked)}
                className="size-4 accent-sky-500"
              />
              শুধু সেটআপ বাকি ({grid.pending_setup})
            </label>
            <span className="text-sm text-slate-500">
              মোট {grid.total} জন · ফি {bdt(grid.course.price)}
            </span>
          </>
        )}
      </div>

      {message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            result?.errors.length
              ? "border-amber-800 bg-amber-950/40 text-amber-300"
              : "border-emerald-800 bg-emerald-950/40 text-emerald-300"
          }`}
        >
          {message}
        </div>
      )}

      {courseId === null ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-12 text-center text-sm text-slate-400">
          শুরু করতে উপরে একটি কোর্স বেছে নিন।
        </div>
      ) : isLoading ? (
        <PageLoader label="শিক্ষার্থীদের তালিকা লোড হচ্ছে…" />
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-12 text-center text-sm text-slate-400">
          {onlyPending ? "এই কোর্সে সবার হিসাব বসানো হয়ে গেছে। ✓" : "এই কোর্সে কেউ ভর্তি নেই।"}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900">
            <table className="w-full min-w-[940px] border-collapse text-left">
              <thead>
                <tr className="bg-gray-900/50 text-xs font-medium text-slate-400">
                  <th className="px-4 py-3">শিক্ষার্থী</th>
                  <th className="px-4 py-3">ফোন</th>
                  <th className="px-4 py-3 w-[130px]">মোট ফি</th>
                  <th className="px-4 py-3 w-[140px]">যা পরিশোধ করেছে</th>
                  <th className="px-4 py-3 w-[120px]">মাধ্যম</th>
                  <th className="px-4 py-3 w-[150px]">নোট</th>
                  <th className="px-4 py-3 text-right">বকেয়া</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {visible.map((row: LedgerRow) => {
                  const draft = drafts[row.student];
                  const rowError = errorFor(row.student);
                  if (!draft) return null;
                  return (
                    <tr
                      key={row.student}
                      className={`border-t border-slate-800 ${rowError ? "bg-rose-950/20" : ""}`}
                    >
                      <td className="px-4 py-2">
                        <div className="font-medium text-slate-100">{row.student_name}</div>
                        <div className="text-xs text-slate-500">#{row.student}</div>
                        {rowError && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-rose-400">
                            <TriangleAlert className="size-3" /> {rowError}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-400">
                        {row.student_phone || row.student_email}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft.total_fee}
                          onChange={(event) => update(row.student, { total_fee: event.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-slate-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft.opening_paid}
                          onChange={(event) =>
                            update(row.student, { opening_paid: event.target.value })
                          }
                          placeholder="—"
                          className="w-full rounded-lg border border-slate-600 bg-slate-950 px-2.5 py-1.5 text-sm font-medium text-slate-100 outline-none focus:border-sky-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={draft.opening_method}
                          onChange={(event) =>
                            update(row.student, { opening_method: event.target.value })
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-slate-500"
                        >
                          {PAYMENT_METHODS.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={draft.opening_note}
                          onChange={(event) =>
                            update(row.student, { opening_note: event.target.value })
                          }
                          placeholder="—"
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-slate-500"
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-amber-400">
                        {draft.opening_paid === "" ? (
                          <span className="text-slate-600">—</span>
                        ) : Number(draft.opening_paid) > Number(draft.total_fee) ? (
                          <span className="text-rose-400">ফি-এর বেশি</span>
                        ) : (
                          bdt(dueFor(row.student))
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-950/95 px-5 py-3.5 backdrop-blur">
            <span className="text-sm text-slate-400">
              {touched.length > 0 ? (
                <>
                  <CheckCircle2 className="mr-1.5 inline size-4 text-emerald-400" />
                  {touched.length} জনের তথ্য লেখা হয়েছে
                </>
              ) : (
                "যাদের তথ্য লিখবেন শুধু তারাই সংরক্ষিত হবে"
              )}
            </span>
            <button
              type="button"
              disabled={touched.length === 0 || saving}
              onClick={submit}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
            >
              <Save className="size-4" />
              {saving ? "সংরক্ষণ হচ্ছে…" : "সব সংরক্ষণ করুন"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
