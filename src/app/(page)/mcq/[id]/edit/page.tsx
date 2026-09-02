"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import WizardHeader from "../../create/includes/wizard-header";
import StepBasicInfo from "../../create/includes/step-basic-info";
import StepQuestions from "../../create/includes/step-questions";
import StepReview from "../../create/includes/step-review";
import ExamSummary from "../../create/includes/exam-summary";
import { normalizeMarks, tallyMarks } from "../../create/includes/marks";
import TipsBox from "../../create/includes/tips-box";
import EditWizardFooter from "./includes/edit-wizard-footer";
import {
  useGetExamQuery,
  useGetExamQuestionsQuery,
  useUpdateExamMutation,
  useAddExamQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  usePublishExamMutation,
  usePublishExamResultMutation,
  useGetExamAttemptsQuery,
  useRecalculateLeaderboardMutation,
} from "@/redux/api/examsApi";
import { useGetCourseSubjectsQuery } from "@/redux/api/courseSubjectsApi";
import {
  combineDateTime,
  localDateTimeToIso,
  isoToTimeInput,
  isoToLocalDateTimeInput,
} from "@/lib/exam-datetime";
import { extractErrorMessage } from "@/lib/api-error";
import ErrorState from "@/components/error-state";
import ConfirmActionDialog from "@/components/confirm-action-dialog";
import type { ExamBasicInfo, Question } from "../../create/includes/types";

const optionLetters = ["A", "B", "C", "D"] as const;
const isPersisted = (id: string) => /^\d+$/.test(id);

