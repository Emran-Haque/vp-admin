import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

export type Exam = {
  id: number;
  /** null for standalone exam-batch (routine) exams — they have no course. */
  course: number | null;
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
  exam_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: "draft" | "published" | "closed" | string;
  result_status: "hidden" | "pending" | "published" | string;
  is_result_published?: boolean;
  is_leaderboard_visible?: boolean;
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
  page_size?: number;
};

export type CreateExamInput = Partial<
  Omit<
    Exam,
    | "id"
    | "slug"
    | "created_by"
    | "published_by"
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
  result_publish_at?: string | null;
  leaderboard_publish_at?: string | null;
};

export type PublishResultOutput = {
  result_status: string;
  result_publish_at: string | null;
  leaderboard_publish_at: string | null;
};

export type RecalculateResultsOutput = {
  detail: string;
  updated_attempts: number;
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
  completed?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
};

export type ExamBatchExam = {
  id: number;
  batch: number;
  exam: number;
  exam_title: string;
  exam_status: string;
  exam_date: string | null;
  start_time: string | null;
  end_time: string | null;
  result_status: string;
  is_result_published: boolean;
  result_publish_at: string | null;
  leaderboard_publish_at: string | null;
  total_questions: number;
  total_marks: string;
  duration_minutes: number;
  marks_per_question: string;
  negative_mark_per_wrong: string;
  ordering: number;
  note: string;
  subject_label: string;
  planned_questions: number;
};

export type RoutineImportQuestion = {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation?: string;
};

export type RoutineImportExam = {
  title: string;
  subject_label?: string;
  exam_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration_minutes?: number;
  marks_per_question?: string;
  negative_mark_per_wrong?: string;
  planned_questions?: number;
  /** Empty for schedule-only routine rows — questions are added per tile later. */
  questions: RoutineImportQuestion[];
};

export type ExamBatch = {
  id: number;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  thumbnail: string | null;
  promo_video_url: string;
  price: string;
  old_price: string | null;
  discount: string;
  is_published: boolean;
  start_date: string | null;
  end_date: string | null;
  routine_note: string;
  exam_count: number;
  enrolled_count: number;
  is_enrolled: boolean;
  exams: ExamBatchExam[];
  created_at: string;
  updated_at: string;
};

export type ExamBatchInput = Partial<
  Pick<
    ExamBatch,
    | "title"
    | "description"
    | "short_description"
    | "promo_video_url"
    | "price"
    | "old_price"
    | "discount"
    | "is_published"
    | "start_date"
    | "end_date"
    | "routine_note"
  >
> & { title: string };

export type ExamBatchJoinRequest = {
  id: number;
  batch: number;
  student: number;
  student_name: string;
  student_email: string;
  /** The name the student uses on Facebook (to be added to the group). */
  name: string;
  is_added: boolean;
  created_at: string;
};

