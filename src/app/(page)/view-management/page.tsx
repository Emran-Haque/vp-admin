import { ExternalLink, PanelsTopLeft } from "lucide-react";
import BannerManager from "./includes/banner-manager";

const studentSiteUrl =
  process.env.NEXT_PUBLIC_STUDENT_SITE_URL ?? "https://vaiyaderpathshala.com";

export default function ViewManagementPage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-sky-400/20 bg-sky-400/10 text-sky-300">
            <PanelsTopLeft size={19} />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-50 sm:text-2xl">
              ভিউ ম্যানেজমেন্ট
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              শিক্ষার্থীরা ওয়েবসাইটে যা দেখবে, এখান থেকে সেটি নিয়ন্ত্রণ করুন।
            </p>
          </div>
        </div>

        <a
          href={studentSiteUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 text-sm font-bold text-slate-200 hover:border-sky-400/40 hover:text-white"
        >
          ওয়েবসাইট দেখুন
          <ExternalLink size={15} />
        </a>
      </header>

      <BannerManager />
    </div>
  );
}
