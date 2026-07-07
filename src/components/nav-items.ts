import {
  LayoutGrid,
  Users,
  BookOpen,
  ClipboardList,
  Bell,
  BarChart2,
  Package,
  GraduationCap,
  Star,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { label: "ড্যাশবোর্ড", href: "/home", icon: LayoutGrid },
  { label: "শিক্ষার্থী", href: "/students", icon: Users },
  { label: "কোর্স", href: "/courses", icon: BookOpen },
  { label: "MCQ পরীক্ষা", href: "/mcq", icon: ClipboardList },
  { label: "নোটিশ", href: "/notice", icon: Bell },
  { label: "ফলাফল", href: "/results", icon: BarChart2 },
  { label: "বই ও অর্ডার", href: "/books", icon: Package },
  { label: "শিক্ষক", href: "/teachers", icon: GraduationCap },
  { label: "রিভিউ", href: "/reviews", icon: Star },
  { label: "FAQ", href: "/faq", icon: HelpCircle },
];
