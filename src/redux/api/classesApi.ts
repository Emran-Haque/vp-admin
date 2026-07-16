import { baseApi } from "./baseApi";
import type { Paginated } from "./types";
import type { ClassQuiz } from "./examsApi";

export type ClassVideo = {
  id: number;
  course_class: number;
  title: string;
  video_url: string;
  duration: string;
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

export type CreateClassVideoInput = {
  course_class: number;
  title: string;
  video_url: string;
  duration?: string;
  source_type?: string;
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

export type ClassListParams = {
  course?: number;
  is_live?: boolean;
  status?: string;
  page?: number;
};

export type CreateClassInput = Partial<
  Omit<CourseClass, "id" | "videos" | "class_materials" | "quizzes">
> & {
  course: number;
  title: string;
};

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
    createClassVideo: builder.mutation<ClassVideo, CreateClassVideoInput>({
      query: (body) => ({ url: "admin/class-videos/", method: "POST", body }),
      invalidatesTags: (_result, _error, { course_class }) => [{ type: "Classes", id: course_class }],
    }),
    deleteClassVideo: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/class-videos/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "Classes", id: "LIST" }],
    }),
    createClassMaterial: builder.mutation<ClassMaterial, CreateClassMaterialInput>({
      query: (body) => ({ url: "admin/class-materials/", method: "POST", body }),
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
  useGetClassQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useCreateClassVideoMutation,
  useDeleteClassVideoMutation,
  useCreateClassMaterialMutation,
  useDeleteClassMaterialMutation,
} = classesApi;
