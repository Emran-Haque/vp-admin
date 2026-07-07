import { baseApi } from "./baseApi";

export type AdminDashboard = {
  students: { total: number; active: number; new_last_30_days: number };
  courses: { total: number; published: number };
  exams: { total: number; total_attempts: number; pending_results: number };
  ecommerce: {
    total_books: number;
    total_orders: number;
    paid_orders: number;
    pending_orders: number;
    revenue: string;
  };
  content: { teachers: number; reviews: number; success_stories: number };
};

export type ModeratorDashboard = {
  welcome: { name: string; role: string };
  permissions: string[];
  modules: Record<string, unknown>;
};

export type MyPermissions = {
  role: string;
  all_access: boolean;
  permissions: string[];
};

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query<AdminDashboard, void>({
      query: () => "admin/dashboard/",
      providesTags: ["Dashboard"],
    }),
    getModeratorDashboard: builder.query<ModeratorDashboard, void>({
      query: () => "moderator/dashboard/",
      providesTags: ["Dashboard"],
    }),
    getMyPermissions: builder.query<MyPermissions, void>({
      query: () => "my-permissions/",
      providesTags: ["Permissions"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAdminDashboardQuery,
  useGetModeratorDashboardQuery,
  useGetMyPermissionsQuery,
} = dashboardApi;
