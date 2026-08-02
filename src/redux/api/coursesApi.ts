import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

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
  syllabus_pdf: string | null;
  syllabus_drive_link: string;
  price: string;
  old_price: string;
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
};

export type CourseListParams = {
  category?: number;
  is_published?: boolean;
  is_free?: boolean;
  search?: string;
  page?: number;
};

export type CreateCourseInput = Partial<Omit<Course, "id" | "slug" | "enrollment_count">> & {
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
    getCourseCategories: builder.query<CourseCategory[] | Paginated<CourseCategory>, void>({
      query: () => "public/categories/",
      providesTags: ["CourseCategories"],
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
  useGetCourseCategoriesQuery,
} = coursesApi;
