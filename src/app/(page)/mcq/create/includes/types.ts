export type ExamStatus = "draft" | "scheduled" | "published";

export type ExamBasicInfo = {
  name: string;
  course: string;
  subject: string;
  duration: string;
  totalQuestions: string;
  passMark: string;
  negativeMark: string;
  examDate: string;
  startTime: string;
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
