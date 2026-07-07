"use client";

import { useState } from "react";
import WizardHeader from "./includes/wizard-header";
import StepBasicInfo from "./includes/step-basic-info";
import StepQuestions from "./includes/step-questions";
import StepReview from "./includes/step-review";
import ExamSummary from "./includes/exam-summary";
import TipsBox from "./includes/tips-box";
import WizardFooter from "./includes/wizard-footer";
import { useCreateExamMutation, useAddExamQuestionMutation, usePublishExamMutation } from "@/redux/api/examsApi";
import type { ExamBasicInfo, Question } from "./includes/types";

const emptyBasicInfo: ExamBasicInfo = {
  name: "",
  course: "",
  subject: "",
  duration: "30",
  totalQuestions: "30",
  passMark: "40",
  negativeMark: "0.25",
  examDate: "",
  startTime: "",
  description: "",
  status: "draft",
};

const optionLetters = ["A", "B", "C", "D"] as const;

export default function Page() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [basicInfo, setBasicInfo] = useState<ExamBasicInfo>(emptyBasicInfo);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [published, setPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const [createExam] = useCreateExamMutation();
  const [addExamQuestion] = useAddExamQuestionMutation();
  const [publishExam] = usePublishExamMutation();

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishError(null);
    try {
      const startDateTime =
        basicInfo.examDate && basicInfo.startTime
          ? new Date(`${basicInfo.examDate}T${basicInfo.startTime}:00`).toISOString()
          : undefined;

      const exam = await createExam({
        course: Number(basicInfo.course),
        title: basicInfo.name,
        subject: basicInfo.subject,
        instructions: basicInfo.description,
        duration_minutes: Number(basicInfo.duration) || 0,
        negative_mark_per_wrong: basicInfo.negativeMark || "0",
        pass_mark_percentage: basicInfo.passMark || "0",
        exam_date: basicInfo.examDate || undefined,
        start_time: startDateTime,
        end_time: startDateTime,
      }).unwrap();

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await addExamQuestion({
          examId: exam.id,
          data: {
            question_text: q.text,
            option_a: q.options[0] ?? "",
            option_b: q.options[1] ?? "",
            option_c: q.options[2] ?? "",
            option_d: q.options[3] ?? "",
            correct_option: optionLetters[q.correctIndex ?? 0],
            explanation: q.explanation,
            order: i + 1,
          },
        }).unwrap();
      }

      if (questions.length > 0) {
        await publishExam(exam.id).unwrap();
      }

      setPublished(true);
    } catch {
      setPublishError("পরীক্ষা প্রকাশ করা যায়নি। তথ্য ও API সংযোগ যাচাই করে আবার চেষ্টা করুন।");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-col gap-7">
      <WizardHeader step={step} status={basicInfo.status} />

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-7">
          {step === 1 && <StepBasicInfo value={basicInfo} onChange={setBasicInfo} />}
          {step === 2 && <StepQuestions questions={questions} onChange={setQuestions} />}
          {step === 3 && (
            <StepReview
              basicInfo={basicInfo}
              questions={questions}
              published={published}
              isPublishing={isPublishing}
              error={publishError}
            />
          )}
        </div>

        {!published && (
          <div className="flex flex-col gap-6">
            <ExamSummary value={basicInfo} questionCount={questions.length} />
            <TipsBox step={step} />
          </div>
        )}
      </div>

      <WizardFooter
        step={step}
        published={published}
        onPrev={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2) : s))}
        onNext={() => setStep((s) => (s < 3 ? ((s + 1) as 2 | 3) : s))}
        onPublish={handlePublish}
      />
    </div>
  );
}