export type ExamBatchEnrollment = {
  id: number;
  student: number;
  student_name: string;
  student_email: string;
  batch: number;
  batch_title: string;
  source: string;
  enrolled_at: string;
  is_active: boolean;
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
        "ExamAttempts",
      ],
    }),
    updateQuestion: builder.mutation<ExamQuestion, { id: number; data: UpdateExamQuestionInput }>({
      query: ({ id, data }) => ({ url: `admin/questions/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: ["ExamQuestions", "ExamAttempts", "Exams"],
    }),
    deleteQuestion: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/questions/${id}/`, method: "DELETE" }),
      invalidatesTags: ["ExamQuestions", "ExamAttempts", "Exams"],
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
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Exams", id },
        "ExamAttempts",
      ],
    }),
    recalculateLeaderboard: builder.mutation<RecalculateResultsOutput, number>({
      query: (id) => ({ url: `admin/exams/${id}/recalculate-leaderboard/`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Exams", id },
        "ExamAttempts",
      ],
    }),
    getExamLeaderboard: builder.query<LeaderboardResponse, number>({
      query: (id) => `admin/exams/${id}/leaderboard/`,
      providesTags: (_result, _error, id) => [{ type: "ExamAttempts", id: `leaderboard-${id}` }],
    }),
    getExamAnalytics: builder.query<ExamAnalytics, number>({
      query: (id) => `admin/exams/${id}/analytics/`,
      providesTags: (_result, _error, id) => [{ type: "ExamAttempts", id: `analytics-${id}` }],
    }),
    getExamAttempts: builder.query<Paginated<ExamAttempt>, ExamAttemptListParams | void>({
      query: (params) => ({ url: "admin/exam-attempts/", params: params ?? undefined }),
      providesTags: ["ExamAttempts"],
    }),
    getExamBatches: builder.query<Paginated<ExamBatch>, { search?: string; page?: number } | void>({
      query: (params) => ({ url: "admin/exam-batches/", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((batch) => ({ type: "ExamBatches" as const, id: batch.id })),
              { type: "ExamBatches" as const, id: "LIST" },
            ]
          : [{ type: "ExamBatches" as const, id: "LIST" }],
    }),
    getExamBatch: builder.query<ExamBatch, number>({
      query: (id) => `admin/exam-batches/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "ExamBatches", id }],
    }),
    createExamBatch: builder.mutation<ExamBatch, ExamBatchInput | FormData>({
      query: (body) => ({ url: "admin/exam-batches/", method: "POST", body }),
      invalidatesTags: [{ type: "ExamBatches", id: "LIST" }],
    }),
    updateExamBatch: builder.mutation<ExamBatch, { id: number; data: Partial<ExamBatchInput> | FormData }>({
      query: ({ id, data }) => ({ url: `admin/exam-batches/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ExamBatches", id },
        { type: "ExamBatches", id: "LIST" },
      ],
    }),
    getBatchJoinRequests: builder.query<ExamBatchJoinRequest[], number>({
      query: (batchId) => `admin/exam-batches/${batchId}/join-requests/`,
      providesTags: (_result, _error, batchId) => [{ type: "ExamBatches", id: `join-${batchId}` }],
    }),
    updateJoinRequest: builder.mutation<
      ExamBatchJoinRequest,
      { id: number; batchId: number; data: { is_added?: boolean } }
    >({
      query: ({ id, data }) => ({ url: `admin/exam-batch-join-requests/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { batchId }) => [{ type: "ExamBatches", id: `join-${batchId}` }],
    }),
    addExamToBatch: builder.mutation<
      ExamBatchExam,
      { batch: number; exam: number; ordering?: number; note?: string; subject_label?: string }
    >({
      query: (body) => ({ url: "admin/exam-batch-exams/", method: "POST", body }),
      invalidatesTags: (_result, _error, { batch }) => [
        { type: "ExamBatches", id: batch },
        { type: "ExamBatches", id: "LIST" },
      ],
    }),
    updateBatchExam: builder.mutation<
      ExamBatchExam,
      { id: number; batch: number; data: Partial<Pick<ExamBatchExam, "ordering" | "note" | "subject_label" | "planned_questions">> }
    >({
      query: ({ id, data }) => ({ url: `admin/exam-batch-exams/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { batch }) => [
        { type: "ExamBatches", id: batch },
        { type: "ExamBatches", id: "LIST" },
      ],
    }),
    removeExamFromBatch: builder.mutation<void, { id: number; batch: number }>({
      query: ({ id }) => ({ url: `admin/exam-batch-exams/${id}/`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { batch }) => [
        { type: "ExamBatches", id: batch },
        { type: "ExamBatches", id: "LIST" },
      ],
    }),
    importRoutine: builder.mutation<
      { created: number; batch: ExamBatch },
      { batchId: number; publish: boolean; exams: RoutineImportExam[] }
    >({
      query: ({ batchId, publish, exams }) => ({
        url: `admin/exam-batches/${batchId}/import-routine/`,
        method: "POST",
        body: { publish, exams },
      }),
      invalidatesTags: (_result, _error, { batchId }) => [
        { type: "ExamBatches", id: batchId },
        { type: "ExamBatches", id: "LIST" },
      ],
    }),
    getExamBatchEnrollments: builder.query<ExamBatchEnrollment[], number>({
      query: (id) => `admin/exam-batches/${id}/enrollments/`,
      providesTags: (_result, _error, id) => [{ type: "ExamBatches", id: `enrollments-${id}` }],
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
  useGetExamBatchesQuery,
  useGetExamBatchQuery,
  useCreateExamBatchMutation,
  useUpdateExamBatchMutation,
  useAddExamToBatchMutation,
  useUpdateBatchExamMutation,
  useRemoveExamFromBatchMutation,
  useImportRoutineMutation,
  useGetExamBatchEnrollmentsQuery,
  useGetBatchJoinRequestsQuery,
  useUpdateJoinRequestMutation,
} = examsApi;
