import {
  FileText,
  Sparkles,
  Clock,
  ListChecks,
  Users,
  TriangleAlert,
  Calendar,
  Megaphone,
  Trophy,
} from "lucide-react";
import type { ExamBasicInfo } from "./types";

function formatLocalDateTime(value: string): string {
  if (!value) return "সেট করা হয়নি";
  const [date, time] = value.split("T");
  return time ? `${date} ${time}` : date;
}

export default function ExamSummary({
  value,
  questionCount,
  totalMarks,
  marksSummary,
}: {
  value: ExamBasicInfo;
  questionCount: number;
  /** Sum of every question's own marks — not questionCount × default. */
  totalMarks?: number;
  /** e.g. "৭৫ × ১ + ২৫ × ২", omitted when the paper is uniform. */
  marksSummary?: string;
}) {
  const dateValue = value.examDate
    ? `${value.examDate}${value.startTime ? ` ${value.startTime}` : ""}`
    : "সেট করা হয়নি";

  const rows = [
    { icon: FileText, label: "নাম", value: value.name || "—" },
    { icon: Sparkles, label: "বিষয়", value: value.subjectName || "—" },
    { icon: Clock, label: "সময়", value: value.duration ? `${value.duration} মিনিট` : "—" },
    { icon: ListChecks, label: "প্রশ্ন", value: `${questionCount} টি` },
    {
      icon: ListChecks,
      label: "মোট নম্বর",
      value:
        totalMarks === undefined
          ? "—"
          : marksSummary
            ? `${totalMarks} (${marksSummary})`
            : String(totalMarks),
    },
    { icon: Users, label: "পাস মার্ক", value: value.passMark ? `${value.passMark}%` : "—" },
    {
      icon: TriangleAlert,
      label: "নেগেটিভ",
      value:
        value.negativeMode === "percentage"
          ? `${value.negativePercentage || "0"}% (প্রশ্নের নম্বরের)`
          : `${value.negativeMark || "0"} (প্রতি ভুলে)`,
    },
    { icon: Calendar, label: "শুরু", value: dateValue },
    { icon: Clock, label: "ডেডলাইন", value: formatLocalDateTime(value.deadline) },
    { icon: Megaphone, label: "রেজাল্ট পাবলিশ", value: formatLocalDateTime(value.resultPublishAt) },
    { icon: Trophy, label: "লিডারবোর্ড পাবলিশ", value: formatLocalDateTime(value.leaderboardPublishAt) },
  ];

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <h2 className="text-lg font-bold text-blue-50">পরীক্ষার সামারি</h2>

      <div className="mt-4 flex flex-col gap-3.5">
        {rows.map(({ icon: Icon, label, value: v }) => (
          <div key={label} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Icon size={14} />
              {label}
            </span>
            <span className="font-semibold text-blue-50">{v}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
