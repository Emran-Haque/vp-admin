import type { Exam, ExamAttempt } from "@/redux/api/examsApi";
import type { Course } from "@/redux/api/coursesApi";

/** How an attempt ended, when it was not a normal submit. */
export type EndedBy = "time" | "left_screen" | "offline" | null;

export type ResultRow = {
  id: number;
  /** Only a student's first attempt is ranked; retakes have none. */
  rank: number | null;
  attemptNumber: number;
  endedBy: EndedBy;
  studentName: string;
  studentId: string;
  /** The student's user id, for the details popup. */
  studentUserId: number;
  course: string;
  exam: string;
  score: number;
  maxScore: number;
  passed: boolean;
  date: string;
};

export const endedByStatus: Record<string, EndedBy> = {
  auto_submitted: "time",
  violation_submitted: "left_screen",
  offline: "offline",
};

export function toResultRow(
  attempt: ExamAttempt,
  examsById: Map<number, Exam>,
  coursesById: Map<number, Course>
): ResultRow {
  const exam = examsById.get(attempt.exam);
  const course = exam && exam.course != null ? coursesById.get(exam.course) : undefined;

  return {
    id: attempt.id,
    rank: attempt.rank ?? null,
    attemptNumber: attempt.attempt_number ?? 1,
    endedBy: endedByStatus[attempt.status] ?? null,
    studentName: attempt.student_name,
    studentId: `#${attempt.student}`,
    studentUserId: attempt.student,
    course: course?.title ?? "—",
    exam: exam?.title ?? `পরীক্ষা #${attempt.exam}`,
    score: Number(attempt.final_marks || 0),
    maxScore: Number(exam?.total_marks || 0),
    passed: attempt.is_passed,
    date: attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString("bn-BD") : "—",
  };
}
