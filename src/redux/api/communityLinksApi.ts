import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

export type CommunityPlatform =
  | "facebook"
  | "youtube"
  | "telegram"
  | "whatsapp"
  | "instagram"
  | "discord"
  | "website"
  | "other";

export type CommunityLink = {
  id: number;
  kind: "facebook_group" | "telegram_routine" | "telegram_doubt" | "notice_channel" | "other";
  platform: CommunityPlatform;
  title: string;
  url: string;
  icon: string;
  banner: string | null;
  member_count: number;
  course: number | null;
  order: number;
  is_active: boolean;
};

export type CommunityLinkListParams = {
  platform?: string;
  is_active?: boolean;
  course?: number;
  page?: number;
};

export type CreateCommunityLinkInput = {
  platform: CommunityPlatform;
  title: string;
  url: string;
  member_count?: number;
  order?: number;
  is_active?: boolean;
};
export type UpdateCommunityLinkInput = Partial<CreateCommunityLinkInput>;

export const communityLinksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCommunityLinks: builder.query<Paginated<CommunityLink>, CommunityLinkListParams | void>({
      query: (params) => ({ url: "admin/community-links/", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((c) => ({ type: "CommunityLinks" as const, id: c.id })),
              { type: "CommunityLinks" as const, id: "LIST" },
            ]
          : [{ type: "CommunityLinks" as const, id: "LIST" }],
    }),
    createCommunityLink: builder.mutation<CommunityLink, CreateCommunityLinkInput | FormData>({
      query: (body) => ({ url: "admin/community-links/", method: "POST", body }),
      invalidatesTags: [{ type: "CommunityLinks", id: "LIST" }],
    }),
    updateCommunityLink: builder.mutation<
      CommunityLink,
      { id: number; data: UpdateCommunityLinkInput | FormData }
    >({
      query: ({ id, data }) => ({
        url: `admin/community-links/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "CommunityLinks", id },
        { type: "CommunityLinks", id: "LIST" },
      ],
    }),
    deleteCommunityLink: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/community-links/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "CommunityLinks", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCommunityLinksQuery,
  useCreateCommunityLinkMutation,
  useUpdateCommunityLinkMutation,
  useDeleteCommunityLinkMutation,
} = communityLinksApi;
