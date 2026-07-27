import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

export type AssignmentAttachment = {
  id: number;
  file: string;
  filename: string;
  size: string;
  external_link: string;
};

export type Assignment = {
  id: number;
  course: number;
  course_title?: string;
  course_class: number | null;
  course_class_title?: string;
  subject: number | null;
  subject_name?: string;
  title: string;
  description: string;
  due_date: string;
  max_marks: string;
  status: "active" | "closed" | "evaluated";
  created_by: number;
  attachments: AssignmentAttachment[];
  created_at: string;
};

export type AssignmentTelegramStatus = {
  is_posted: boolean;
  telegram_message_id?: number | null;
  group_chat_id?: number | null;
  group_title?: string;
  posted_at?: string | null;
  last_error?: string;
};

export type AssignmentTelegramPostResult = {
  assignment: number;
  posted: boolean;
  telegram_message_id: number | null;
  group_chat_id: number;
  group_title: string;
  posted_at: string | null;
  is_active: boolean;
};

export type AssignmentListParams = {
  course?: number;
  course_class?: number;
  subject?: number;
  status?: string;
  page?: number;
};

export type CreateAssignmentInput = Partial<
  Omit<Assignment, "id" | "created_by" | "attachments" | "created_at">
> & {
  course: number;
  title: string;
};

export type UpdateAssignmentInput = Partial<CreateAssignmentInput>;

export type Submission = {
  id: number;
  assignment: number;
  assignment_title?: string;
  course?: number;
  course_class?: number | null;
  course_class_title?: string;
  student: number;
  student_name?: string;
  student_email?: string;
  submission_type: string;
  file: string | null;
  drive_link: string;
  text_answer: string;
  source: "website" | "telegram";
  telegram_message_id?: number | null;
  original_filename?: string;
  mime_type?: string;
  file_size?: number | null;
  submitted_at: string;
  status: "submitted" | "evaluated" | "late" | "rejected";
  marks_obtained: string | null;
  teacher_comment: string;
  evaluated_by: number | null;
  evaluated_at: string | null;
};

export type SubmissionListParams = {
  assignment?: number;
  course?: number;
  course_class?: number;
  status?: string;
  student?: number;
  page?: number;
};

export type EvaluateSubmissionInput = {
  marks_obtained: string;
  teacher_comment: string;
  status: string;
};

export const assignmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAssignments: builder.query<Paginated<Assignment>, AssignmentListParams | void>({
      query: (params) => ({ url: "admin/assignments/", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((a) => ({ type: "Assignments" as const, id: a.id })),
              { type: "Assignments" as const, id: "LIST" },
            ]
          : [{ type: "Assignments" as const, id: "LIST" }],
    }),
    getAssignment: builder.query<Assignment, number>({
      query: (id) => `admin/assignments/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "Assignments", id }],
    }),
    createAssignment: builder.mutation<Assignment, CreateAssignmentInput>({
      query: (body) => ({ url: "admin/assignments/", method: "POST", body }),
      invalidatesTags: [{ type: "Assignments", id: "LIST" }],
    }),
    updateAssignment: builder.mutation<Assignment, { id: number; data: UpdateAssignmentInput }>({
      query: ({ id, data }) => ({ url: `admin/assignments/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Assignments", id },
        { type: "Assignments", id: "LIST" },
      ],
    }),
    deleteAssignment: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/assignments/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "Assignments", id: "LIST" }],
    }),
    getAssignmentTelegramStatus: builder.query<AssignmentTelegramStatus, number>({
      query: (id) => `admin/assignments/${id}/telegram-status/`,
      providesTags: (_result, _error, id) => [{ type: "Assignments", id: `telegram-${id}` }],
    }),
    postAssignmentToTelegram: builder.mutation<
      AssignmentTelegramPostResult,
      { id: number; force_repost?: boolean }
    >({
      query: ({ id, force_repost }) => ({
        url: `admin/assignments/${id}/post-to-telegram/`,
        method: "POST",
        body: { force_repost: Boolean(force_repost) },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Assignments", id: `telegram-${id}` },
        { type: "Assignments", id: "LIST" },
      ],
    }),
    getSubmissions: builder.query<Paginated<Submission>, SubmissionListParams | void>({
      query: (params) => ({ url: "admin/submissions/", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((s) => ({ type: "Submissions" as const, id: s.id })),
              { type: "Submissions" as const, id: "LIST" },
            ]
          : [{ type: "Submissions" as const, id: "LIST" }],
    }),
    evaluateSubmission: builder.mutation<
      Submission,
      { id: number; data: EvaluateSubmissionInput }
    >({
      query: ({ id, data }) => ({
        url: `admin/submissions/${id}/evaluate/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Submissions", id },
        { type: "Submissions", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAssignmentsQuery,
  useGetAssignmentQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
  useGetAssignmentTelegramStatusQuery,
  usePostAssignmentToTelegramMutation,
  useGetSubmissionsQuery,
  useEvaluateSubmissionMutation,
} = assignmentsApi;
