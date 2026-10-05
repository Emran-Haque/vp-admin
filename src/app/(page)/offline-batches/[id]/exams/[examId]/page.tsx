"use client";

import StudentAvatar from "@/components/student-avatar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Search,
  Send,
  UserX,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useGetOfflineMarksQuery,
  usePublishOfflineResultMutation,
  useSaveOfflineMarksMutation,
  type OfflineMarkInput,
  type OfflineMarkRow,
  type OfflineMarksErrorBody,
} from "@/redux/api/examsApi";
import ConfirmActionDialog from "@/components/confirm-action-dialog";
import ErrorState from "@/components/error-state";
import { extractErrorMessage } from "@/lib/api-error";

/**
 * Marks entry for one offline (paper) exam.
 *
 * Every enrolled student is listed with their ID and name already filled in;
 * the admin only marks present/absent and types obtained marks and wrong
 * answers. Rows save themselves shortly after typing stops, so there is no
 * save button to forget. The final mark is worked out as you type with the
 * same rule the server uses: obtained − wrong × (marks lost per wrong answer).
 */

type Draft = { present: boolean | null; obtained: string; wrong: string };

const AUTOSAVE_DELAY_MS = 700;
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Accept Bangla digits too — admins often type with a Bangla keyboard. */
function toAsciiDigits(value: string) {
  return value.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

function bn(value: number | string) {
  return Number(value).toLocaleString("bn-BD", { maximumFractionDigits: 2 });
}

function draftFromRow(row: OfflineMarkRow): Draft {
  return {
    present: row.is_present,
    obtained: row.obtained_marks !== null ? String(Number(row.obtained_marks)) : "",
    wrong: row.wrong_count ? String(row.wrong_count) : "",
  };
}

/** Why a row cannot be saved yet, or null when it can. */
function rowProblem(draft: Draft, total: number): string | null {
  if (draft.present !== true) return null;
  if (draft.obtained.trim() === "") return "প্রাপ্ত নম্বর দিন";
  const obtained = Number(draft.obtained);
  if (!Number.isFinite(obtained)) return "নম্বর সঠিক নয়";
  if (obtained < 0 || obtained > total) return `০ থেকে ${bn(total)} এর মধ্যে দিন`;
  if (draft.wrong.trim() !== "") {
    const wrong = Number(draft.wrong);
    if (!Number.isInteger(wrong) || wrong < 0) return "ভুলের সংখ্যা সঠিক নয়";
  }
  return null;
}

function finalMarks(draft: Draft, perWrong: number): number | null {
  if (draft.present !== true || draft.obtained.trim() === "") return null;
  const obtained = Number(draft.obtained);
  const wrong = draft.wrong.trim() === "" ? 0 : Number(draft.wrong);
  if (!Number.isFinite(obtained) || !Number.isFinite(wrong)) return null;
  return Math.round((obtained - wrong * perWrong) * 100) / 100;
}

/**
 * Split local edits into what can be sent now. Incomplete rows (marked present
 * with no marks yet, or a mark out of range) wait. A row the server rejected
 * is held back until the admin edits it again — otherwise every save round
 * would resend it and fail the whole batch again.
 */
function splitDrafts(
  drafts: Record<number, Draft>,
  rowErrors: Record<number, string>,
  rowsById: Map<number, OfflineMarkRow>,
  published: boolean,
  total: number,
) {
  const payload: OfflineMarkInput[] = [];
  const sent: Record<number, Draft> = {};
  for (const [key, draft] of Object.entries(drafts)) {
    const studentId = Number(key);
    const row = rowsById.get(studentId);
    if (!row || studentId in rowErrors) continue;
    if (draft.present === false) {
      payload.push({ student: studentId, is_present: false });
    } else if (draft.present === true) {
      if (draft.obtained.trim() === "") {
        // Emptied a saved row: blank it again (only allowed before publishing).
        if (row.entered && !published) payload.push({ student: studentId, clear: true });
        else continue;
      } else if (rowProblem(draft, total)) {
        continue;
      } else {
        payload.push({
          student: studentId,
          is_present: true,
          obtained_marks: String(Number(draft.obtained)),
          wrong_count: draft.wrong.trim() === "" ? 0 : Number(draft.wrong),
        });
      }
    } else {
      continue;
    }
    sent[studentId] = draft;
  }
  return { payload, sent };
}

export default function Page() {
  const params = useParams<{ id: string; examId: string }>();
  const courseId = Number(params.id);
  const examId = Number(params.examId);
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("can_edit_exam");
  const canPublish = hasPermission("can_publish_result");

  const { data: sheet, isLoading, isError, error } = useGetOfflineMarksQuery(examId, {
    skip: !examId,
  });
  const [saveMarks] = useSaveOfflineMarksMutation();
  const [publishResult, { isLoading: isPublishing }] = usePublishOfflineResultMutation();

  // Local edits not yet confirmed by the server, keyed by student id.
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  // Set after a failure that is not about any one row (offline, no
  // permission…): auto-save stops instead of hammering the server, and
  // resumes on the next edit or the retry button.
  const [autoSavePaused, setAutoSavePaused] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const draftsRef = useRef(drafts);
  const rowErrorsRef = useRef(rowErrors);
  useEffect(() => {
    draftsRef.current = drafts;
    rowErrorsRef.current = rowErrors;
  }, [drafts, rowErrors]);

  const total = Number(sheet?.exam.total_marks ?? 0);
  const perWrong = Number(sheet?.exam.negative_per_wrong ?? 0);
  const published = Boolean(sheet?.exam.result_published);
  const rows = useMemo(() => sheet?.rows ?? [], [sheet]);
  const rowsById = useMemo(() => new Map(rows.map((row) => [row.student, row])), [rows]);

  const displayed = (row: OfflineMarkRow): Draft => drafts[row.student] ?? draftFromRow(row);

  const edit = (row: OfflineMarkRow, change: Partial<Draft>) => {
    setAutoSavePaused(false);
    setDrafts((current) => {
      const base = current[row.student] ?? draftFromRow(row);
      const next = { ...base, ...change };
      // Typing a mark implies the student was there.
      if ((change.obtained !== undefined || change.wrong !== undefined) && next.present === null) {
        next.present = true;
      }
      return { ...current, [row.student]: next };
    });
    setRowErrors((current) => {
      if (!(row.student in current)) return current;
      const copy = { ...current };
      delete copy[row.student];
      return copy;
    });
  };

  // Read through refs: the save runs from a timer, after newer edits may have
  // landed, and must send the latest values.
  const flush = useCallback(async () => {
    const { payload, sent } = splitDrafts(
      draftsRef.current, rowErrorsRef.current, rowsById, published, total,
    );
    if (!payload.length) return;
    setSaving(true);
    setSaveError("");
    try {
      await saveMarks({ examId, rows: payload }).unwrap();
      // Drop drafts the server now holds — unless they were edited again
      // while the request was in flight, in which case they save next round.
      setDrafts((current) => {
        const copy = { ...current };
        for (const [key, draft] of Object.entries(sent)) {
          if (copy[Number(key)] === draft) delete copy[Number(key)];
        }
        return copy;
      });
    } catch (err) {
      const body = (err as { data?: OfflineMarksErrorBody })?.data;
      if (body?.errors && Object.keys(body.errors).length) {
        const errors: Record<number, string> = {};
        for (const [key, reason] of Object.entries(body.errors)) errors[Number(key)] = reason;
        // Nothing in the batch was saved. Flagging the rejected rows holds
        // them back, so the rest go through on the next round.
        setRowErrors((current) => ({ ...current, ...errors }));
      } else {
        setAutoSavePaused(true);
      }
      setSaveError(body?.detail || extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [examId, saveMarks, rowsById, published, total]);

  // Save shortly after the last keystroke. Rows with a server error are left
  // out until the admin edits them again.
  const { sent: sendableNow } = splitDrafts(drafts, rowErrors, rowsById, published, total);
  const sendableCount = Object.keys(sendableNow).length;

  useEffect(() => {
    if (saving || !canEdit || !sendableCount || autoSavePaused) return;
    const timer = setTimeout(() => {
      void flush();
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [drafts, rowErrors, saving, canEdit, flush, sendableCount, autoSavePaused]);

  // Edits not yet on the server: those about to save, and incomplete ones.
  const unsaved = Object.keys(drafts).length;

  // Warn before leaving with edits still unsaved.
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  // Enter / arrow keys move to the same box in the next or previous row.
  const moveFocus = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const step =
      event.key === "Enter" || event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const target = event.currentTarget;
    const field = target.dataset.field;
    const index = Number(target.dataset.index) + step;
    const next = document.querySelector<HTMLInputElement>(
      `input[data-field="${field}"][data-index="${index}"]`,
    );
    next?.focus();
    next?.select();
  };

  const visibleRows = useMemo(() => {
    const term = toAsciiDigits(search.trim()).toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (row) => row.student_code.includes(term) || row.name.toLowerCase().includes(term),
    );
  }, [rows, search]);

  const markRestAbsent = () => {
    setAutoSavePaused(false);
    setDrafts((current) => {
      const copy = { ...current };
      for (const row of rows) {
        const draft = copy[row.student] ?? draftFromRow(row);
        if (draft.present === null) copy[row.student] = { ...draft, present: false };
      }
      return copy;
    });
  };

  const handlePublish = async () => {
    setNotice(null);
    try {
      const outcome = await publishResult(examId).unwrap();
      const drafted = Object.keys(outcome.sms_campaigns).length;
      setNotice({
        tone: "ok",
        text: `ফলাফল প্রকাশিত হয়েছে (${bn(outcome.results)} জন)।${
          drafted ? " SMS খসড়া তৈরি হয়েছে — “অভিভাবক SMS” পাতা থেকে খরচ দেখে পাঠান।" : ""
        }`,
      });
    } catch (err) {
      const body = (err as { data?: OfflineMarksErrorBody })?.data;
      setNotice({ tone: "error", text: body?.detail || extractErrorMessage(err) });
    }
    setConfirmPublish(false);
  };

  if (isLoading) {
    return <p className="text-center text-sm text-slate-400">নম্বরের তালিকা লোড হচ্ছে…</p>;
  }
  if (isError || !sheet) {
    return <ErrorState message="নম্বরের তালিকা আনা যায়নি।" error={isError ? error : undefined} />;
  }

  // Live counts including unsaved edits, so the bar matches the screen.
  let entered = 0;
  let absent = 0;
  for (const row of rows) {
    const draft = displayed(row);
    if (draft.present === false) {
      entered += 1;
      absent += 1;
    } else if (draft.present === true && draft.obtained.trim() !== "") {
      entered += 1;
    }
  }
  const eligible = rows.filter((row) => row.is_enrolled).length;
  const errorCount = Object.keys(rowErrors).length;
  const sendable = new Set(Object.keys(sendableNow).map(Number));
  const incomplete = Object.keys(drafts).filter(
    (key) => !sendable.has(Number(key)) && !(Number(key) in rowErrors),
  ).length;

  return (
    <div className="flex flex-col gap-4 pb-28">
      <Link
        href={`/offline-batches/${courseId}`}
        className="flex w-fit items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-blue-50"
      >
        <ArrowLeft size={14} />
        ব্যাচে ফিরুন
      </Link>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-xl font-bold text-blue-50">{sheet.exam.title}</h1>
        <p className="mt-1 text-sm text-slate-400">
          পূর্ণমান {bn(total)}
          {perWrong > 0 ? ` · প্রতি ভুলে −${bn(perWrong)}` : " · ভুলে নম্বর কাটে না"}
          {` · পাস ${bn(sheet.exam.pass_mark_percentage)}%`}
        </p>
        {published && (
          <p className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs leading-5 text-emerald-200">
            ফলাফল প্রকাশিত। এখন যেকোনো পরিবর্তন সাথে সাথে শিক্ষার্থীরা দেখবে এবং মেধাক্রম আবার হিসাব
            হবে। আগে পাঠানো SMS আবার যাবে না।
          </p>
        )}
        {!canEdit && (
          <p className="mt-3 text-xs text-amber-300">নম্বর দেওয়ার অনুমতি আপনার নেই — শুধু দেখতে পারবেন।</p>
        )}
      </section>

      {notice && (
        <div
          className={`flex items-start gap-2 rounded-2xl border p-3 ${
            notice.tone === "ok"
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
              : "border-red-500/30 bg-red-500/5 text-red-300"
          }`}
        >
          {notice.tone === "ok" ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          )}
          <p className="text-sm">
            {notice.text}
            {notice.tone === "ok" && notice.text.includes("SMS") ? (
              <>
                {" "}
                <Link href="/guardian-sms" className="font-bold underline">
                  অভিভাবক SMS পাতায় যান
                </Link>
              </>
            ) : null}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/35 px-3.5 py-2.5">
          <Search size={15} className="text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="নাম বা আইডি দিয়ে খুঁজুন"
            className="w-full bg-transparent text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none"
          />
        </label>
        {canEdit && !published && (
          <button
            type="button"
            onClick={markRestAbsent}
            className="flex items-center gap-1.5 rounded-[10px] border border-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5"
          >
            <UserX size={14} />
            বাকিদের অনুপস্থিত করুন
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/5 text-xs text-slate-400">
            <tr>
              <th className="px-3 py-2.5 font-semibold">আইডি</th>
              <th className="px-3 py-2.5 font-semibold">নাম</th>
              <th className="px-3 py-2.5 font-semibold">উপস্থিতি</th>
              <th className="px-3 py-2.5 font-semibold">প্রাপ্ত নম্বর</th>
              <th className="px-3 py-2.5 font-semibold">ভুল উত্তর</th>
              <th className="px-3 py-2.5 font-semibold">চূড়ান্ত</th>
              {published && <th className="px-3 py-2.5 font-semibold">মেধাক্রম</th>}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => {
              const draft = displayed(row);
              const problem = rowErrors[row.student] ?? (draft.present === true ? rowProblem(draft, total) : null);
              const final = finalMarks(draft, perWrong);
              const isSaving = sendable.has(row.student);
              const isAbsent = draft.present === false;
              return (
                <tr key={row.student} className="border-t border-white/5 align-top">
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-300">{row.student_code}</td>
                  <td className="px-3 py-2.5 text-slate-100">
                    <div className="flex items-center gap-2">
                      <StudentAvatar name={row.name} image={row.student_image} className="size-7 rounded-full" iconSize={13} />
                      <div className="min-w-0">
                        {row.name}
                        {!row.is_enrolled && (
                          <span className="block text-[11px] text-amber-400">এখন আর ব্যাচে নেই</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => edit(row, { present: true })}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                          draft.present === true
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                            : "border-slate-700 text-slate-400"
                        }`}
                      >
                        উপস্থিত
                      </button>
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => edit(row, { present: false, obtained: "", wrong: "" })}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                          isAbsent
                            ? "border-red-500/40 bg-red-500/15 text-red-200"
                            : "border-slate-700 text-slate-400"
                        }`}
                      >
                        অনুপস্থিত
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      data-field="obtained"
                      data-index={index}
                      disabled={!canEdit || isAbsent}
                      value={draft.obtained}
                      onChange={(event) =>
                        edit(row, { obtained: toAsciiDigits(event.target.value).trim() })
                      }
                      onKeyDown={moveFocus}
                      placeholder={isAbsent ? "—" : ""}
                      className="w-24 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-slate-100 focus:border-blue-500/60 focus:outline-none disabled:opacity-40"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      data-field="wrong"
                      data-index={index}
                      disabled={!canEdit || isAbsent}
                      value={draft.wrong}
                      onChange={(event) =>
                        edit(row, { wrong: toAsciiDigits(event.target.value).trim() })
                      }
                      onKeyDown={moveFocus}
                      placeholder={isAbsent ? "—" : "০"}
                      className="w-20 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500/60 focus:outline-none disabled:opacity-40"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-semibold text-blue-100">
                      {isAbsent ? "অনুপস্থিত" : final !== null ? bn(final) : "—"}
                    </span>
                    {problem ? (
                      <span className="block text-[11px] text-red-400">{problem}</span>
                    ) : isSaving ? (
                      <span className="block text-[11px] text-slate-500">সেভ হচ্ছে…</span>
                    ) : null}
                  </td>
                  {published && (
                    <td className="px-3 py-2.5 text-slate-300">{row.rank ? bn(row.rank) : "—"}</td>
                  )}
                </tr>
              );
            })}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={published ? 7 : 6} className="px-3 py-8 text-center text-sm text-slate-500">
                  {rows.length ? "এই খোঁজে কেউ নেই।" : "এই পরীক্ষার তালিকায় কোনো শিক্ষার্থী নেই।"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-300">
            {bn(entered)}/{bn(eligible)} সম্পন্ন
            {absent ? ` · ${bn(absent)} জন অনুপস্থিত` : ""}
            {errorCount ? (
              <span className="text-red-400"> · {bn(errorCount)}টি সারিতে ভুল</span>
            ) : null}
            {incomplete ? (
              <span className="text-amber-300"> · {bn(incomplete)}টি সারি অসম্পূর্ণ</span>
            ) : null}
            {autoSavePaused && sendable.size ? (
              <span className="text-red-400"> · সেভ হয়নি: {saveError}</span>
            ) : saving || sendable.size ? (
              <span className="text-slate-400"> · সেভ হচ্ছে…</span>
            ) : !errorCount && !incomplete ? (
              <span className="text-emerald-400"> · সব সেভ হয়েছে</span>
            ) : null}
            {autoSavePaused && sendable.size ? (
              <button
                type="button"
                onClick={() => setAutoSavePaused(false)}
                className="ml-2 rounded-lg border border-red-400/40 px-2 py-0.5 text-xs font-bold text-red-200"
              >
                আবার চেষ্টা করুন
              </button>
            ) : null}
          </p>
          {canPublish && !published && (
            <button
              type="button"
              onClick={() => setConfirmPublish(true)}
              disabled={saving || unsaved > 0 || isPublishing}
              className="flex items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              ফলাফল প্রকাশ
            </button>
          )}
        </div>
      </div>

      <ConfirmActionDialog
        open={confirmPublish}
        title="ফলাফল প্রকাশ করবেন?"
        message={`${bn(entered)}/${bn(eligible)} জনের তথ্য দেওয়া হয়েছে। প্রকাশের পর শিক্ষার্থীরা নম্বর ও মেধাক্রম দেখবে। অভিভাবক ও শিক্ষার্থীর SMS শুধু খসড়া হিসেবে তৈরি হবে — “অভিভাবক SMS” পাতা থেকে পাঠালেই যাবে।`}
        confirmLabel="ফলাফল প্রকাশ করুন"
        isLoading={isPublishing}
        onClose={() => setConfirmPublish(false)}
        onConfirm={handlePublish}
      />
    </div>
  );
}
