import {
  BarChart3,
  BookOpen,
  FileText,
  GraduationCap,
  Home,
  Info,
  Layers,
  PanelBottom,
  ScrollText,
  Sparkles,
  Trophy,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { HeroPageKey } from "@/redux/api/contentApi";

/**
 * What a click on a card opens. Each variant carries just enough to identify
 * the row being edited, so the page can render one modal from one piece of
 * state instead of a boolean per section.
 */
export type ViewTarget =
  | { kind: "banner"; pageKey: HeroPageKey; pageLabel: string }
  | { kind: "whyPlatform" }
  | { kind: "about" }
  | { kind: "homeStats" }
  | { kind: "successStories" }
  | { kind: "footer" }
  | { kind: "landingHero"; pageKey: string }
  | { kind: "staticPage"; pageKey: string };

export type ViewItem = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  target: ViewTarget;
  /** Shown on the card so the admin knows which public page it affects. */
  path?: string;
};

export type ViewSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** One line under the section heading in the right pane. */
  blurb: string;
  items: ViewItem[];
};

/**
 * The whole of what an admin can change about the public site, grouped by the
 * page a student would be looking at.
 *
 * Grouping by destination rather than by data model is deliberate: an admin
 * thinks "I want to change the course page", not "I want to edit a
 * LandingHero row".
 */
