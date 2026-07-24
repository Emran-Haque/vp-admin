"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import WizardHeader from "../../create/includes/wizard-header";
import StepBasicInfo from "../../create/includes/step-basic-info";
import StepQuestions from "../../create/includes/step-questions";
import StepReview from "../../create/includes/step-review";
import ExamSummary from "../../create/includes/exam-summary";
import TipsBox from "../../create/includes/tips-box";
import EditWizardFooter from "./includes/edit-wizard-footer";
import {
  useGetExamQuery,
  useGetExamQuestionsQuery,
  useUpdateExamMutation,
  useAddExamQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
} from "@/redux/api/examsApi";
import { useGetCourseSubjectsQuery } from "@/redux/api/courseSubjectsApi";
import {
  combineDateTime,
  addMinutes,
  isoToTimeInput,
  isoToLocalDateTimeInput,
} from "@/lib/exam-datetime";
import { extractErrorMessage } from "@/lib/api-error";
import ErrorState from "@/components/error-state";
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
  const { data: courseSubjectsData } = useGetCourseSubjectsQuery(
    { course: exam?.course },
    { skip: !exam?.course }
  );

  const [updateExam] = useUpdateExamMutation();
  const [addExamQuestion] = useAddExamQuestionMutation();
  const [updateQuestion] = useUpdateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [basicInfo, setBasicInfo] = useState<ExamBasicInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const initializedRef = useRef(false);
  const originalQuestionIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (initializedRef.current || !exam || !questionsData) return;
    initializedRef.current = true;

    const subjectName = courseSubjectsData?.results.find((s) => s.id === exam.subject)?.name ?? "";

    setBasicInfo({
      name: exam.title,
      course: String(exam.course),
      subject: exam.subject != null ? String(exam.subject) : "",
      subjectName,
      duration: String(exam.duration_minutes),
      totalQuestions: String(exam.total_questions),
      passMark: exam.pass_mark_percentage,
      negativeMark: exam.negative_mark_per_wrong,
      examDate: exam.exam_date,
      startTime: isoToTimeInput(exam.start_time),
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
    }));
    setQuestions(loadedQuestions);
    originalQuestionIdsRef.current = new Set(questionsData.map((q) => q.id));
  }, [exam, questionsData, courseSubjectsData]);

  const handleSave = async () => {
    if (!basicInfo) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    const durationMinutes = Number(basicInfo.duration) || 0;
    const startDateTime = combineDateTime(basicInfo.examDate, basicInfo.startTime);
    const endDateTime = addMinutes(startDateTime, durationMinutes);

    try {
      await updateExam({
        id: examId,
        data: {
          title: basicInfo.name,
          subject: basicInfo.subject ? Number(basicInfo.subject) : null,
          instructions: basicInfo.description,
          duration_minutes: durationMinutes,
          negative_mark_per_wrong: basicInfo.negativeMark || "0",
          pass_mark_percentage: basicInfo.passMark || "0",
          exam_date: basicInfo.examDate || undefined,
          start_time: startDateTime,
          end_time: endDateTime,
        },
      }).unwrap();
    } catch (err) {
      setSaveError(`পরীক্ষা সংরক্ষণ করা যায়নি: ${extractErrorMessage(err)}`);
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
        setSaveError(`প্রশ্ন মুছে ফেলা যায়নি: ${extractErrorMessage(err)}`);
        setIsSaving(false);
        return;
      }
    }

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
      try {
        if (isPersisted(q.id)) {
          await updateQuestion({ id: Number(q.id), data }).unwrap();
        } else {
          const created = await addExamQuestion({ examId, data }).unwrap();
          originalQuestionIdsRef.current.add(created.id);
          setQuestions((prev) => prev.map((item) => (item.id === q.id ? { ...item, id: String(created.id) } : item)));
        }
      } catch (err) {
        setSaveError(`প্রশ্ন ${i + 1} সংরক্ষণ করা যায়নি: ${extractErrorMessage(err)}`);
        setIsSaving(false);
        return;
      }
    }

    originalQuestionIdsRef.current = new Set(currentQuestionIds);
    setIsSaving(false);
    setSaveMessage("পরিবর্তন সংরক্ষণ করা হয়েছে।");
  };

  if (isLoadingExam || isLoadingQuestions || !basicInfo) {
    return <p className="text-center text-sm text-slate-400">পরীক্ষার তথ্য লোড হচ্ছে…</p>;
  }

  if (isExamError || !exam) {
    return (
      <ErrorState
        message="পরীক্ষাটি খুঁজে পাওয়া যায়নি। API সার্ভার সংযোগ পরীক্ষা করুন।"
        error={isExamError ? examError : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <WizardHeader
        step={step}
        status={basicInfo.status}
        title="পরীক্ষা সম্পাদনা করুন"
        subtitle="পরীক্ষার বিস্তারিত তথ্য ও প্রশ্নাবলি সম্পাদনা করুন"
        backHref="/mcq"
      />

      <EditWizardFooter
        step={step}
        isSaving={isSaving}
        onPrev={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2) : s))}
        onNext={() => setStep((s) => (s < 3 ? ((s + 1) as 2 | 3) : s))}
        onSave={handleSave}
        showSave={false}
      />

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
          {step === 2 && <StepQuestions questions={questions} onChange={setQuestions} />}
          {step === 3 && <StepReview basicInfo={basicInfo} questions={questions} published={false} />}
        </div>

        <div className="flex flex-col gap-6">
          <ExamSummary value={basicInfo} questionCount={questions.length} />
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
    </div>
  );
}
