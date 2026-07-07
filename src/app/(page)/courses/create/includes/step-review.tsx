import Link from "next/link";
import { Video, FileText, HelpCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import type { BasicInfo, CourseModule } from "./types";

type Props = {
  basicInfo: BasicInfo;
  modules: CourseModule[];
  published: boolean;
  isPublishing?: boolean;
  error?: unknown;
};

function describeError(error: unknown): string {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: unknown }).status;
    const data = (error as { data?: unknown }).data;
    const detail =
      data && typeof data === "object"
        ? ((data as Record<string, unknown>).detail ?? JSON.stringify(data))
        : data;
    if (status === "FETCH_ERROR") return "সার্ভারে সংযোগ করা যায়নি (নেটওয়ার্ক বা CORS সমস্যা)।";
    if (status === 401) return "সেশন মেয়াদোত্তীর্ণ — আবার লগইন করুন। (401 Unauthorized)";
    return `সার্ভার ত্রুটি (${String(status)}): ${detail ? String(detail) : "বিস্তারিত পাওয়া যায়নি"}`;
  }
  return "অজানা ত্রুটি।";
}

export default function StepReview({ basicInfo, modules, published, isPublishing, error }: Props) {
  const totals = modules.reduce(
    (acc, m) => {
      for (const item of m.items) acc[item.type] += 1;
      return acc;
    },
    { video: 0, file: 0, quiz: 0 }
  );

  const fields: { label: string; value: string }[] = [
    { label: "কোর্সের নাম", value: basicInfo.name || "—" },
    { label: "ক্যাটাগরি", value: basicInfo.category || "—" },
    { label: "স্তর", value: basicInfo.level || "—" },
    { label: "মূল্য", value: basicInfo.price ? `৳${basicInfo.price}` : "—" },
    { label: "মোট সময়কাল", value: basicInfo.duration || "—" },
  ];

  if (published) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-10 text-center shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <CheckCircle2 size={48} className="text-emerald-500" />
        <p className="text-xl font-bold text-blue-50">কোর্সটি সফলভাবে তৈরি হয়েছে!</p>
        <p className="text-sm text-slate-400">&quot;{basicInfo.name || "নতুন কোর্স"}&quot; প্রকাশিত হয়েছে</p>
        <Link
          href="/courses"
          className="mt-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-3 text-base font-semibold text-white"
        >
          কোর্স তালিকায় ফিরে যান
        </Link>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {isPublishing && (
        <p className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center text-sm text-slate-400">
          কোর্স প্রকাশ করা হচ্ছে…
        </p>
      )}

      {Boolean(error) && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div className="flex flex-col gap-1">
            <p className="text-sm text-red-500">
              কোর্স প্রকাশ করা যায়নি। API সার্ভার সংযোগ ও তথ্য যাচাই করে আবার চেষ্টা করুন।
            </p>
            <p className="text-xs text-red-400/80">{describeError(error)}</p>
          </div>
        </div>
      )}

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <h2 className="text-xl font-bold leading-8 text-blue-50">কোর্সের তথ্য</h2>
        <p className="mt-2 text-sm text-slate-400">{basicInfo.description || "কোনো বিবরণ দেওয়া হয়নি"}</p>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="mt-0.5 text-base font-semibold text-blue-50">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <h2 className="text-xl font-bold leading-8 text-blue-50">কন্টেন্ট সারসংক্ষেপ</h2>
        <p className="mt-1 text-xs text-amber-500">
          মডিউল ও পাঠ এখনো সংরক্ষিত হয় না — এই তথ্যের জন্য আলাদা API যুক্ত হলে সংরক্ষণ চালু হবে।
        </p>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-blue-500/40 bg-blue-500/10 p-4 text-center">
            <Video size={20} className="mx-auto text-blue-500" />
            <p className="mt-1 text-xl font-bold text-blue-500">{totals.video}</p>
            <p className="text-xs text-blue-500 opacity-80">ভিডিও ক্লাস</p>
          </div>
          <div className="rounded-2xl border border-violet-500/40 bg-violet-500/10 p-4 text-center">
            <FileText size={20} className="mx-auto text-violet-500" />
            <p className="mt-1 text-xl font-bold text-violet-500">{totals.file}</p>
            <p className="text-xs text-violet-500 opacity-80">ফাইল/নোট</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
            <HelpCircle size={20} className="mx-auto text-emerald-500" />
            <p className="mt-1 text-xl font-bold text-emerald-500">{totals.quiz}</p>
            <p className="text-xs text-emerald-500 opacity-80">কুইজ</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {modules.map((module, index) => (
            <div key={module.id} className="rounded-xl border border-slate-800 bg-gray-900/30 p-3">
              <p className="text-sm font-semibold text-blue-50">
                {index + 1}. {module.title} ({module.items.length} আইটেম)
              </p>
              {module.items.length > 0 && (
                <ul className="mt-1.5 flex flex-col gap-1 pl-4">
                  {module.items.map((item, itemIndex) => (
                    <li key={item.id} className="list-decimal text-xs text-slate-400">
                      {itemIndex + 1}. {item.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {modules.length === 0 && <p className="text-sm text-slate-400">কোনো মডিউল যোগ করা হয়নি</p>}
        </div>
      </section>
    </div>
  );
}
