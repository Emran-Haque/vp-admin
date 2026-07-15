import type { RouteGuard } from "./nav-items";

/**
 * Sub-routes that aren't in the sidebar but are reachable by direct URL
 * (e.g. a link from an overview banner) and need their own permission guard.
 */
export const actionRoutes: RouteGuard[] = [
  { href: "/courses/create", permission: "can_create_course" },
  { href: "/mcq/create", permission: "can_create_exam" },
];
