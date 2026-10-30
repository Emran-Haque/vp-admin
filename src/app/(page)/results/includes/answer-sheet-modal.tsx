"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useGetAttemptAnswerSheetQuery, type AnswerSheetQuestion } from "@/redux/api/examsApi";
import { getMediaUrl } from "@/redux/api/baseApi";
import StudentNameLink from "@/components/student-name-link";
import { endedByStatus } from "./types";
import { bnDigits, bnOrdinal, endedByLabel } from "./attempt-labels";

type ReviewStatus = "correct" | "wrong" | "skipped";
type ReviewFilter = "all" | ReviewStatus;

const OPTION_KEYS = ["A", "B", "C", "D"] as const;
const optionLabels: Record<(typeof OPTION_KEYS)[number], string> = { A: "ক", B: "খ", C: "গ", D: "ঘ" };

const filterTabs: { key: ReviewFilter; label: string; tone: string }[] = [
  { key: "all", label: "সব", tone: "border-blue-400/40 bg-blue-500/15 text-blue-200" },
  { key: "correct", label: "সঠিক", tone: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" },
  { key: "wrong", label: "ভুল", tone: "border-red-400/40 bg-red-500/15 text-red-300" },
  { key: "skipped", label: "উত্তর দেয়নি", tone: "border-white/25 bg-white/[0.08] text-white/85" },
];

const statusBadge: Record<ReviewStatus, { label: string; className: string }> = {
  correct: { label: "সঠিক", className: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" },
  wrong: { label: "ভুল", className: "border-red-500/30 bg-red-500/10 text-red-400" },
  skipped: { label: "উত্তর দেয়নি", className: "border-white/15 bg-white/[0.04] text-white/60" },
};

const cardAccent: Record<ReviewStatus, string> = {
  correct: "border-l-emerald-400/70",
  wrong: "border-l-red-500/70",
  skipped: "border-l-white/20",
};

/** "2.00" → "২", "-0.25" → "-০.২৫" */
const bnMarks = (value: string | number) => bnDigits(Number(Number(value).toFixed(2)));

function bnDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${bnDigits(m)} মি ${bnDigits(s)} সে` : `${bnDigits(s)} সে`;
}

const statusOf = (q: AnswerSheetQuestion): ReviewStatus =>
  !q.my_answer ? "skipped" : q.is_correct ? "correct" : "wrong";

/** One student's answers for one attempt, opened from a Results row. */
export default function AnswerSheetModal({ attemptId, onClose }: { attemptId: number; onClose: () => void }) {
  const { data, isLoading, isError } = useGetAttemptAnswerSheetQuery(attemptId);
  const [filter, setFilter] = useState<ReviewFilter>("all");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const questions = useMemo(() => data?.questions ?? [], [data]);
  const counts = useMemo(() => {
    const next: Record<ReviewFilter, number> = { all: questions.length, correct: 0, wrong: 0, skipped: 0 };
    for (const q of questions) next[statusOf(q)] += 1;
    return next;
  }, [questions]);
  const visible = filter === "all" ? questions : questions.filter((q) => statusOf(q) === filter);

  const endedBy = data ? endedByStatus[data.status] ?? null : null;
  const isOffline = data?.exam_mode === "offline";
  const inProgress = data?.status === "started";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4" onClick={onClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-[820px] flex-col rounded-[20px] border border-white/5 bg-gray-900/75 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]"
      >
        <div className="flex items-start justify-between gap-4 p-6 pb-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-50">উত্তরপত্র</h2>
            {data && (
              <>
                <p className="mt-1 text-sm text-slate-300">
                  <StudentNameLink studentId={data.student} className="font-semibold text-blue-50">
                    {data.student_name}
                  </StudentNameLink>
                  <span className="text-slate-500"> · </span>
                  {data.exam_title}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data.attempt_number > 1 && (
                    <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                      {bnOrdinal(data.attempt_number)} চেষ্টা
                    </span>
                  )}
                  {endedBy && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${endedByLabel[endedBy].className}`}
                      title={endedByLabel[endedBy].title}
                    >
                      {endedByLabel[endedBy].text}
                    </span>
                  )}
                  {inProgress && (
                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-300">
                      এখনো চলছে
                    </span>
                  )}
                  {!data.is_result_published && (
                    <span
                      className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-300"
                      title="শিক্ষার্থী এখনো এই উত্তরপত্র দেখতে পাচ্ছে না; শুধু অ্যাডমিন দেখছেন"
                    >
                      ফল এখনো প্রকাশ হয়নি
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
          {isLoading && <p className="py-8 text-center text-sm text-slate-400">উত্তরপত্র লোড হচ্ছে…</p>}

          {isError && (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-500">উত্তরপত্র আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ যাচাই করুন।</p>
            </div>
          )}

          {data && (
            <>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <SummaryTile
                  label="প্রাপ্ত নম্বর"
                  value={`${bnMarks(data.final_marks || 0)}/${bnMarks(data.exam_total_marks || 0)}`}
                  tone={data.is_passed ? "text-emerald-400" : "text-red-400"}
                  note={data.is_passed ? "পাস" : "ফেল"}
                />
                <SummaryTile label="র‍্যাঙ্ক" value={data.rank ? bnDigits(data.rank) : "—"} />
                {isOffline ? (
                  <SummaryTile label="পরীক্ষার ধরন" value="অফলাইন" />
                ) : (
                  <>
                    <SummaryTile
                      label="সঠিক / ভুল / বাদ"
                      value={`${bnDigits(data.correct_count)} / ${bnDigits(data.wrong_count)} / ${bnDigits(data.unanswered_count)}`}
                    />
                    <SummaryTile
                      label="সময় লেগেছে"
                      value={data.time_taken_seconds ? bnDuration(data.time_taken_seconds) : "—"}
                      note={Number(data.negative_marks) > 0 ? `নেগেটিভ: -${bnMarks(data.negative_marks)}` : undefined}
                    />
                  </>
                )}
              </div>

              {isOffline ? (
                <p className="rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center text-sm text-slate-400">
                  এটি অফলাইন (কাগজের) পরীক্ষা — এখানে শুধু নম্বর থাকে, উত্তরপত্র নেই।
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2" role="group" aria-label="প্রশ্ন ফিল্টার">
                    {filterTabs.map((tab) => {
                      const isActive = filter === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => setFilter(tab.key)}
                          className={`flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border px-2 text-xs font-bold transition ${
                            isActive
                              ? tab.tone
                              : "border-white/[0.07] bg-white/[0.02] text-white/60 hover:bg-white/[0.05]"
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span className={isActive ? "" : "text-white/40"}>{bnDigits(counts[tab.key])}</span>
                        </button>
                      );
                    })}
                  </div>

                  {visible.length === 0 ? (
                    <p className="rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center text-sm text-slate-400">
                      এই তালিকায় কোনো প্রশ্ন নেই।
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {visible.map((q) => (
                        <QuestionCard key={q.question_id} question={q} number={questions.indexOf(q) + 1} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, tone, note }: { label: string; value: string; tone?: string; note?: string }) {
  return (
    <div className="rounded-[12px] border border-white/10 bg-white/5 p-3">
      <p className="text-[11px] font-semibold text-slate-400">{label}</p>
      <p className={`pt-1 text-base font-bold ${tone ?? "text-blue-50"}`}>{value}</p>
      {note && <p className="text-[11px] text-slate-400">{note}</p>}
    </div>
  );
}

function QuestionCard({ question, number }: { question: AnswerSheetQuestion; number: number }) {
  const status = statusOf(question);
  const badge = statusBadge[status];
  const image = getMediaUrl(question.image);
  const explanation = question.explanation?.trim();
  const awarded = Number(question.marks_awarded);

  return (
    <article
      className={`rounded-[12px] border border-l-[3px] border-white/[0.06] bg-white/[0.02] p-4 ${cardAccent[status]}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-white/80">
          প্রশ্ন {bnDigits(number)}
        </span>
        <span className="rounded-full border border-sky-400/25 bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold text-sky-300">
          পেয়েছে {bnMarks(awarded)}/{bnMarks(question.marks)}
        </span>
        <span className={`ml-auto rounded-full border px-2.5 py-1 text-[11px] font-bold ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed text-slate-100">
        {question.question_text}
      </p>

      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={question.image_alt_text || "প্রশ্নের ছবি"}
          className="mt-3 max-h-64 rounded-[10px] border border-white/10 bg-white object-contain"
        />
      )}

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {OPTION_KEYS.map((key) => {
          const text = question.options[key];
          if (!text) return null;
          const isRight = key === question.correct_answer;
          const isMine = key === question.my_answer;
          return (
            <div
              key={key}
              className={`flex items-start gap-2.5 rounded-[10px] border px-3 py-2.5 text-[13px] ${
                isRight
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : isMine
                    ? "border-red-500/30 bg-red-500/10 text-red-300"
                    : "border-white/[0.06] bg-white/[0.02] text-white/70"
              }`}
            >
              <span className="shrink-0 font-bold">{optionLabels[key]}</span>
              <span className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-relaxed">
                {text}
                {(isRight || isMine) && (
                  <span className="mt-1 flex flex-wrap gap-1">
                    {isRight && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                        সঠিক উত্তর
                      </span>
                    )}
                    {isMine && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isRight ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200"
                        }`}
                      >
                        শিক্ষার্থীর উত্তর
                      </span>
                    )}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {explanation && (
        <p className="mt-3 whitespace-pre-wrap break-words rounded-[10px] bg-white/[0.03] px-3 py-2 text-xs leading-6 text-white/65">
          💡 {explanation}
        </p>
      )}
    </article>
  );
}
