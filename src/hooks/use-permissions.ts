"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/redux/hooks";
import { useGetMyPermissionsQuery } from "@/redux/api/dashboardApi";
import type { PermissionKey } from "@/components/nav-items";

const ADMIN_ROLES = ["admin", "super_admin"];

export function usePermissions() {
  const role = useAppSelector((state) => state.auth.user?.role);
  const isAdmin = Boolean(role && ADMIN_ROLES.includes(role));

  const { data, isLoading } = useGetMyPermissionsQuery(undefined, {
    skip: !role || isAdmin,
  });

  const granted = useMemo(() => new Set(data?.permissions ?? []), [data]);
  const hasAllAccess = isAdmin || Boolean(data?.all_access);
  const loading = Boolean(role) && !isAdmin && isLoading;

  const hasPermission = (...permissions: (PermissionKey | undefined)[]) => {
    if (hasAllAccess) return true;
    return permissions.every((permission) => !permission || granted.has(permission));
  };

  return { isAdmin, hasAllAccess, loading, hasPermission };
}
