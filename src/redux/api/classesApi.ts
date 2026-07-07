import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

export type ClassVideo = {
  id: number;
  title: string;
  video_url: string;
  duration: string;
  source_type: string;
  order: number;
};

export type ClassMaterial = {
  id: number;
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
};

export type ClassListParams = {
  course?: number;
  is_live?: boolean;
  status?: string;
  page?: number;
};

export type CreateClassInput = Partial<Omit<CourseClass, "id" | "videos" | "class_materials">> & {
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
  }),
  overrideExisting: false,
});

export const {
  useGetClassesQuery,
  useGetClassQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
} = classesApi;
