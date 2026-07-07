import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import SectionHeader from "./section-header";

export default function StudentExperience() {
  return (
    <section>
      <SectionHeader title="শিক্ষার্থী অভিজ্ঞতা" description="শিক্ষার্থীরা যা দেখে তা প্রিভিউ করুন" />

      <div className="mt-4 flex flex-col items-start gap-6 rounded-3xl bg-gradient-to-r from-violet-500/20 to-emerald-500/20 p-8 sm:flex-row sm:items-center">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <GraduationCap size={32} className="text-white" strokeWidth={2} />
        </span>

        <div className="flex-1">
          <p className="text-lg font-bold leading-7 text-white">শিক্ষার্থী পোর্টাল ভিউ</p>
          <p className="mt-1 text-sm text-white/80">
            শিক্ষার্থীরা যেভাবে বই দেখবে, কার্টে যোগ করবে ও অর্ডার ট্র্যাক করবে — সম্পূর্ণ ফ্লো দেখুন
          </p>
        </div>

        <Link
          href="/students"
          className="flex shrink-0 items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          ভিউ করুন
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
