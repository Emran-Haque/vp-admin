import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

export type AdminNotification = {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  related_object_type: string;
  related_object_id: number | null;
  created_at: string;
};

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // The endpoint is role-agnostic (filters by the logged-in user), so it
    // returns the admin/moderator's own notifications.
    getNotifications: builder.query<
      Paginated<AdminNotification> | AdminNotification[],
      void
    >({
      query: () => "student/notifications/",
      providesTags: ["Notifications"],
    }),
    markAllNotificationsRead: builder.mutation<{ marked_read: number }, void>({
      query: () => ({ url: "student/notifications/mark-all-read/", method: "POST" }),
      // Refresh both the drawer list and the header badge (from the dashboard).
      invalidatesTags: ["Notifications", "Dashboard"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
