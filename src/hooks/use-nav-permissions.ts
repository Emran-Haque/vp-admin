"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/redux/hooks";
import { useGetMyPermissionsQuery } from "@/redux/api/dashboardApi";
import { navItems, type NavItem } from "@/components/nav-items";

const ADMIN_ROLES = ["admin", "super_admin"];

export function useNavPermissions() {
  const role = useAppSelector((state) => state.auth.user?.role);
  const isAdmin = Boolean(role && ADMIN_ROLES.includes(role));

  const { data, isLoading } = useGetMyPermissionsQuery(undefined, {
    skip: !role || isAdmin,
  });

  const granted = useMemo(() => new Set(data?.permissions ?? []), [data]);
  const hasAllAccess = isAdmin || Boolean(data?.all_access);
  const loading = Boolean(role) && !isAdmin && isLoading;

  const isItemVisible = (item: NavItem) => {
    if (item.adminOnly) return isAdmin;
    if (hasAllAccess) return true;
    if (!item.permission) return true;
    return granted.has(item.permission);
  };

  const visibleNavItems = navItems.filter(isItemVisible);

  return { visibleNavItems, isItemVisible, loading };
}
