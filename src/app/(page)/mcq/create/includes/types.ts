export type ExamStatus = "draft" | "scheduled" | "published";

export type ExamBasicInfo = {
  name: string;
  course: string;
  /** CourseSubject id (as a string, for select binding) — must belong to `course`. */
  subject: string;
  /** Display name of the selected subject, kept in sync with `subject`. */
  subjectName: string;
  duration: string;
  totalQuestions: string;
  passMark: string;
  negativeMark: string;
  examDate: string;
  startTime: string;
  /** Deadline the whole exam closes for everyone ("YYYY-MM-DDTHH:MM", or "" for
   *  no deadline). Independent of `duration` — a student who starts near it is
   *  cut off at the deadline. */
  deadline: string;
  resultPublishAt: string;
  leaderboardPublishAt: string;
  description: string;
  status: ExamStatus;
};

export type Question = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number | null;
  explanation: string;
};
