import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

export type Exam = {
  id: number;
  course: number;
  course_class: number | null;
  title: string;
  slug: string;
  subject: number | null;
  instructions: string;
  total_questions: number;
  duration_minutes: number;
  total_marks: string;
  marks_per_question: string;
  negative_mark_per_wrong: string;
  pass_mark_percentage: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  status: "draft" | "published" | "closed" | string;
  result_status: "hidden" | "pending" | "published" | string;
  result_publish_at: string | null;
  leaderboard_publish_at: string | null;
  auto_submit_on_time_end: boolean;
  auto_submit_on_violation: boolean;
  allow_late_enrolled_students: boolean;
  created_by: number;
  published_by: number | null;
};

export type ExamListParams = {
  course?: number;
  status?: string;
  result_status?: string;
  search?: string;
  page?: number;
};

export type CreateExamInput = Partial<
  Omit<
    Exam,
    | "id"
    | "slug"
    | "created_by"
    | "published_by"
    | "status"
    | "total_questions"
    | "total_marks"
    // result/leaderboard publish scheduling is not accepted by admin/exams/ — use publishExamResult
    | "result_publish_at"
    | "leaderboard_publish_at"
  >
> & {
  course: number;
  title: string;
  duration_minutes: number;
};

export type UpdateExamInput = Partial<CreateExamInput>;

export type ExamQuestion = {
  id: number;
  exam: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  explanation: string;
  order: number;
};

export type CreateExamQuestionInput = Omit<ExamQuestion, "id" | "exam">;
export type UpdateExamQuestionInput = Partial<CreateExamQuestionInput>;

/** Quiz as nested read-only inside a CourseClass (session) response. */
export type ClassQuiz = {
  id: number;
  title: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: string;
  status: string;
  questions: ExamQuestion[];
};

export type PublishResultInput = {
  result_publish_at?: string;
  leaderboard_publish_at?: string;
};

export type PublishResultOutput = {
  result_status: string;
  result_publish_at: string | null;
  leaderboard_publish_at: string | null;
};

export type LeaderboardRow = {
  rank: number;
  student_id: number;
  student_name: string;
  final_marks: string;
  correct_count: number;
  wrong_count: number;
  time_taken_seconds: number;
  submitted_at: string;
  percentile: string;
};

export type LeaderboardResponse = { rows: LeaderboardRow[] };

export type ExamAnalytics = {
  statistics: {
    total_participants: number;
    average_score: number;
    highest_score: number;
    pass_count: number;
    fail_count: number;
  };
  questions: {
    question_id: number;
    order: number;
    total_answered_count: number;
    correct_answer_count: number;
    correct_percentage: number;
    correct_answer: string;
    explanation: string;
  }[];
};

export type ExamAttempt = {
  id: number;
  exam: number;
  student: number;
  student_name: string;
  status: string;
  score: string;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  negative_marks: string;
  final_marks: string;
  time_taken_seconds: number;
  rank: number;
  percentile: string;
  is_passed: boolean;
  submitted_at: string;
  leaderboard_visible: boolean;
};

export type ExamAttemptListParams = {
  exam?: number;
  course?: number;
  status?: string;
  search?: string;
  ordering?: string;
  page?: number;
};

export const examsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExams: builder.query<Paginated<Exam>, ExamListParams | void>({
      query: (params) => ({ url: "admin/exams/", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((e) => ({ type: "Exams" as const, id: e.id })),
              { type: "Exams" as const, id: "LIST" },
            ]
          : [{ type: "Exams" as const, id: "LIST" }],
    }),
    getExam: builder.query<Exam, number>({
      query: (id) => `admin/exams/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "Exams", id }],
    }),
    createExam: builder.mutation<Exam, CreateExamInput>({
      query: (body) => ({ url: "admin/exams/", method: "POST", body }),
      invalidatesTags: [{ type: "Exams", id: "LIST" }],
    }),
    updateExam: builder.mutation<Exam, { id: number; data: UpdateExamInput }>({
      query: ({ id, data }) => ({ url: `admin/exams/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Exams", id },
        { type: "Exams", id: "LIST" },
      ],
    }),
    deleteExam: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/exams/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "Exams", id: "LIST" }],
    }),
    getExamQuestions: builder.query<ExamQuestion[], number>({
      query: (examId) => `admin/exams/${examId}/questions/`,
      providesTags: (_result, _error, examId) => [{ type: "ExamQuestions", id: examId }],
    }),
    addExamQuestion: builder.mutation<
      ExamQuestion,
      { examId: number; data: CreateExamQuestionInput }
    >({
      query: ({ examId, data }) => ({
        url: `admin/exams/${examId}/questions/`,
        method: "POST",
        body: { ...data, exam: examId },
      }),
      invalidatesTags: (_result, _error, { examId }) => [
        { type: "ExamQuestions", id: examId },
        { type: "Exams", id: examId },
      ],
    }),
    updateQuestion: builder.mutation<ExamQuestion, { id: number; data: UpdateExamQuestionInput }>({
      query: ({ id, data }) => ({ url: `admin/questions/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "ExamQuestions", id }],
    }),
    deleteQuestion: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/questions/${id}/`, method: "DELETE" }),
      invalidatesTags: ["ExamQuestions"],
    }),
    publishExam: builder.mutation<{ status: string }, number>({
      query: (id) => ({ url: `admin/exams/${id}/publish/`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Exams", id },
        { type: "Exams", id: "LIST" },
      ],
    }),
    publishExamResult: builder.mutation<
      PublishResultOutput,
      { id: number; data?: PublishResultInput }
    >({
      query: ({ id, data }) => ({
        url: `admin/exams/${id}/publish-result/`,
        method: "POST",
        body: data ?? {},
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Exams", id }],
    }),
    recalculateLeaderboard: builder.mutation<{ detail: string }, number>({
      query: (id) => ({ url: `admin/exams/${id}/recalculate-leaderboard/`, method: "POST" }),
    }),
    getExamLeaderboard: builder.query<LeaderboardResponse, number>({
      query: (id) => `admin/exams/${id}/leaderboard/`,
    }),
    getExamAnalytics: builder.query<ExamAnalytics, number>({
      query: (id) => `admin/exams/${id}/analytics/`,
    }),
    getExamAttempts: builder.query<Paginated<ExamAttempt>, ExamAttemptListParams | void>({
      query: (params) => ({ url: "admin/exam-attempts/", params: params ?? undefined }),
      providesTags: ["ExamAttempts"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetExamsQuery,
  useGetExamQuery,
  useCreateExamMutation,
  useUpdateExamMutation,
  useDeleteExamMutation,
  useGetExamQuestionsQuery,
  useLazyGetExamQuestionsQuery,
  useAddExamQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  usePublishExamMutation,
  usePublishExamResultMutation,
  useRecalculateLeaderboardMutation,
  useGetExamLeaderboardQuery,
  useGetExamAnalyticsQuery,
  useGetExamAttemptsQuery,
} = examsApi;
