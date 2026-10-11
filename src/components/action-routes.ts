import type { RouteGuard } from "./nav-items";

/**
 * Sub-routes that aren't in the sidebar but are reachable by direct URL
 * (e.g. a link from an overview banner) and need their own permission guard.
 */
export const actionRoutes: RouteGuard[] = [
  {
    href: "/courses/create",
    permission: ["can_create_course", "can_manage_offline_batches"],
  },
  {
    href: "/courses/edit",
    matches: (pathname) => /^\/courses\/\d+\/edit$/.test(pathname),
    permission: ["can_edit_course", "can_manage_offline_batches"],
  },
  { href: "/mcq/create", permission: "can_create_exam" },
  {
    href: "/mcq/edit",
    matches: (pathname) => /^\/mcq\/\d+\/edit$/.test(pathname),
    permission: "can_edit_exam",
  },
  { href: "/students/login-requests", permission: "can_view_login_requests" },
  { href: "/ledger", permission: "can_view_orders" },
];
