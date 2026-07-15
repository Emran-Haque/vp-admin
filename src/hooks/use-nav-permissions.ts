"use client";

import { usePermissions } from "./use-permissions";
import { navItems, type RouteGuard } from "@/components/nav-items";

export function useNavPermissions() {
  const { isAdmin, hasPermission, loading } = usePermissions();

  const isItemVisible = (item: RouteGuard) => {
    if (item.adminOnly) return isAdmin;
    return hasPermission(item.permission);
  };

  const visibleNavItems = navItems.filter(isItemVisible);

  return { visibleNavItems, isItemVisible, loading };
}
