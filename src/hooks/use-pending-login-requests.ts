"use client";

import { useGetDeviceRequestSummaryQuery } from "@/redux/api/deviceLockApi";
import { usePermissions } from "./use-permissions";

/**
 * Pending login requests, for the badges on the "শিক্ষার্থী" menu item and the
 * "লগইন রিকোয়েস্ট" tab. Zero, and no request at all, for staff who may not see
 * them. Re-checked every minute so a new request shows up without a reload.
 */
export function usePendingLoginRequests(): number {
  const { hasPermission, loading } = usePermissions();
  const canView = !loading && hasPermission("can_view_login_requests");
  const { data } = useGetDeviceRequestSummaryQuery(undefined, {
    skip: !canView,
    pollingInterval: 60_000,
  });
  return canView ? (data?.pending ?? 0) : 0;
}
