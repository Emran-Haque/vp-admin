import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

export type CourseResource = {
  id: number;
  course: number;
  title: string;
  subject: number | string | null;
  resource_type: "book" | "note" | "pdf" | "question_bank" | "magazine" | "short_note" | "link";
  file: string | null;
  external_link: string;
  file_size: string;
  download_count: number;
  is_active: boolean;
  created_at: string;
};

export type ResourceListParams = {
  course?: number;
  resource_type?: string;
  is_active?: boolean;
  page?: number;
};

export type CreateResourceInput = Partial<
  Omit<CourseResource, "id" | "download_count" | "created_at">
> & {
  course: number;
  title: string;
};

export type UpdateResourceInput = Partial<CreateResourceInput>;

export const resourcesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getResources: builder.query<Paginated<CourseResource>, ResourceListParams | void>({
      query: (params) => ({ url: "admin/resources/", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((r) => ({ type: "Resources" as const, id: r.id })),
              { type: "Resources" as const, id: "LIST" },
            ]
          : [{ type: "Resources" as const, id: "LIST" }],
    }),
    getResource: builder.query<CourseResource, number>({
      query: (id) => `admin/resources/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "Resources", id }],
    }),
    createResource: builder.mutation<CourseResource, CreateResourceInput>({
      query: (body) => ({ url: "admin/resources/", method: "POST", body }),
      invalidatesTags: [{ type: "Resources", id: "LIST" }],
    }),
    updateResource: builder.mutation<CourseResource, { id: number; data: UpdateResourceInput }>({
      query: ({ id, data }) => ({ url: `admin/resources/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Resources", id },
        { type: "Resources", id: "LIST" },
      ],
    }),
    deleteResource: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/resources/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "Resources", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetResourcesQuery,
  useGetResourceQuery,
  useCreateResourceMutation,
  useUpdateResourceMutation,
  useDeleteResourceMutation,
} = resourcesApi;