export const VIEW_SECTIONS: ViewSection[] = [
  {
    id: "home",
    label: "হোমপেজ",
    icon: Home,
    blurb: "শিক্ষার্থী সাইটে ঢুকে প্রথমে যা দেখে",
    items: [
      {
        id: "banner",
        label: "হোম ব্যানার",
        description: "উপরের স্লাইড শো — ছবি, লেখা ও বাটন",
        icon: Layers,
        target: { kind: "banner", pageKey: "home", pageLabel: "হোমপেজ" },
        path: "/",
      },
      {
        id: "why",
        label: "কেন ভাইয়াদের পাঠশালা",
        description: "সুবিধার কার্ডগুলো",
        icon: Sparkles,
        target: { kind: "whyPlatform" },
        path: "/",
      },
      {
        id: "stats",
        label: "সাইট পরিসংখ্যান",
        description: "কোর্স, পরীক্ষা, শিক্ষার্থী ও শিক্ষকের সংখ্যা",
        icon: BarChart3,
        target: { kind: "homeStats" },
        path: "/",
      },
      {
        id: "about",
        label: "আমাদের সম্পর্কে",
        description: "প্রতিষ্ঠান পরিচিতির অংশ",
        icon: Info,
        target: { kind: "about" },
        path: "/",
      },
      {
        id: "success",
        label: "সাফল্যের গল্প",
        description: "শিক্ষার্থীদের সাফল্য — হোমপেজ ও সাফল্য পেজে",
        icon: Trophy,
        target: { kind: "successStories" },
        path: "/success",
      },
      {
        id: "footer",
        label: "ফুটার",
        description: "সোশ্যাল লিংক, গুরুত্বপূর্ণ লিংক ও যোগাযোগ",
        icon: PanelBottom,
        target: { kind: "footer" },
        path: "সব পেজ",
      },
    ],
  },
  {
    id: "course",
    label: "কোর্স পেজ",
    icon: BookOpen,
    blurb: "কোর্স তালিকার পেজ",
    items: [
      {
        id: "course-banner",
        label: "পেজ ব্যানার",
        description: "কোর্স পেজের ছবির স্লাইড শো",
        icon: Layers,
        target: { kind: "banner", pageKey: "course", pageLabel: "কোর্স পেজ" },
        path: "/course",
      },
      {
        id: "course-hero",
        label: "পেজ হেডিং",
        description: "উপরের শিরোনাম, বিবরণ ও বাটন",
        icon: FileText,
        target: { kind: "landingHero", pageKey: "course" },
        path: "/course",
      },
      {
        id: "free-class-banner",
        label: "ফ্রি ক্লাস ব্যানার",
        description: "ফ্রি ক্লাস পেজের ছবির স্লাইড শো",
        icon: Layers,
        target: { kind: "banner", pageKey: "free_class", pageLabel: "ফ্রি ক্লাস পেজ" },
        path: "/free-class",
      },
      {
        id: "free-class-hero",
        label: "ফ্রি ক্লাস পেজ হেডিং",
        description: "ফ্রি ক্লাস পেজের উপরের অংশ",
        icon: Video,
        target: { kind: "landingHero", pageKey: "free_class" },
        path: "/free-class",
      },
    ],
  },
  {
    id: "exam-batch",
    label: "পরীক্ষা ব্যাচ পেজ",
    icon: GraduationCap,
    blurb: "পরীক্ষা ব্যাচ তালিকার পেজ",
    items: [
      {
        id: "batch-banner",
        label: "পেজ ব্যানার",
        description: "পরীক্ষা ব্যাচ পেজের ছবির স্লাইড শো",
        icon: Layers,
        target: { kind: "banner", pageKey: "exam_batch", pageLabel: "পরীক্ষা ব্যাচ পেজ" },
        path: "/exam-batch",
      },
      {
        id: "batch-hero",
        label: "পেজ হেডিং",
        description: "উপরের শিরোনাম, বিবরণ ও বাটন",
        icon: FileText,
        target: { kind: "landingHero", pageKey: "exam_batch" },
        path: "/exam-batch",
      },
    ],
  },
  {
    id: "book",
    label: "বুক স্টোর পেজ",
    icon: BookOpen,
    blurb: "বই তালিকার পেজ",
    items: [
      {
        id: "book-banner",
        label: "পেজ ব্যানার",
        description: "বুক স্টোরের ছবির স্লাইড শো",
        icon: Layers,
        target: { kind: "banner", pageKey: "book_store", pageLabel: "বুক স্টোর পেজ" },
        path: "/book-store",
      },
      {
        id: "book-hero",
        label: "পেজ হেডিং",
        description: "উপরের শিরোনাম ও বিবরণ",
        icon: FileText,
        target: { kind: "landingHero", pageKey: "book_store" },
        path: "/book-store",
      },
    ],
  },
  {
    id: "team",
    label: "মেন্টর ও সাফল্য পেজ",
    icon: Users,
    blurb: "টিম ও সাফল্য পেজের হেডিং",
    items: [
      {
        id: "team-banner",
        label: "মেন্টর পেজ ব্যানার",
        description: "মেন্টর পেজের ছবির স্লাইড শো",
        icon: Layers,
        target: { kind: "banner", pageKey: "team", pageLabel: "মেন্টর পেজ" },
        path: "/team",
      },
      {
        id: "team-hero",
        label: "মেন্টর পেজ হেডিং",
        description: "টিম পেজের উপরের অংশ",
        icon: Users,
        target: { kind: "landingHero", pageKey: "team" },
        path: "/team",
      },
      {
        id: "success-banner",
        label: "সাফল্য পেজ ব্যানার",
        description: "সাফল্য পেজের ছবির স্লাইড শো",
        icon: Layers,
        target: { kind: "banner", pageKey: "success", pageLabel: "সাফল্য পেজ" },
        path: "/success",
      },
      {
        id: "success-hero",
        label: "সাফল্য পেজ হেডিং",
        description: "সাফল্য পেজের উপরের অংশ",
        icon: Trophy,
        target: { kind: "landingHero", pageKey: "success" },
        path: "/success",
      },
    ],
  },
  {
    id: "pages",
    label: "পেজ ও পলিসি",
    icon: ScrollText,
    blurb: "ফুটার থেকে যে পেজগুলোতে যাওয়া যায়",
    items: [
      {
        id: "privacy",
        label: "প্রাইভেসি পলিসি",
        description: "গোপনীয়তা নীতি",
        icon: ScrollText,
        target: { kind: "staticPage", pageKey: "privacy_policy" },
        path: "/privacy",
      },
      {
        id: "refund",
        label: "রিফান্ড পলিসি",
        description: "টাকা ফেরতের নিয়ম",
        icon: ScrollText,
        target: { kind: "staticPage", pageKey: "refund_policy" },
        path: "/refund",
      },
      {
        id: "terms",
        label: "টার্মস অব ইউজ",
        description: "ব্যবহারের শর্তাবলি",
        icon: ScrollText,
        target: { kind: "staticPage", pageKey: "terms_of_use" },
        path: "/terms",
      },
      {
        id: "about-page",
        label: "অ্যাবাউট পেজ",
        description: "আলাদা 'আমাদের সম্পর্কে' পেজ",
        icon: Info,
        target: { kind: "staticPage", pageKey: "about" },
        path: "/about",
      },
      {
        id: "contact",
        label: "কন্টাক্ট পেজ",
        description: "যোগাযোগের তথ্য",
        icon: FileText,
        target: { kind: "staticPage", pageKey: "contact" },
        path: "/contact",
      },
    ],
  },
];
