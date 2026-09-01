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
  /** Default mark for questions added from here on. Never rewrites existing ones. */
  marksPerQuestion: string;
  /**
   * `flat` subtracts `negativeMark` from any wrong answer. `percentage`
   * subtracts `negativePercentage`% of that question's own marks — what CU's
   * C unit needs, where a 2-mark question costs twice a 1-mark one.
   */
  negativeMode: "flat" | "percentage";
  negativeMark: string;
  negativePercentage: string;
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
  /**
   * What this question alone is worth, as typed (so the input stays
   * controlled). Empty means "use the exam default" — the server resolves it,
   * which is why a plain 1-mark paper never has to fill this in.
   */
  marks: string;
};
