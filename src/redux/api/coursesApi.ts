import { baseApi } from "./baseApi";
import type { IncludeItem, IncludePayloadItem, Paginated } from "./types";

export type Course = {
  id: number;
  title: string;
  slug: string;
  category: number;
  short_description: string;
  full_description: string;
  why_needed: string;
  thumbnail: string | null;
  cover_image: string | null;
  promo_video_url: string;
  promo_video_thumbnail: string | null;
  syllabus_pdf: string | null;
  syllabus_drive_link: string;
  price: string;
  /** Null when no discount is set. */
  old_price: string | null;
  discount_amount: string;
  discount: string;
  is_free: boolean;
  is_published: boolean;
  verification_required: boolean;
  enrollment_count: number;
  batch_start_date: string | null;
  class_start_date: string | null;
  level: string;
  duration: string;
  total_classes: number;
  total_quizzes: number;
  total_assignments: number;
  inactivity_reminder_days: number | null;
  telegram_group_link: string;
  telegram_group_chat_id: number | null;
  telegram_group_title: string;
  telegram_group_connect_code: string | null;
  telegram_group_connected_at: string | null;
  teachers: number[];
  includes_title: string;
  includes: IncludeItem[];
};

export type CourseListParams = {
  category?: number;
  is_published?: boolean;
  is_free?: boolean;
  search?: string;
  page?: number;
};

export type CreateCourseInput = Partial<
  Omit<Course, "id" | "slug" | "enrollment_count" | "includes">
> & {
  includes?: IncludePayloadItem[];
  title: string;
  category: number;
};

export type UpdateCourseInput = Partial<CreateCourseInput>;

export type CourseCategory = {
  id: number;
  name: string;
  slug: string;
  kind: string;
  description: string;
  ordering: number;
  is_active: boolean;
};

export type CreateCourseCategoryInput = {
  name: string;
  kind?: string;
  description?: string;
  ordering?: number;
  is_active?: boolean;
};

export type Enrollment = {
  id: number;
  student: number;
  course: number;
  course_detail: Course;
  source: string;
  enrolled_at: string;
  is_active: boolean;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: number | null;
  student_name?: string;
  student_email?: string | null;
  student_phone?: string | null;
};

export type BulkEnrollmentIssue = {
  row_number: number;
  email: string;
  phone: string;
  status: string;
  detail: string;
};

export type BulkEnrollmentJob = {
  id: number;
  course: number;
  course_title: string;
  uploaded_by_email: string | null;
  original_filename: string;
  status: "draft" | "queued" | "processing" | "completed" | "cancelled";
  total_rows: number;
  summary: {
    ready_new: number;
    ready_existing: number;
    new_accounts: number;
    existing_accounts: number;
    already_enrolled: number;
    invalid: number;
    conflict: number;
    completed: number;
    failed: number;
    message_failed: number;
    messages_sent: number;
    processable: number;
  };
  issues: BulkEnrollmentIssue[];
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
};

