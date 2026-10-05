import { baseApi } from "./baseApi";
import type { Paginated } from "./types";
import type { ClassQuiz } from "./examsApi";

export type ClassVideo = {
  id: number;
  course_class: number;
  title: string;
  video_url: string;
  duration: string;
  /** Poster frame URL, or null when the admin has not uploaded one. */
  thumbnail: string | null;
  source_type: string;
  order: number;
};

export type ClassMaterial = {
  id: number;
  course_class: number;
  title: string;
  file: string | null;
  file_url: string;
  drive_link: string;
  kind: string;
  downloadable: boolean;
};

export type CourseClass = {
  id: number;
  course: number;
  subject: string;
  title: string;
  description: string;
  teacher: number;
  class_date: string;
  start_time: string;
  end_time: string;
  status: string;
  is_live: boolean;
  live_url: string;
  thumbnail: string | null;
  videos: ClassVideo[];
  class_materials: ClassMaterial[];
  quizzes: ClassQuiz[];
};

export type AttendanceStatus = "" | "present" | "absent" | "late" | "excused";

export type AttendanceRow = {
  student: number;
  student_name: string;
  student_code: string;
  /** Profile photo URL (absolute, or a /media path); null when none. */
  student_image?: string | null;
  student_phone: string;
  status: AttendanceStatus;
  note: string;
};

export type AttendanceSheet = {
  class_id: number;
  class_title: string;
  class_date: string | null;
  rows: AttendanceRow[];
};

export type CreateClassVideoInput = {
  course_class: number;
  title: string;
  video_url: string;
  duration?: string;
  source_type?: string;
  order?: number;
};

/**
 * Fields a video edit may change. `FormData` is used whenever a thumbnail file
 * is attached — the same JSON/multipart split the class endpoints already use.
 */
export type UpdateClassVideoInput = {
  title?: string;
  video_url?: string;
  duration?: string;
  order?: number;
};

export type CreateClassMaterialInput =
  | {
      course_class: number;
      title: string;
      drive_link?: string;
      kind?: string;
      downloadable?: boolean;
    }
  | FormData;

export type UpdateClassMaterialInput = {
  title?: string;
  drive_link?: string;
  kind?: string;
  downloadable?: boolean;
} | FormData;

export type ClassListParams = {
  course?: number;
  is_live?: boolean;
  status?: string;
  page?: number;
  page_size?: number;
};

export type CreateClassInput =
  | (Partial<Omit<CourseClass, "id" | "videos" | "class_materials" | "quizzes">> & {
      course: number;
      title: string;
    })
  | FormData;

export type UpdateClassInput = Partial<CreateClassInput>;

export const classesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClasses: builder.query<Paginated<CourseClass>, ClassListParams | void>({
      query: (params) => ({ url: "admin/classes/", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((c) => ({ type: "Classes" as const, id: c.id })),
              { type: "Classes" as const, id: "LIST" },
            ]
          : [{ type: "Classes" as const, id: "LIST" }],
    }),
    /** Scroll-to-load classes of one course (newest class date first). */
    getClassList: builder.infiniteQuery<
      Paginated<CourseClass>,
      { course: number },
      number
    >({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, _all, lastPageParam) =>
          lastPage.next ? lastPageParam + 1 : undefined,
      },
      query: ({ queryArg, pageParam }) => ({
        url: "admin/classes/",
        params: { ...queryArg, page: pageParam },
      }),
      // Exams hang off classes, so a new/edited exam must refresh these too.
      providesTags: [{ type: "Classes", id: "LIST" }, { type: "Exams", id: "LIST" }],
    }),
    getClass: builder.query<CourseClass, number>({
      query: (id) => `admin/classes/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "Classes", id }],
    }),
    createClass: builder.mutation<CourseClass, CreateClassInput>({
      query: (body) => ({ url: "admin/classes/", method: "POST", body }),
      invalidatesTags: [{ type: "Classes", id: "LIST" }],
    }),
    updateClass: builder.mutation<CourseClass, { id: number; data: UpdateClassInput }>({
      query: ({ id, data }) => ({ url: `admin/classes/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Classes", id },
        { type: "Classes", id: "LIST" },
      ],
    }),
    deleteClass: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/classes/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "Classes", id: "LIST" }],
    }),
    getClassAttendance: builder.query<AttendanceSheet, number>({
      query: (classId) => `admin/classes/${classId}/attendance/`,
      providesTags: (_result, _error, classId) => [{ type: "Classes", id: `attendance-${classId}` }],
    }),
    saveClassAttendance: builder.mutation<
      AttendanceSheet,
      { classId: number; rows: Pick<AttendanceRow, "student" | "status" | "note">[] }
    >({
      query: ({ classId, rows }) => ({
        url: `admin/classes/${classId}/attendance/`,
        method: "POST",
        body: { rows },
      }),
      invalidatesTags: (_result, _error, { classId }) => [
        { type: "Classes", id: `attendance-${classId}` },
      ],
    }),
    createClassVideo: builder.mutation<ClassVideo, CreateClassVideoInput | FormData>({
      query: (body) => ({ url: "admin/class-videos/", method: "POST", body }),
      // FormData carries course_class as a string field rather than a property,
      // so the whole list is invalidated when we cannot read the id directly.
      invalidatesTags: (_result, _error, arg) =>
        arg instanceof FormData
          ? [{ type: "Classes" as const, id: "LIST" }]
          : [
              { type: "Classes" as const, id: arg.course_class },
              { type: "Classes" as const, id: "LIST" },
            ],
    }),
    updateClassVideo: builder.mutation<
      ClassVideo,
      { id: number; courseClassId: number; data: UpdateClassVideoInput | FormData }
    >({
      query: ({ id, data }) => ({
        url: `admin/class-videos/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { courseClassId }) => [
        { type: "Classes", id: courseClassId },
        { type: "Classes", id: "LIST" },
      ],
    }),
    deleteClassVideo: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/class-videos/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "Classes", id: "LIST" }],
    }),
    createClassMaterial: builder.mutation<ClassMaterial, CreateClassMaterialInput>({
      query: (body) => ({ url: "admin/class-materials/", method: "POST", body }),
      invalidatesTags: [{ type: "Classes", id: "LIST" }],
    }),
    updateClassMaterial: builder.mutation<
      ClassMaterial,
      { id: number; data: UpdateClassMaterialInput }
    >({
      query: ({ id, data }) => ({
        url: `admin/class-materials/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [{ type: "Classes", id: "LIST" }],
    }),
    deleteClassMaterial: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/class-materials/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "Classes", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetClassesQuery,
  useGetClassListInfiniteQuery,
  useGetClassQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useGetClassAttendanceQuery,
  useSaveClassAttendanceMutation,
  useCreateClassVideoMutation,
  useUpdateClassVideoMutation,
  useDeleteClassVideoMutation,
  useCreateClassMaterialMutation,
  useUpdateClassMaterialMutation,
  useDeleteClassMaterialMutation,
} = classesApi;
