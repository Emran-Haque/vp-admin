"use client";

import { Check, FileText, HelpCircle, Plus, Trash2, Upload, Video, type LucideIcon } from "lucide-react";
import { useGetExamsQuery } from "@/redux/api/examsApi";
import type { MaterialDraft, MaterialKind, QuizQuestion } from "./types";

const badgeConfig: Record<MaterialKind, { label: string; icon: LucideIcon; className: string }> = {
  pdf: { label: "পিডিএফ", icon: FileText, className: "bg-amber-500/20 text-amber-500" },
  video: { label: "ভিডিও", icon: Video, className: "bg-white text-blue-500" },
  mcq: { label: "কুইজ", icon: HelpCircle, className: "bg-red-600/20 text-red-500" },
};

type Props = {
  item: MaterialDraft;
  courseId?: number;
  /** 1-based position within its type tab; shown as a numbered chip. */
  position?: number;
  onUpdate: (patch: Partial<MaterialDraft>) => void;
  onRemove: () => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (questionId: string, patch: Partial<QuizQuestion>) => void;
};

export default function MaterialItemCard({ item, courseId, position, onUpdate, onRemove, onAddQuestion, onUpdateQuestion }: Props) {
  const badge = badgeConfig[item.kind];

  const { data: examsData, isLoading: isLoadingExams } = useGetExamsQuery(
    item.kind === "mcq" ? (courseId ? { course: courseId } : undefined) : undefined,
    { skip: item.kind !== "mcq" }
  );
  const exams = examsData?.results ?? [];
  const selectedExam = item.quizId ? exams.find((e) => e.id === item.quizId) : undefined;

  return (
    <div className="rounded-2xl border border-slate-800 bg-gray-900/40 p-3.5">
      <div className="flex items-center gap-2">
        <span className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-semibold ${badge.className}`}>
          <badge.icon size={16} />
          {typeof position === "number" ? position.toLocaleString("bn-BD") : badge.label}
        </span>
        <input
          type="text"
          value={item.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="flex-1 rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 focus:outline-none"
        />
        <button
          type="button"
          onClick={onRemove}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-red-600/40 bg-red-600/10 text-red-600"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {item.kind === "pdf" && (
        <div className="mt-3.5 flex flex-col gap-3">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-800 p-4 text-center">
            <Upload size={22} className="text-slate-400" />
            <span className="text-sm text-blue-50">{item.file?.name || "পিডিএফ আপলোড করুন"}</span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => onUpdate({ file: e.target.files?.[0] ?? null })}
            />
          </label>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-px flex-1 bg-slate-800" />
            অথবা
            <span className="h-px flex-1 bg-slate-800" />
          </div>
          <input
            type="text"
            value={item.driveLink ?? ""}
            onChange={(e) => onUpdate({ driveLink: e.target.value })}
            placeholder="Google Drive লিংক (পিডিএফ আপলোড না করলে বিকল্প হিসেবে ব্যবহার করুন)"
            className="rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      )}

      {item.kind === "video" && (
        <div className="mt-2">
          <input
            type="text"
            value={item.videoUrl ?? ""}
            onChange={(e) => onUpdate({ videoUrl: e.target.value })}
            placeholder="YouTube / Facebook ভিডিও লিংক"
            className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      )}

      {item.kind === "mcq" && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">কুইজ নির্বাচন করুন</label>
            <select
              value={item.quizId ? String(item.quizId) : item.questions?.length ? "new" : ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "new") {
                  onUpdate({ quizId: undefined });
                } else if (val) {
                  const examId = Number(val);
                  const selected = exams.find((ex) => ex.id === examId);
                  onUpdate({
                    quizId: examId,
                    title: selected?.title || item.title,
                  });
                } else {
                  onUpdate({ quizId: undefined });
                }
              }}
              className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- কুইজ নির্বাচন করুন --</option>
              {isLoadingExams ? (
                <option disabled>কুইজ লোড হচ্ছে…</option>
              ) : (
                exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} ({exam.total_questions} টি প্রশ্ন • {exam.duration_minutes} মিনিট)
                  </option>
                ))
              )}
              <option value="new">+ নতুন কুইজ তৈরি করুন</option>
            </select>
          </div>

          {selectedExam && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs text-blue-200">
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="shrink-0 text-blue-400" />
                <div>
                  <p className="font-semibold text-blue-100">{selectedExam.title}</p>
                  <p className="mt-0.5 text-slate-400">
                    {selectedExam.total_questions} টি প্রশ্ন • {selectedExam.duration_minutes} মিনিট • মার্কস: {selectedExam.total_marks}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!item.quizId && (
            <div className="flex flex-col gap-3">
              {(item.questions ?? []).map((q, qIndex) => (
                <div key={q.id} className="rounded-xl border border-slate-800 bg-gray-900/60 p-3">
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => onUpdateQuestion(q.id, { question: e.target.value })}
                    placeholder={`প্রশ্ন ${qIndex + 1}`}
                    className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 placeholder:text-slate-400 focus:outline-none"
                  />
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {q.options.map((opt, optIndex) => (
                      <div
                        key={optIndex}
                        className={`flex items-center gap-2 rounded-xl border px-2 py-1 ${
                          q.correctIndex === optIndex
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-slate-800 bg-gray-800"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onUpdateQuestion(q.id, { correctIndex: optIndex })}
                          aria-label="সঠিক উত্তর নির্বাচন করুন"
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                            q.correctIndex === optIndex ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-600"
                          }`}
                        >
                          {q.correctIndex === optIndex && <Check size={12} />}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const next = [...q.options];
                            next[optIndex] = e.target.value;
                            onUpdateQuestion(q.id, { options: next });
                          }}
                          placeholder={`অপশন ${optIndex + 1}`}
                          className="flex-1 bg-transparent py-2 text-sm text-blue-50 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={onAddQuestion}
                className="flex w-fit items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-blue-500"
              >
                <Plus size={14} />
                নতুন প্রশ্ন
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
