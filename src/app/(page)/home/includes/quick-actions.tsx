import Link from "next/link";
import { ArrowRight, ClipboardPlus, BookPlus, PackagePlus, type LucideIcon } from "lucide-react";
import SectionHeader from "./section-header";

type Action = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  card: string;
  iconWrap: string;
  iconColor: string;
  title_className: string;
  description_className: string;
};

const actions: Action[] = [
  {
    title: "নতুন পরীক্ষা",
    description: "৩ ধাপে MCQ পরীক্ষা তৈরি",
    href: "/mcq",
    icon: ClipboardPlus,
    card: "bg-gradient-to-br from-blue-500 to-blue-600 outline outline-1 outline-offset-[-1px] outline-cyan-500/40 shadow-[0px_0px_40px_-10px_rgba(0,229,200,0.50)]",
    iconWrap: "bg-white",
    iconColor: "text-blue-500",
    title_className: "text-white",
    description_className: "text-white/90",
  },
  {
    title: "নতুন কোর্স",
    description: "ভিডিও, ফাইল, কুইজ সহ",
    href: "/courses",
    icon: BookPlus,
    card: "bg-emerald-500/20 outline outline-1 outline-offset-[-1px] outline-emerald-500/40",
    iconWrap: "bg-gray-900",
    iconColor: "text-emerald-500",
    title_className: "text-emerald-500",
    description_className: "text-emerald-500/90",
  },
  {
    title: "নতুন বই",
    description: "স্টক ও মূল্য সহ যোগ করুন",
    href: "/books",
    icon: PackagePlus,
    card: "bg-violet-500/20 outline outline-1 outline-offset-[-1px] outline-violet-500/40",
    iconWrap: "bg-gray-900/30",
    iconColor: "text-violet-500",
    title_className: "text-violet-500",
    description_className: "text-violet-500/90",
  },
];

export default function QuickActions() {
  return (
    <section>
      <SectionHeader title="দ্রুত কাজ" description="এক ক্লিকে নতুন কন্টেন্ট যোগ করুন" />

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
        {actions.map(
          ({ title, description, href, icon: Icon, card, iconWrap, iconColor, title_className, description_className }) => (
            <Link
              key={title}
              href={href}
              className={`flex items-center gap-4 rounded-3xl p-6 ${card}`}
            >
              <span className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${iconWrap}`}>
                <Icon size={28} className={iconColor} strokeWidth={2} />
              </span>
              <div className="flex-1">
                <p className={`text-lg font-bold leading-7 ${title_className}`}>{title}</p>
                <p className={`mt-0.5 text-sm ${description_className}`}>{description}</p>
              </div>
              <ArrowRight size={16} className={iconColor === "text-blue-500" ? "text-white" : iconColor} />
            </Link>
          )
        )}
      </div>
    </section>
  );
}
