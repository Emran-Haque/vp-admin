import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

export type ModeratorPermissions = {
  user: number;
  granted: string[];
  can_view_dashboard: boolean;
  can_view_students: boolean;
  can_create_student: boolean;
  can_edit_student: boolean;
  can_delete_student: boolean;
  can_view_course_enrollments: boolean;
  can_view_courses: boolean;
  can_create_course: boolean;
  can_edit_course: boolean;
  can_delete_course: boolean;
  can_publish_course: boolean;
  can_view_live_classes: boolean;
  can_create_live_class: boolean;
  can_edit_live_class: boolean;
  can_delete_live_class: boolean;
  can_view_recorded_classes: boolean;
  can_manage_course_resources: boolean;
  can_view_exams: boolean;
  can_create_exam: boolean;
  can_edit_exam: boolean;
  can_delete_exam: boolean;
  can_add_exam_questions: boolean;
  can_publish_exam: boolean;
  can_publish_result: boolean;
  can_view_results: boolean;
  can_view_leaderboard: boolean;
  can_manage_assignments: boolean;
  can_evaluate_assignments: boolean;
  can_view_books: boolean;
  can_create_book: boolean;
  can_edit_book: boolean;
  can_delete_book: boolean;
  can_view_orders: boolean;
  can_update_order_status: boolean;
  can_manage_notices: boolean;
  can_manage_teachers: boolean;
  can_manage_reviews: boolean;
  can_manage_faq: boolean;
  can_manage_home_content: boolean;
  can_manage_static_pages: boolean;
};

export type Moderator = {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  permissions: ModeratorPermissions;
};

export type ModeratorListParams = { search?: string; ordering?: string; page?: number };

export type CreateModeratorInput = {
  email: string;
  full_name: string;
  phone: string;
  password: string;
};

export type UpdateModeratorInput = Partial<{
  full_name: string;
  phone: string;
  is_verified: boolean;
}>;

export type UpdatePermissionsInput = Partial<Omit<ModeratorPermissions, "user" | "granted">>;

export type PermissionCatalog = { permissions: string[] };

export type GroupedPermissionCatalog = {
  all_permissions: string[];
  groups: { group: string; permissions: string[] }[];
};

export type CreateAdminInput = {
  email: string;
  full_name: string;
  phone: string;
  role: "admin" | "super_admin";
  password: string;
  is_verified?: boolean;
};

export const moderatorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getModerators: builder.query<Paginated<Moderator>, ModeratorListParams | void>({
      query: (params) => ({ url: "admin/moderators/", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((m) => ({ type: "Moderators" as const, id: m.id })),
              { type: "Moderators" as const, id: "LIST" },
            ]
          : [{ type: "Moderators" as const, id: "LIST" }],
    }),
    getModerator: builder.query<Moderator, number>({
      query: (id) => `admin/moderators/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "Moderators", id }],
    }),
    createModerator: builder.mutation<Moderator, CreateModeratorInput>({
      query: (body) => ({ url: "admin/moderators/", method: "POST", body }),
      invalidatesTags: [{ type: "Moderators", id: "LIST" }],
    }),
    updateModerator: builder.mutation<Moderator, { id: number; data: UpdateModeratorInput }>({
      query: ({ id, data }) => ({ url: `admin/moderators/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Moderators", id },
        { type: "Moderators", id: "LIST" },
      ],
    }),
    deleteModerator: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/moderators/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "Moderators", id: "LIST" }],
    }),
    getModeratorPermissions: builder.query<ModeratorPermissions, number>({
      query: (id) => `admin/moderators/${id}/permissions/`,
      providesTags: (_result, _error, id) => [{ type: "Moderators", id: `perms-${id}` }],
    }),
    updateModeratorPermissions: builder.mutation<
      ModeratorPermissions,
      { id: number; data: UpdatePermissionsInput }
    >({
      query: ({ id, data }) => ({
        url: `admin/moderators/${id}/permissions/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Moderators", id },
        { type: "Moderators", id: `perms-${id}` },
      ],
    }),
    deactivateModerator: builder.mutation<{ detail: string }, number>({
      query: (id) => ({ url: `admin/moderators/${id}/deactivate/`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Moderators", id },
        { type: "Moderators", id: "LIST" },
      ],
    }),
    reactivateModerator: builder.mutation<{ detail: string }, number>({
      query: (id) => ({ url: `admin/moderators/${id}/reactivate/`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Moderators", id },
        { type: "Moderators", id: "LIST" },
      ],
    }),
    getPermissionCatalog: builder.query<PermissionCatalog, void>({
      query: () => "admin/moderators/permission_catalog/",
    }),
    getGroupedPermissionCatalog: builder.query<GroupedPermissionCatalog, void>({
      query: () => "admin/moderator-permission-catalog/",
    }),
    createAdmin: builder.mutation<Moderator, CreateAdminInput>({
      query: (body) => ({ url: "admin/users/create/", method: "POST", body }),
    }),
    promoteToModerator: builder.mutation<Moderator, number>({
      query: (studentId) => ({
        url: `admin/students/${studentId}/promote-to-moderator/`,
        method: "POST",
      }),
      invalidatesTags: [
        { type: "Moderators", id: "LIST" },
        { type: "Students", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetModeratorsQuery,
  useGetModeratorQuery,
  useCreateModeratorMutation,
  useUpdateModeratorMutation,
  useDeleteModeratorMutation,
  useGetModeratorPermissionsQuery,
  useUpdateModeratorPermissionsMutation,
  useDeactivateModeratorMutation,
  useReactivateModeratorMutation,
  useGetPermissionCatalogQuery,
  useGetGroupedPermissionCatalogQuery,
  useCreateAdminMutation,
  usePromoteToModeratorMutation,
} = moderatorsApi;
