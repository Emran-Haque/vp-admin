"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Save, Send } from "lucide-react";
import {
  useGetExamQuery,
  useGetExamQuestionsQuery,
  useAddExamQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  usePublishExamMutation,
} from "@/redux/api/examsApi";
import { extractErrorMessage } from "@/lib/api-error";
import { PageLoader } from "@/components/loaders";
import ErrorState from "@/components/error-state";
import StepQuestions from "../../mcq/create/includes/step-questions";
import type { Question } from "../../mcq/create/includes/types";

const optionLetters = ["A", "B", "C", "D"] as const;
const isPersisted = (id: string) => /^\d+$/.test(id);

/** A minimal, questions-only MCQ editor for a batch routine exam: just add
 *  questions (manual or CSV) and publish — schedule/marks already come from the
 *  routine, so none of the course-exam fields are shown here. */
export default function RoutineMcqEditor({
  examId,
  examTitle,
  onBack,
}: {
  examId: number;
  examTitle: string;
  onBack: () => void;
}) {
  const { data: exam, isLoading: examLoading } = useGetExamQuery(examId);
  const { data: questionsData, isLoading: questionsLoading } = useGetExamQuestionsQuery(examId);
  const [addQuestion] = useAddExamQuestionMutation();
  const [updateQuestion] = useUpdateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();
  const [publishExam] = usePublishExamMutation();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const initialized = useRef(false);
  const originalIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (initialized.current || !questionsData) return;
    initialized.current = true;
    setQuestions(
      questionsData.map((q) => ({
        id: String(q.id),
        text: q.question_text,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
        correctIndex: (["A", "B", "C", "D"] as const).indexOf(q.correct_option),
        explanation: q.explanation,
      })),
    );
    originalIds.current = new Set(questionsData.map((q) => q.id));
  }, [questionsData]);

  const persistQuestions = async (): Promise<boolean> => {
    // Delete removed questions.
    const currentIds = new Set(questions.filter((q) => isPersisted(q.id)).map((q) => Number(q.id)));
    for (const id of [...originalIds.current].filter((id) => !currentIds.has(id))) {
      await deleteQuestion(id).unwrap();
    }
    // Create / update the rest, keeping order.
    const savedIds = new Set<number>();
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) continue;
      const data = {
        question_text: q.text,
        option_a: q.options[0] ?? "",
        option_b: q.options[1] ?? "",
        option_c: q.options[2] ?? "",
        option_d: q.options[3] ?? "",
        correct_option: optionLetters[q.correctIndex ?? 0],
        explanation: q.explanation,
        order: i + 1,
      };
      if (isPersisted(q.id)) {
        await updateQuestion({ id: Number(q.id), data }).unwrap();
        savedIds.add(Number(q.id));
      } else {
        const created = await addQuestion({ examId, data }).unwrap();
        savedIds.add(created.id);
      }
    }
    originalIds.current = savedIds;
    return true;
  };

  const run = async (publish: boolean) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await persistQuestions();
      if (publish) {
        await publishExam(examId).unwrap();
        setMessage("প্রশ্ন সংরক্ষণ করে পরীক্ষা প্রকাশ করা হয়েছে।");
      } else {
        setMessage("প্রশ্ন সংরক্ষণ করা হয়েছে।");
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (examLoading || questionsLoading) return <PageLoader label="প্রশ্ন লোড হচ্ছে..." />;
  if (!exam) return <ErrorState message="পরীক্ষাটি খুঁজে পাওয়া যায়নি।" />;

  const published = exam.status === "published";
  const answered = questions.filter((q) => q.text.trim()).length;

  return (
    <div className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
        <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex min-w-0 items-center gap-4">
            <button type="button" onClick={onBack} className="grid size-11 shrink-0 place-items-center rounded-2xl border border-slate-800 text-blue-50 hover:bg-white/5">
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-xl font-bold text-blue-50">{examTitle}</h1>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${published ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/10 text-amber-400"}`}>
                  {published ? "প্রকাশিত" : "ড্রাফট"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">MCQ প্রশ্ন যোগ করুন — ম্যানুয়ালি অথবা CSV দিয়ে।</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => run(false)}
              disabled={busy}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-700 px-4 text-sm font-bold text-blue-50 hover:bg-white/5 disabled:opacity-50"
            >
              <Save size={16} /> সংরক্ষণ করুন
            </button>
            <button
              type="button"
              onClick={() => run(true)}
              disabled={busy || answered === 0}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              <Send size={16} /> সংরক্ষণ করে প্রকাশ করুন
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : null}
      {message ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
          <p className="text-sm text-emerald-400">{message}</p>
        </div>
      ) : null}
      {busy ? (
        <p className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-center text-sm text-slate-400">সংরক্ষণ করা হচ্ছে…</p>
      ) : null}

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <StepQuestions questions={questions} onChange={setQuestions} />
      </section>
    </div>
  );
}