export default function Page() {
  const params = useParams<{ id: string }>();
  const examId = Number(params.id);

  const {
    data: exam,
    isLoading: isLoadingExam,
    isError: isExamError,
    error: examError,
  } = useGetExamQuery(examId, {
    skip: !examId,
  });
  const { data: questionsData, isLoading: isLoadingQuestions } = useGetExamQuestionsQuery(examId, {
    skip: !examId,
  });
  const { data: attemptsData } = useGetExamAttemptsQuery(
    { exam: examId },
    { skip: !examId || !exam || exam.status !== "published" }
  );
  const { data: courseSubjectsData } = useGetCourseSubjectsQuery(
    { course: exam?.course ?? undefined },
    { skip: !exam?.course }
  );

  const [updateExam] = useUpdateExamMutation();
  const [addExamQuestion] = useAddExamQuestionMutation();
  const [updateQuestion] = useUpdateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();
  const [publishExam] = usePublishExamMutation();
  const [publishExamResult] = usePublishExamResultMutation();
  const [recalculateLeaderboard] = useRecalculateLeaderboardMutation();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [basicInfo, setBasicInfo] = useState<ExamBasicInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showRegradeConfirm, setShowRegradeConfirm] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const initializedRef = useRef(false);
  const originalQuestionIdsRef = useRef<Set<number>>(new Set());
  const originalCorrectOptionsRef = useRef<Map<number, string>>(new Map());
  /** Marks each question had when loaded — changing one forces a regrade. */
  const originalMarksRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    if (initializedRef.current || !exam || !questionsData) return;
    initializedRef.current = true;

    const subjectName = courseSubjectsData?.results.find((s) => s.id === exam.subject)?.name ?? "";

    setBasicInfo({
      name: exam.title,
      // Batch/routine exams have no course — keep it empty rather than "null".
      course: exam.course != null ? String(exam.course) : "",
      subject: exam.subject != null ? String(exam.subject) : "",
      subjectName,
      duration: String(exam.duration_minutes),
      totalQuestions: String(exam.total_questions),
      passMark: exam.pass_mark_percentage,
      marksPerQuestion: normalizeMarks(exam.marks_per_question),
      negativeMode: exam.negative_marking_mode ?? "flat",
      negativeMark: exam.negative_mark_per_wrong,
      negativePercentage: exam.negative_mark_percentage ?? "25",
      examDate: exam.exam_date ?? "",
      startTime: isoToTimeInput(exam.start_time),
      deadline: isoToLocalDateTimeInput(exam.end_time),
      resultPublishAt: isoToLocalDateTimeInput(exam.result_publish_at),
      leaderboardPublishAt: isoToLocalDateTimeInput(exam.leaderboard_publish_at),
      description: exam.instructions,
      status: exam.status === "published" || exam.status === "closed" ? "published" : "draft",
    });

    const loadedQuestions: Question[] = questionsData.map((q) => ({
      id: String(q.id),
      text: q.question_text,
      options: [q.option_a, q.option_b, q.option_c, q.option_d],
      correctIndex: ["A", "B", "C", "D"].indexOf(q.correct_option),
      explanation: q.explanation,
      marks: normalizeMarks(q.marks),
    }));
    setQuestions(loadedQuestions);
    originalQuestionIdsRef.current = new Set(questionsData.map((q) => q.id));
    originalCorrectOptionsRef.current = new Map(
      questionsData.map((q) => [q.id, q.correct_option])
    );
    originalMarksRef.current = new Map(questionsData.map((q) => [q.id, q.marks]));
  }, [exam, questionsData, courseSubjectsData]);

  const hasResultImpactingChanges = () => {
    if (!basicInfo || !exam) return false;
    // Anything that changes what an already-submitted answer is worth.
    if (Number(basicInfo.negativeMark || 0) !== Number(exam.negative_mark_per_wrong || 0)) {
      return true;
    }
    if (basicInfo.negativeMode !== (exam.negative_marking_mode ?? "flat")) {
      return true;
    }
    if (
      Number(basicInfo.negativePercentage || 0) !==
      Number(exam.negative_mark_percentage || 0)
    ) {
      return true;
    }
    const originalMarks = originalMarksRef.current;
    const hasMarksChange = questions.some((q) => {
      if (!isPersisted(q.id)) return false;
      const before = originalMarks.get(Number(q.id));
      return before !== undefined && Number(before) !== Number(q.marks || before);
    });
    if (hasMarksChange) return true;

    const currentQuestionIds = new Set(
      questions.filter((q) => isPersisted(q.id)).map((q) => Number(q.id))
    );
    const hasRemovedQuestion = [...originalQuestionIdsRef.current].some(
      (id) => !currentQuestionIds.has(id)
    );
    const hasAddedQuestion = questions.some((q) => !isPersisted(q.id) && q.text.trim());
    const hasCorrectAnswerChange = questions.some((q) => {
      if (!isPersisted(q.id)) return false;
      const id = Number(q.id);
      return originalCorrectOptionsRef.current.get(id) !== optionLetters[q.correctIndex ?? 0];
    });

    return hasRemovedQuestion || hasAddedQuestion || hasCorrectAnswerChange;
  };

  const handleSave = async (skipRegradeConfirm = false) => {
    if (!basicInfo) return;
    const shouldWarnAboutRegrade =
      exam?.status === "published" && hasResultImpactingChanges();
    if (shouldWarnAboutRegrade && !skipRegradeConfirm) {
      setShowRegradeConfirm(true);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    const durationMinutes = Number(basicInfo.duration) || 0;
    const startDateTime = combineDateTime(basicInfo.examDate, basicInfo.startTime);
    const endDateTime = localDateTimeToIso(basicInfo.deadline);

    try {
      await updateExam({
        id: examId,
        data: {
          title: basicInfo.name,
          subject: basicInfo.subject ? Number(basicInfo.subject) : null,
          instructions: basicInfo.description,
          duration_minutes: durationMinutes,
          marks_per_question: basicInfo.marksPerQuestion || "1",
          negative_marking_mode: basicInfo.negativeMode,
          negative_mark_per_wrong: basicInfo.negativeMark || "0",
          negative_mark_percentage: basicInfo.negativePercentage || "0",
          pass_mark_percentage: basicInfo.passMark || "0",
          exam_date: basicInfo.examDate || undefined,
          start_time: startDateTime,
          end_time: endDateTime,
          ...(basicInfo.status !== "published" ? { status: basicInfo.status } : {}),
        },
      }).unwrap();
    } catch (err) {
      setSaveError(`পরীক্ষা সেভ করা যায়নি: ${extractErrorMessage(err)}`);
      setIsSaving(false);
      return;
    }

    const currentQuestionIds = new Set(
      questions.filter((q) => isPersisted(q.id)).map((q) => Number(q.id))
    );
    const removedQuestionIds = [...originalQuestionIdsRef.current].filter(
      (id) => !currentQuestionIds.has(id)
    );

    for (const id of removedQuestionIds) {
      try {
        await deleteQuestion(id).unwrap();
      } catch (err) {
        setSaveError(`প্রশ্ন ডিলিট করা যায়নি: ${extractErrorMessage(err)}`);
        setIsSaving(false);
        return;
      }
    }

    const savedQuestionIds = new Set<number>();
    const savedCorrectOptions = new Map<number, string>();

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) continue;
      const correctOption = optionLetters[q.correctIndex ?? 0];
      const data = {
        question_text: q.text,
        option_a: q.options[0] ?? "",
        option_b: q.options[1] ?? "",
        option_c: q.options[2] ?? "",
        option_d: q.options[3] ?? "",
        correct_option: correctOption,
        explanation: q.explanation,
        // Blank only happens on a brand-new question the admin left alone —
        // omitting it lets the server apply the exam default.
        ...(q.marks.trim() ? { marks: q.marks.trim() } : {}),
        order: i + 1,
      };
      try {
        if (isPersisted(q.id)) {
          await updateQuestion({ id: Number(q.id), data }).unwrap();
          savedQuestionIds.add(Number(q.id));
          savedCorrectOptions.set(Number(q.id), correctOption);
        } else {
          const created = await addExamQuestion({ examId, data }).unwrap();
          savedQuestionIds.add(created.id);
          savedCorrectOptions.set(created.id, correctOption);
          setQuestions((prev) => prev.map((item) => (item.id === q.id ? { ...item, id: String(created.id) } : item)));
        }
      } catch (err) {
        setSaveError(`প্রশ্ন ${i + 1} সেভ করা যায়নি: ${extractErrorMessage(err)}`);
        setIsSaving(false);
        return;
      }
    }

    if (basicInfo.status === "published" && exam?.status !== "published") {
      try {
        await publishExam(examId).unwrap();
      } catch (err) {
        setSaveError(`পরীক্ষা পাবলিশ করা যায়নি: ${extractErrorMessage(err)}`);
        setIsSaving(false);
        return;
      }
    }

    const resultPublishAt = localDateTimeToIso(basicInfo.resultPublishAt);
    const leaderboardPublishAt = localDateTimeToIso(basicInfo.leaderboardPublishAt);
    const resultScheduleChanged =
      basicInfo.resultPublishAt !== isoToLocalDateTimeInput(exam?.result_publish_at);
    const leaderboardScheduleChanged =
      basicInfo.leaderboardPublishAt !== isoToLocalDateTimeInput(exam?.leaderboard_publish_at);
    if (resultScheduleChanged || leaderboardScheduleChanged) {
      try {
        await publishExamResult({
          id: examId,
          data: {
            ...(resultScheduleChanged ? { result_publish_at: resultPublishAt ?? null } : {}),
            ...(leaderboardScheduleChanged ? { leaderboard_publish_at: leaderboardPublishAt ?? null } : {}),
          },
        }).unwrap();
      } catch (err) {
        setSaveError(`রেজাল্ট/লিডারবোর্ড শিডিউল সেভ করা যায়নি: ${extractErrorMessage(err)}`);
        setIsSaving(false);
        return;
      }
    }

    let recalculatedAttempts: number | null = null;
    if (shouldWarnAboutRegrade) {
      try {
        const recalculated = await recalculateLeaderboard(examId).unwrap();
        recalculatedAttempts = recalculated.updated_attempts;
      } catch (err) {
        setSaveError(`চেঞ্জ সেভ হয়েছে, তবে রেজাল্ট আবার ক্যালকুলেট করা যায়নি: ${extractErrorMessage(err)}`);
        setIsSaving(false);
        return;
      }
    }

    originalQuestionIdsRef.current = savedQuestionIds;
    originalCorrectOptionsRef.current = savedCorrectOptions;
    setIsSaving(false);
    if (shouldWarnAboutRegrade) {
      setSaveMessage(
        recalculatedAttempts === null
          ? "চেঞ্জ সেভ হয়েছে। জমা দেওয়া রেজাল্ট আর লিডারবোর্ড আবার ক্যালকুলেট করা হয়েছে।"
          : `চেঞ্জ সেভ হয়েছে। ${recalculatedAttempts}টি জমা দেওয়া রেজাল্ট আর লিডারবোর্ড আবার ক্যালকুলেট করা হয়েছে।`
      );
      return;
    }
    setSaveMessage("চেঞ্জ সেভ হয়ে গেছে।");
  };

  if (isLoadingExam || isLoadingQuestions || !basicInfo) {
    return <p className="text-center text-sm text-slate-400">পরীক্ষার ইনফো লোড হচ্ছে…</p>;
  }

  if (isExamError || !exam) {
    return (
      <ErrorState
        message="পরীক্ষাটা পাওয়া যায়নি। API সার্ভারের কানেকশন চেক করুন।"
        error={isExamError ? examError : undefined}
      />
    );
  }

  const marksTally = tallyMarks(questions, basicInfo.marksPerQuestion || "1");
  const regradeAttemptCount = attemptsData?.count ?? 0;
  const regradeMessage = regradeAttemptCount > 0
    ? `এই পরীক্ষায় ইতিমধ্যে ${regradeAttemptCount} জন পরীক্ষা দিয়েছে বা শুরু করেছে। সেভ করলে তাদের রেজাল্ট আর লিডারবোর্ড আবার ক্যালকুলেট হবে।`
    : "এই পরীক্ষাটা পাবলিশড। কেউ হয়তো ইতিমধ্যে পরীক্ষা দিয়ে ফেলেছে, তাই সেভ করলে রেজাল্ট আর লিডারবোর্ড আবার ক্যালকুলেট হতে পারে।";

  return (
    <div className="flex flex-col gap-7">
      <WizardHeader
        step={step}
        status={basicInfo.status}
        title="পরীক্ষা এডিট করুন"
        subtitle="পরীক্ষার ইনফো আর প্রশ্নগুলো এডিট করুন"
        backHref="/mcq"
        onStepChange={setStep}
      />

      <EditWizardFooter
        step={step}
        isSaving={isSaving}
        onPrev={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2) : s))}
        onNext={() => setStep((s) => (s < 3 ? ((s + 1) as 2 | 3) : s))}
        onSave={handleSave}
      />

      {exam.status === "published" && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <RefreshCw size={20} className="mt-0.5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-bold text-amber-200">পাবলিশড পরীক্ষা এডিট করছেন</p>
            <p className="mt-1 text-sm leading-6 text-amber-100/75">
              প্রশ্ন, সঠিক উত্তর, নম্বর বা নেগেটিভ মার্কিং বদলালে সেভ করার সময় আগে যারা পরীক্ষা দিয়েছে তাদের রেজাল্ট আর লিডারবোর্ড আবার ক্যালকুলেট হবে।
            </p>
          </div>
        </div>
      )}

      {saveError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-sm text-red-500">{saveError}</p>
        </div>
      )}

      {saveMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-500" />
          <p className="text-sm text-emerald-500">{saveMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-7">
          {step === 1 && <StepBasicInfo value={basicInfo} onChange={setBasicInfo} />}
          {step === 2 && (
            <StepQuestions
              questions={questions}
              defaultMarks={basicInfo.marksPerQuestion || "1"}
              onChange={setQuestions}
            />
          )}
          {step === 3 && <StepReview basicInfo={basicInfo} questions={questions} published={false} />}
        </div>

        <div className="flex flex-col gap-6">
          <ExamSummary
            value={basicInfo}
            questionCount={questions.length}
            totalMarks={marksTally.total}
            marksSummary={marksTally.summary}
          />
          <TipsBox step={step} />
        </div>
      </div>

      <EditWizardFooter
        step={step}
        isSaving={isSaving}
        onPrev={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2) : s))}
        onNext={() => setStep((s) => (s < 3 ? ((s + 1) as 2 | 3) : s))}
        onSave={handleSave}
      />

      <ConfirmActionDialog
        open={showRegradeConfirm}
        title="রেজাল্ট আবার ক্যালকুলেট হবে"
        message={regradeMessage}
        confirmLabel="সেভ করুন"
        isLoading={isSaving}
        onClose={() => setShowRegradeConfirm(false)}
        onConfirm={() => {
          setShowRegradeConfirm(false);
          void handleSave(true);
        }}
      />
    </div>
  );
}
