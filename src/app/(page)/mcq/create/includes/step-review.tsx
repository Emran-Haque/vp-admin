import Link from "next/link";
import { Eye, ListChecks, AlertTriangle, CheckCircle2, Megaphone, Trophy, Clock, CalendarClock } from "lucide-react";
import type { ExamBasicInfo, Question } from "./types";

function formatLocalDateTime(value: string): string {
  if (!value) return "ম্যানুয়ালি প্রকাশ করতে হবে";
  const [date, time] = value.split("T");
  return time ? `${date} ${time}` : date;
}

const optionLabels = ["ক", "খ", "গ", "ঘ"];

type Props = {
  basicInfo: ExamBasicInfo;
  questions: Question[];
  published: boolean;
  isPublishing?: boolean;
  error?: string | null;
};

export default function StepReview({ basicInfo, questions, published, isPublishing, error }: Props) {
  const previewStats: { label: string; value: string }[] = [
    { label: "বিষয়", value: basicInfo.subjectName || "—" },
    { label: "সময়", value: basicInfo.duration ? `${basicInfo.duration} মিনিট` : "—" },
    { label: "প্রশ্ন", value: `${questions.length} টি` },
    { label: "নেগেটিভ", value: basicInfo.negativeMark || "0" },
  ];

  if (published) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-10 text-center shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <CheckCircle2 size={48} className="text-emerald-500" />
        <p className="text-xl font-bold text-blue-50">পরীক্ষাটি সফলভাবে প্রকাশিত হয়েছে!</p>
        <p className="text-sm text-slate-400">&quot;{basicInfo.name || "নতুন পরীক্ষা"}&quot; প্রকাশিত হয়েছে</p>
        <Link
          href="/mcq"
          className="mt-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-3 text-base font-semibold text-white"
        >
          পরীক্ষার তালিকায় ফিরে যান
        </Link>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {isPublishing && (
        <p className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center text-sm text-slate-400">
          পরীক্ষা প্রকাশ করা হচ্ছে…
        </p>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <div className="flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20">
            <Eye size={24} className="text-cyan-500" />
          </span>
          <div>
            <h2 className="text-xl font-bold leading-8 text-blue-50">পরীক্ষার পূর্বরূপ</h2>
            <p className="mt-0.5 text-base text-slate-400">প্রকাশের আগে সব কিছু যাচাই করুন</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          {previewStats.map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-gray-900/40 p-3.5">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-0.5 text-lg font-semibold text-blue-50">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <p className="text-sm text-slate-400">পরীক্ষার নাম</p>
          <p className="mt-0.5 text-xl font-bold text-blue-50">{basicInfo.name || "—"}</p>
        </div>

        {basicInfo.description && <p className="mt-3 text-base text-slate-400">{basicInfo.description}</p>}

        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-gray-900/40 p-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
              <CalendarClock size={16} className="text-blue-500" />
            </span>
            <div>
              <p className="text-sm text-slate-400">পরীক্ষা শুরু</p>
              <p className="mt-0.5 text-sm font-semibold text-blue-50">
                {basicInfo.examDate ? `${basicInfo.examDate} ${basicInfo.startTime || "—"}` : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-gray-900/40 p-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
              <Clock size={16} className="text-blue-500" />
            </span>
            <div>
              <p className="text-sm text-slate-400">ডেডলাইন</p>
              <p className="mt-0.5 text-sm font-semibold text-blue-50">
                {formatLocalDateTime(basicInfo.deadline)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-gray-900/40 p-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20">
              <Megaphone size={16} className="text-cyan-500" />
            </span>
            <div>
              <p className="text-sm text-slate-400">ফলাফল প্রকাশের সময়</p>
              <p className="mt-0.5 text-sm font-semibold text-blue-50">
                {formatLocalDateTime(basicInfo.resultPublishAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-gray-900/40 p-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
              <Trophy size={16} className="text-amber-500" />
            </span>
            <div>
              <p className="text-sm text-slate-400">লিডারবোর্ড প্রকাশের সময়</p>
              <p className="mt-0.5 text-sm font-semibold text-blue-50">
                {formatLocalDateTime(basicInfo.leaderboardPublishAt)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <div className="flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20">
            <ListChecks size={24} className="text-cyan-500" />
          </span>
          <div>
            <h2 className="text-xl font-bold leading-8 text-blue-50">প্রশ্নসমূহ</h2>
            <p className="mt-0.5 text-base text-slate-400">{questions.length} টি প্রশ্ন</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {questions.map((question, index) => (
            <div key={question.id} className="rounded-2xl border border-slate-800 bg-gray-900/30 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-xs font-bold text-slate-400">
                  {index + 1}
                </span>
                <p className="text-base font-semibold text-blue-50">{question.text || "—"}</p>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 pl-10 sm:grid-cols-2">
                {question.options.map((option, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm ${
                      question.correctIndex === i
                        ? "bg-emerald-500/20 text-emerald-500"
                        : "text-blue-50"
                    }`}
                  >
                    <span className="font-semibold">{optionLabels[i]}.</span>
                    {option || "—"}
                  </div>
                ))}
              </div>

              {question.explanation && (
                <p className="mt-3 border-l-2 border-emerald-500 pl-3 text-sm text-slate-400">
                  <span className="font-semibold text-emerald-500">ব্যাখ্যা:</span> {question.explanation}
                </p>
              )}
            </div>
          ))}
          {questions.length === 0 && <p className="text-sm text-slate-400">কোনো প্রশ্ন যোগ করা হয়নি</p>}
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="text-sm text-amber-500">
          প্রকাশ করার পর পরীক্ষার্থীরা সাথে সাথে এই পরীক্ষা দেখতে পারবে। নিশ্চিত হয়ে নিন সব প্রশ্ন ও সঠিক উত্তর ঠিক আছে।
        </p>
      </div>
    </div>
  );
}
