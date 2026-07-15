import {
  LayoutGrid,
  Users,
  BookOpen,
  ClipboardList,
  Bell,
  BarChart2,
  Package,
  ReceiptText,
  GraduationCap,
  ShieldCheck,
  Star,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { ModeratorPermissions } from "@/redux/api/moderatorsApi";

export type PermissionKey = keyof Omit<ModeratorPermissions, "user" | "granted">;

export type RouteGuard = {
  href: string;
  /** Moderators need this permission granted to see/access this route. Admins always have access. */
  permission?: PermissionKey;
  /** Only admins/super admins can see/access this route, regardless of moderator permissions. */
  adminOnly?: boolean;
};

export type NavItem = RouteGuard & {
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { label: "ড্যাশবোর্ড", href: "/home", icon: LayoutGrid, permission: "can_view_dashboard" },
  { label: "শিক্ষার্থী", href: "/students", icon: Users, permission: "can_view_students" },
  { label: "কোর্স", href: "/courses", icon: BookOpen, permission: "can_view_courses" },
  { label: "MCQ পরীক্ষা", href: "/mcq", icon: ClipboardList, permission: "can_view_exams" },
  { label: "নোটিশ", href: "/notice", icon: Bell, permission: "can_manage_notices" },
  { label: "ফলাফল", href: "/results", icon: BarChart2, permission: "can_view_results" },
  { label: "বই", href: "/books", icon: Package, permission: "can_view_books" },
  { label: "অর্ডার", href: "/orders", icon: ReceiptText, permission: "can_view_orders" },
  { label: "শিক্ষক", href: "/teachers", icon: GraduationCap, permission: "can_manage_teachers" },
  { label: "মডারেটর", href: "/moderators", icon: ShieldCheck, adminOnly: true },
  { label: "রিভিউ", href: "/reviews", icon: Star, permission: "can_manage_reviews" },
  { label: "FAQ", href: "/faq", icon: HelpCircle, permission: "can_manage_faq" },
];
