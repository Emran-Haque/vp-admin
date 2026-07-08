import type { Exam, ExamAttempt } from "@/redux/api/examsApi";
import type { Course } from "@/redux/api/coursesApi";

export type ResultRow = {
  id: number;
  rank: number;
  studentName: string;
  studentId: string;
  course: string;
  exam: string;
  score: number;
  maxScore: number;
  passed: boolean;
  date: string;
};

export function toResultRow(
  attempt: ExamAttempt,
  examsById: Map<number, Exam>,
  coursesById: Map<number, Course>
): ResultRow {
  const exam = examsById.get(attempt.exam);
  const course = exam ? coursesById.get(exam.course) : undefined;

  return {
    id: attempt.id,
    rank: attempt.rank,
    studentName: attempt.student_name,
    studentId: `#${attempt.student}`,
    course: course?.title ?? "—",
    exam: exam?.title ?? `পরীক্ষা #${attempt.exam}`,
    score: Number(attempt.final_marks || 0),
    maxScore: Number(exam?.total_marks || 0),
    passed: attempt.is_passed,
    date: attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString("bn-BD") : "—",
  };
}
