export type MaterialKind = "pdf" | "video" | "mcq";

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number | null;
};

export type MaterialDraft = {
  id: string;
  kind: MaterialKind;
  title: string;
  file?: File | null;
  driveLink?: string;
  videoUrl?: string;
  quizId?: number | null;
  questions?: QuizQuestion[];
};

export type BasicInfo = {
  name: string;
  shortDescription: string;
  fullDescription: string;
  whyNeeded: string;
  category: string;
  level: string;
  price: string;
  oldPrice: string;
  discount: string;
  isFree: boolean;
  verificationRequired: boolean;
  duration: string;
  batchStartDate: string;
  classStartDate: string;
  totalClasses: string;
  totalQuizzes: string;
  totalAssignments: string;
  /** SMS inactivity-reminder window in days: "0" = off, "1"/"2"/"3". */
  inactivityReminderDays: string;
  telegramGroupLink: string;
  telegramGroupChatId: number | null;
  telegramGroupTitle: string;
  telegramGroupConnectCode: string;
  telegramGroupConnectedAt: string | null;
  promoVideoUrl: string;
  syllabusDriveLink: string;
  teacherIds: string[];
};

export type CourseFiles = {
  thumbnail: File | null;
  coverImage: File | null;
  syllabusPdf: File | null;
};

export type SubjectDraft = { id: string; name: string; description: string };
export type FaqDraft = { id: string; question: string; answer: string };
