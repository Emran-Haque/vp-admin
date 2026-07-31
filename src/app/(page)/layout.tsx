"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { useAppSelector } from "@/redux/hooks";
import { useNavPermissions } from "@/hooks/use-nav-permissions";
import { navItems, type RouteGuard } from "@/components/nav-items";
import { actionRoutes } from "@/components/action-routes";

const guardedRoutes: RouteGuard[] = [...actionRoutes, ...navItems];

const ALLOWED_ROLES = ["admin", "super_admin", "moderator"];

export default function PageLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAppSelector((state) => state.auth.token);
  const role = useAppSelector((state) => state.auth.user?.role);
  const isAuthorized = Boolean(token) && Boolean(role) && ALLOWED_ROLES.includes(role as string);

  const { visibleNavItems, isItemVisible, loading: permissionsLoading } = useNavPermissions();
  const matchedRoute = guardedRoutes
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const isPagePermitted = !matchedRoute || isItemVisible(matchedRoute);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isAuthorized || permissionsLoading) return;
    if (!isPagePermitted) {
      router.replace(visibleNavItems[0]?.href ?? "/login");
    }
  }, [mounted, isAuthorized, permissionsLoading, isPagePermitted, visibleNavItems, router]);

  useEffect(() => {
    if (mounted && !isAuthorized) router.replace("/login");
  }, [mounted, isAuthorized, router]);

  if (!mounted || !isAuthorized || permissionsLoading || !isPagePermitted) return null;

  return (
    <div className="min-h-screen bg-zinc-900">
      <Sidebar />
      <div className="flex flex-col md:pl-64">
        <Header />
        <main className="flex-1 p-7">{children}</main>
      </div>
    </div>
  );
}
