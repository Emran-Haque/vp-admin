import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

/**
 * One-device lock: login requests, a student's device and login history, and
 * the on/off switch. Backend: apps/devices.
 */

export type DeviceRequestStatus = "pending" | "approved" | "rejected" | "closed";

export type DeviceRequestReason = "new_device" | "lost_device" | "browser_reset" | "other";

export type PersonRef = { id: number; full_name: string; role: string };

export type StudentBrief = {
  id: number;
  full_name: string;
  phone: string | null;
  student_id: string | null;
  email: string | null;
  is_active: boolean;
};

export type LockedDevice = {
  label: string;
  bound_at: string;
  last_seen_at: string | null;
};

export type DeviceRequest = {
  id: number;
  status: DeviceRequestStatus;
  status_label: string;
  reason: DeviceRequestReason;
  reason_label: string;
  note: string;
  /** The device asking for access, e.g. "Chrome · Windows". */
  label: string;
  ip_address: string | null;
  user_agent: string;
  /** What held the account when the request was sent. */
  locked_device_label: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: PersonRef | null;
  admin_note: string;
  student: StudentBrief;
  request_count: number;
  recent_request_count: number;
  /** Three or more requests in 30 days: the clearest sign of a shared account. */
  is_frequent: boolean;
};

export type DeviceRequestDetail = DeviceRequest & {
  locked_device: LockedDevice | null;
  previous_requests: DeviceRequest[];
};

export type DeviceRequestListParams = {
  status?: DeviceRequestStatus;
  search?: string;
  page?: number;
  user?: number;
};

export type DeviceRequestSummary = { pending: number; lock_enabled: boolean };

export type StudentDeviceSummary = {
  student: StudentBrief;
  lock_enabled: boolean;
  locked_device: LockedDevice | null;
  live_sessions: number;
  pending_request: { id: number; label: string; created_at: string } | null;
  request_count: number;
  recent_request_count: number;
  is_frequent: boolean;
};

export type DeviceEventKind =
  | "device_bound"
  | "login_blocked"
  | "request_sent"
  | "request_approved"
  | "request_rejected"
  | "logout_all";

export type DeviceEvent = {
  id: number;
  kind: DeviceEventKind;
  kind_label: string;
  device_label: string;
  previous_device_label: string;
  ip_address: string | null;
  actor: PersonRef | null;
  note: string;
  request_status: DeviceRequestStatus | null;
  created_at: string;
};

export type LockSettings = {
  is_enabled: boolean;
  updated_at: string;
  updated_by: PersonRef | null;
};

export const deviceLockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDeviceRequests: builder.query<Paginated<DeviceRequest>, DeviceRequestListParams | void>({
      query: (params) => ({ url: "admin/device-requests/", params: params ?? undefined }),
      providesTags: [{ type: "DeviceRequests", id: "LIST" }],
    }),
    getDeviceRequest: builder.query<DeviceRequestDetail, number>({
      query: (id) => `admin/device-requests/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "DeviceRequests", id }],
    }),
    getDeviceRequestSummary: builder.query<DeviceRequestSummary, void>({
      query: () => "admin/device-requests/summary/",
      providesTags: [{ type: "DeviceRequests", id: "SUMMARY" }],
    }),
    approveDeviceRequest: builder.mutation<DeviceRequestDetail, { id: number; admin_note?: string }>({
      query: ({ id, admin_note }) => ({
        url: `admin/device-requests/${id}/approve/`,
        method: "POST",
        body: { admin_note: admin_note ?? "" },
      }),
      invalidatesTags: ["DeviceRequests", "StudentDevices"],
    }),
    rejectDeviceRequest: builder.mutation<DeviceRequestDetail, { id: number; admin_note?: string }>({
      query: ({ id, admin_note }) => ({
        url: `admin/device-requests/${id}/reject/`,
        method: "POST",
        body: { admin_note: admin_note ?? "" },
      }),
      invalidatesTags: ["DeviceRequests", "StudentDevices"],
    }),
    getStudentDevice: builder.query<StudentDeviceSummary, number>({
      query: (studentId) => `admin/student-devices/${studentId}/`,
      providesTags: (_result, _error, studentId) => [{ type: "StudentDevices", id: studentId }],
    }),
    getStudentDeviceHistory: builder.query<Paginated<DeviceEvent>, { studentId: number; page?: number }>({
      query: ({ studentId, page }) => ({
        url: `admin/student-devices/${studentId}/history/`,
        params: page ? { page } : undefined,
      }),
      providesTags: (_result, _error, { studentId }) => [
        { type: "StudentDevices", id: `HISTORY-${studentId}` },
      ],
    }),
    logoutAllStudentDevices: builder.mutation<StudentDeviceSummary, { studentId: number; note?: string }>({
      query: ({ studentId, note }) => ({
        url: `admin/student-devices/${studentId}/logout-all/`,
        method: "POST",
        body: { note: note ?? "" },
      }),
      invalidatesTags: ["StudentDevices", "DeviceRequests"],
    }),
    getDeviceLockSettings: builder.query<LockSettings, void>({
      query: () => "admin/device-lock/settings/",
      providesTags: ["DeviceLock"],
    }),
    updateDeviceLockSettings: builder.mutation<LockSettings, { is_enabled: boolean }>({
      query: (body) => ({ url: "admin/device-lock/settings/", method: "PATCH", body }),
      invalidatesTags: ["DeviceLock", "DeviceRequests", "StudentDevices"],
    }),
  }),
});

export const {
  useGetDeviceRequestsQuery,
  useGetDeviceRequestQuery,
  useGetDeviceRequestSummaryQuery,
  useApproveDeviceRequestMutation,
  useRejectDeviceRequestMutation,
  useGetStudentDeviceQuery,
  useGetStudentDeviceHistoryQuery,
  useLogoutAllStudentDevicesMutation,
  useGetDeviceLockSettingsQuery,
  useUpdateDeviceLockSettingsMutation,
} = deviceLockApi;
