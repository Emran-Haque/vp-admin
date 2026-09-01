"use client";

import { useState } from "react";
import WizardHeader from "./includes/wizard-header";
import StepBasicInfo from "./includes/step-basic-info";
import StepQuestions from "./includes/step-questions";
import StepReview from "./includes/step-review";
import ExamSummary from "./includes/exam-summary";
import { tallyMarks } from "./includes/marks";
import TipsBox from "./includes/tips-box";
import WizardFooter from "./includes/wizard-footer";
import {
  useCreateExamMutation,
  useAddExamQuestionsMutation,
  usePublishExamMutation,
  usePublishExamResultMutation,
} from "@/redux/api/examsApi";
import { combineDateTime, localDateTimeToIso } from "@/lib/exam-datetime";
import { extractErrorMessage } from "@/lib/api-error";
import type { ExamBasicInfo, Question } from "./includes/types";

const emptyBasicInfo: ExamBasicInfo = {
  name: "",
  course: "",
  subject: "",
  subjectName: "",
  duration: "30",
  totalQuestions: "30",
  passMark: "40",
  marksPerQuestion: "1",
  negativeMode: "percentage",
  negativeMark: "0.25",
  negativePercentage: "25",
  examDate: "",
  startTime: "",
  deadline: "",
  resultPublishAt: "",
  leaderboardPublishAt: "",
  description: "",
  status: "draft",
};

const optionLetters = ["A", "B", "C", "D"] as const;

export default function Page() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [basicInfo, setBasicInfo] = useState<ExamBasicInfo>(emptyBasicInfo);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [published, setPublished] = useState(false);
  const marksTally = tallyMarks(questions, basicInfo.marksPerQuestion || "1");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const [createExam] = useCreateExamMutation();
  const [addExamQuestions] = useAddExamQuestionsMutation();
  const [publishExam] = usePublishExamMutation();
  const [publishExamResult] = usePublishExamResultMutation();

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishError(null);

    const durationMinutes = Number(basicInfo.duration) || 0;
    const startDateTime = combineDateTime(basicInfo.examDate, basicInfo.startTime);
    // Deadline is set independently of duration; the backend caps each student's
    // attempt at this time (start near it → less time).
    const endDateTime = localDateTimeToIso(basicInfo.deadline);

    let exam;
    try {
      exam = await createExam({
        course: Number(basicInfo.course),
        title: basicInfo.name,
        subject: basicInfo.subject ? Number(basicInfo.subject) : undefined,
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
        status: basicInfo.status === "published" ? "draft" : basicInfo.status,
      }).unwrap();
    } catch (err) {
      console.error("Failed to create exam:", err);
      setPublishError(`পরীক্ষা তৈরি করা যায়নি: ${extractErrorMessage(err)}`);
      setIsPublishing(false);
      return;
    }

    // One request for the whole paper. Sending them one by one made the server
    // re-grade every submitted attempt once per question, which a 100-question
    // C-unit paper turns into 100 full regrades.
    if (questions.length > 0) {
      try {
        await addExamQuestions({
          examId: exam.id,
          questions: questions.map((q, i) => ({
            question_text: q.text,
            option_a: q.options[0] ?? "",
            option_b: q.options[1] ?? "",
            option_c: q.options[2] ?? "",
            option_d: q.options[3] ?? "",
            correct_option: optionLetters[q.correctIndex ?? 0],
            explanation: q.explanation,
            // Omitted when blank, so the server applies the exam default.
            ...(q.marks.trim() ? { marks: q.marks.trim() } : {}),
            order: i + 1,
          })),
        }).unwrap();
      } catch (err) {
        console.error("Failed to add questions:", err);
        setPublishError(`প্রশ্ন অ্যাড করা যায়নি: ${extractErrorMessage(err)}`);
        setIsPublishing(false);
        return;
      }
    }

    if (basicInfo.status === "published" && questions.length > 0) {
      try {
        await publishExam(exam.id).unwrap();
      } catch (err) {
        console.error("Failed to publish exam:", err);
        setPublishError(`পরীক্ষা পাবলিশ করা যায়নি: ${extractErrorMessage(err)}`);
        setIsPublishing(false);
        return;
      }
    }

    const resultPublishAt = localDateTimeToIso(basicInfo.resultPublishAt);
    const leaderboardPublishAt = localDateTimeToIso(basicInfo.leaderboardPublishAt);

    if (resultPublishAt || leaderboardPublishAt) {
      try {
        await publishExamResult({
          id: exam.id,
          data: {
            ...(resultPublishAt ? { result_publish_at: resultPublishAt } : {}),
            ...(leaderboardPublishAt ? { leaderboard_publish_at: leaderboardPublishAt } : {}),
          },
        }).unwrap();
      } catch (err) {
        console.error("Failed to schedule result/leaderboard publish:", err);
        setPublishError(`রেজাল্ট/লিডারবোর্ড পাবলিশের শিডিউল সেট করা যায়নি: ${extractErrorMessage(err)}`);
        setIsPublishing(false);
        return;
      }
    }

    setPublished(true);
    setIsPublishing(false);
  };

  return (
    <div className="flex flex-col gap-7">
      <WizardHeader step={step} status={basicInfo.status} onStepChange={setStep} />

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
            <ExamSummary
            value={basicInfo}
            questionCount={questions.length}
            totalMarks={marksTally.total}
            marksSummary={marksTally.summary}
          />
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
