export type ContentType = "video" | "file" | "quiz";

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number | null;
};

export type ModuleItem = {
  id: string;
  type: ContentType;
  title: string;
  videoUrl?: string;
  videoDuration?: string;
  file?: File | null;
  questions?: QuizQuestion[];
};

export type CourseModule = {
  id: string;
  title: string;
  items: ModuleItem[];
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
  duration: string;
  batchStartDate: string;
  classStartDate: string;
  totalClasses: string;
  totalQuizzes: string;
  totalAssignments: string;
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
