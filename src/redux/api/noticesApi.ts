import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

export type Notice = {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: "normal" | "important" | "urgent";
  target_type: "all" | "students" | "course_specific";
  course: number | null;
  course_title?: string;
  is_visible: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
};

export type NoticeListParams = {
  priority?: string;
  target_type?: string;
  course?: number;
  search?: string;
  page?: number;
};

export type CreateNoticeInput = {
  title: string;
  description: string;
  category: string;
  priority: string;
  target_type: string;
  course?: number | null;
  is_visible: boolean;
};

export type UpdateNoticeInput = Partial<CreateNoticeInput>;

export const noticesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotices: builder.query<Paginated<Notice>, NoticeListParams | void>({
      query: (params) => ({ url: "admin/notices/", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((n) => ({ type: "Notices" as const, id: n.id })),
              { type: "Notices" as const, id: "LIST" },
            ]
          : [{ type: "Notices" as const, id: "LIST" }],
    }),
    getNotice: builder.query<Notice, number>({
      query: (id) => `admin/notices/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "Notices", id }],
    }),
    createNotice: builder.mutation<Notice, CreateNoticeInput>({
      query: (body) => ({ url: "admin/notices/", method: "POST", body }),
      invalidatesTags: [{ type: "Notices", id: "LIST" }],
    }),
    updateNotice: builder.mutation<Notice, { id: number; data: UpdateNoticeInput }>({
      query: ({ id, data }) => ({ url: `admin/notices/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Notices", id },
        { type: "Notices", id: "LIST" },
      ],
    }),
    deleteNotice: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/notices/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "Notices", id: "LIST" }],
    }),
    toggleNoticeVisibility: builder.mutation<Notice, number>({
      query: (id) => ({ url: `admin/notices/${id}/toggle-visibility/`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Notices", id },
        { type: "Notices", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNoticesQuery,
  useGetNoticeQuery,
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useDeleteNoticeMutation,
  useToggleNoticeVisibilityMutation,
} = noticesApi;