export const coursesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourses: builder.query<Paginated<Course>, CourseListParams | void>({
      query: (params) => ({ url: "admin/courses/", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((c) => ({ type: "Courses" as const, id: c.id })),
              { type: "Courses" as const, id: "LIST" },
            ]
          : [{ type: "Courses" as const, id: "LIST" }],
    }),
    getCourse: builder.query<Course, number>({
      query: (id) => `admin/courses/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "Courses", id }],
    }),
    createCourse: builder.mutation<Course, CreateCourseInput | FormData>({
      query: (body) => ({ url: "admin/courses/", method: "POST", body }),
      invalidatesTags: [{ type: "Courses", id: "LIST" }],
    }),
    updateCourse: builder.mutation<Course, { id: number; data: UpdateCourseInput | FormData }>({
      query: ({ id, data }) => ({ url: `admin/courses/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Courses", id },
        { type: "Courses", id: "LIST" },
      ],
    }),
    deleteCourse: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/courses/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "Courses", id: "LIST" }],
    }),
    publishCourse: builder.mutation<{ is_published: boolean }, number>({
      query: (id) => ({ url: `admin/courses/${id}/publish/`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Courses", id },
        { type: "Courses", id: "LIST" },
      ],
    }),
    getCourseEnrollments: builder.query<Paginated<Enrollment>, { id: number; page?: number }>({
      query: ({ id, page }) => ({ url: `admin/courses/${id}/enrollments/`, params: { page } }),
      providesTags: (_result, _error, { id }) => [{ type: "Enrollments", id }],
    }),
    updateEnrollmentVerification: builder.mutation<
      Enrollment,
      { courseId: number; enrollmentId: number; is_verified: boolean }
    >({
      query: ({ courseId, enrollmentId, is_verified }) => ({
        url: `admin/courses/${courseId}/enrollments/${enrollmentId}/verification/`,
        method: "PATCH",
        body: { is_verified },
      }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: "Enrollments", id: courseId },
      ],
    }),
    getBulkEnrollmentJobs: builder.query<Paginated<BulkEnrollmentJob>, number>({
      query: (course) => ({ url: "admin/bulk-enrollments/", params: { course } }),
      providesTags: [{ type: "BulkEnrollments", id: "LIST" }],
    }),
    getBulkEnrollmentJob: builder.query<BulkEnrollmentJob, number>({
      query: (id) => `admin/bulk-enrollments/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "BulkEnrollments", id }],
    }),
    uploadBulkEnrollmentCsv: builder.mutation<BulkEnrollmentJob, FormData>({
      query: (body) => ({ url: "admin/bulk-enrollments/", method: "POST", body }),
      invalidatesTags: [{ type: "BulkEnrollments", id: "LIST" }],
    }),
    startBulkEnrollment: builder.mutation<BulkEnrollmentJob, number>({
      query: (id) => ({ url: `admin/bulk-enrollments/${id}/start/`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "BulkEnrollments", id },
        { type: "BulkEnrollments", id: "LIST" },
      ],
    }),
    cancelBulkEnrollment: builder.mutation<BulkEnrollmentJob, number>({
      query: (id) => ({ url: `admin/bulk-enrollments/${id}/cancel/`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "BulkEnrollments", id },
        { type: "BulkEnrollments", id: "LIST" },
      ],
    }),
    retryBulkEnrollmentMessages: builder.mutation<BulkEnrollmentJob, number>({
      query: (id) => ({ url: `admin/bulk-enrollments/${id}/retry-messages/`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "BulkEnrollments", id },
        { type: "BulkEnrollments", id: "LIST" },
      ],
    }),
    downloadBulkEnrollmentReport: builder.mutation<string, number>({
      query: (id) => ({
        url: `admin/bulk-enrollments/${id}/report/`,
        responseHandler: (response) => response.text(),
      }),
    }),
    getCourseCategories: builder.query<CourseCategory[] | Paginated<CourseCategory>, void>({
      query: () => "public/categories/",
      providesTags: ["CourseCategories"],
    }),
    // Admin list returns ALL categories (incl. inactive) for the manage modal.
    getAdminCourseCategories: builder.query<
      CourseCategory[] | Paginated<CourseCategory>,
      void
    >({
      query: () => "admin/course-categories/",
      providesTags: ["CourseCategories"],
    }),
    createCourseCategory: builder.mutation<CourseCategory, CreateCourseCategoryInput>({
      query: (body) => ({ url: "admin/course-categories/", method: "POST", body }),
      invalidatesTags: ["CourseCategories"],
    }),
    updateCourseCategory: builder.mutation<
      CourseCategory,
      { id: number; data: Partial<CreateCourseCategoryInput> }
    >({
      query: ({ id, data }) => ({
        url: `admin/course-categories/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["CourseCategories"],
    }),
    deleteCourseCategory: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/course-categories/${id}/`, method: "DELETE" }),
      invalidatesTags: ["CourseCategories"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCoursesQuery,
  useGetCourseQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  usePublishCourseMutation,
  useGetCourseEnrollmentsQuery,
  useUpdateEnrollmentVerificationMutation,
  useGetBulkEnrollmentJobsQuery,
  useGetBulkEnrollmentJobQuery,
  useUploadBulkEnrollmentCsvMutation,
  useStartBulkEnrollmentMutation,
  useCancelBulkEnrollmentMutation,
  useRetryBulkEnrollmentMessagesMutation,
  useDownloadBulkEnrollmentReportMutation,
  useGetCourseCategoriesQuery,
  useGetAdminCourseCategoriesQuery,
  useCreateCourseCategoryMutation,
  useUpdateCourseCategoryMutation,
  useDeleteCourseCategoryMutation,
} = coursesApi;
