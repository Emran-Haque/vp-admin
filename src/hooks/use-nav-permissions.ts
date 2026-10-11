"use client";

import { usePermissions } from "./use-permissions";
import { navItems, type RouteGuard } from "@/components/nav-items";

export function useNavPermissions() {
  const { isAdmin, hasPermission, hasAnyPermission, loading } = usePermissions();

  const isItemVisible = (item: RouteGuard) => {
    if (item.adminOnly) return isAdmin;
    if (Array.isArray(item.permission)) return hasAnyPermission(...item.permission);
    return hasPermission(item.permission);
  };

  const visibleNavItems = navItems.filter(isItemVisible);

  return { visibleNavItems, isItemVisible, loading };
}
