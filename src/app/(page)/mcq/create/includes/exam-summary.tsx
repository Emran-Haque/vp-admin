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
  if (!value) return "নির্ধারিত নয়";
  const [date, time] = value.split("T");
  return time ? `${date} ${time}` : date;
}

export default function ExamSummary({ value, questionCount }: { value: ExamBasicInfo; questionCount: number }) {
  const dateValue = value.examDate
    ? `${value.examDate}${value.startTime ? ` ${value.startTime}` : ""}`
    : "নির্ধারিত নয়";

  const rows = [
    { icon: FileText, label: "নাম", value: value.name || "—" },
    { icon: Sparkles, label: "বিষয়", value: value.subjectName || "—" },
    { icon: Clock, label: "সময়কাল", value: value.duration ? `${value.duration} মিনিট` : "—" },
    { icon: ListChecks, label: "প্রশ্ন", value: `${questionCount} টি` },
    { icon: Users, label: "পাস মার্ক", value: value.passMark ? `${value.passMark}%` : "—" },
    { icon: TriangleAlert, label: "নেগেটিভ", value: value.negativeMark || "0" },
    { icon: Calendar, label: "শুরু", value: dateValue },
    { icon: Clock, label: "ডেডলাইন", value: formatLocalDateTime(value.deadline) },
    { icon: Megaphone, label: "ফলাফল প্রকাশ", value: formatLocalDateTime(value.resultPublishAt) },
    { icon: Trophy, label: "লিডারবোর্ড প্রকাশ", value: formatLocalDateTime(value.leaderboardPublishAt) },
  ];

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <h2 className="text-lg font-bold text-blue-50">পরীক্ষার সারাংশ</h2>

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
