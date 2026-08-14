import Link from "next/link";
import { ArrowRight, ClipboardList, BookOpen, Book, Package, type LucideIcon } from "lucide-react";
import SectionHeader from "./section-header";

type Module = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
};

const modules: Module[] = [
  {
    title: "MCQ পরীক্ষা",
    description: "পরীক্ষার তালিকা ও পরিচালনা",
    href: "/mcq",
    icon: ClipboardList,
    iconWrap: "bg-cyan-500/10",
    iconColor: "text-cyan-500",
  },
  {
    title: "কোর্স",
    description: "ভিডিও, ফাইল, কুইজসহ",
    href: "/courses",
    icon: BookOpen,
    iconWrap: "bg-violet-500/10",
    iconColor: "text-violet-500",
  },
  {
    title: "বই",
    description: "স্টক পরিচালনা",
    href: "/books",
    icon: Book,
    iconWrap: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  {
    title: "অর্ডার",
    description: "স্ট্যাটাস আপডেট",
    href: "/books",
    icon: Package,
    iconWrap: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
];

export default function ManagementModules() {
  return (
    <section>
      <SectionHeader title="ম্যানেজমেন্ট মডিউল" description="বিদ্যমান কন্টেন্ট দেখুন ও সম্পাদনা করুন" />

      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map(({ title, description, href, icon: Icon, iconWrap, iconColor }) => (
          <div
            key={title}
            className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]"
          >
            <span className={`flex size-12 items-center justify-center rounded-2xl ${iconWrap}`}>
              <Icon size={28} className={iconColor} strokeWidth={2} />
            </span>
            <p className="mt-4 text-lg font-bold leading-7 text-blue-50">{title}</p>
            <p className="mt-1 text-sm text-slate-400">{description}</p>
            <Link
              href={href}
              className={`mt-4 flex items-center gap-1.5 text-sm font-medium ${iconColor}`}
            >
              খুলুন
              <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
