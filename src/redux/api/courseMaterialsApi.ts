import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

export type MaterialKind = "pdf" | "video" | "mcq";

export type CourseMaterial = {
  id: number;
  course: number;
  title: string;
  kind: MaterialKind;
  file: string | null;
  drive_link: string;
  video_url: string;
  quiz: number | null;
  ordering: number;
};

export type CourseMaterialListParams = {
  course?: number;
  kind?: MaterialKind;
  page?: number;
};

export type CreateCourseMaterialInput =
  | {
      course: number;
      title: string;
      kind: MaterialKind;
      drive_link?: string;
      video_url?: string;
      quiz?: number | null;
      ordering?: number;
    }
  | FormData;

export type UpdateCourseMaterialInput = Partial<CreateCourseMaterialInput> | FormData;

export const courseMaterialsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourseMaterials: builder.query<Paginated<CourseMaterial>, CourseMaterialListParams | void>({
      query: (params) => ({ url: "admin/course-materials/", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((m) => ({ type: "CourseMaterials" as const, id: m.id })),
              { type: "CourseMaterials" as const, id: "LIST" },
            ]
          : [{ type: "CourseMaterials" as const, id: "LIST" }],
    }),
    createCourseMaterial: builder.mutation<CourseMaterial, CreateCourseMaterialInput>({
      query: (body) => ({ url: "admin/course-materials/", method: "POST", body }),
      invalidatesTags: [{ type: "CourseMaterials", id: "LIST" }],
    }),
    updateCourseMaterial: builder.mutation<CourseMaterial, { id: number; data: UpdateCourseMaterialInput }>({
      query: ({ id, data }) => ({ url: `admin/course-materials/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "CourseMaterials", id },
        { type: "CourseMaterials", id: "LIST" },
      ],
    }),
    deleteCourseMaterial: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/course-materials/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "CourseMaterials", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCourseMaterialsQuery,
  useCreateCourseMaterialMutation,
  useUpdateCourseMaterialMutation,
  useDeleteCourseMaterialMutation,
} = courseMaterialsApi;
