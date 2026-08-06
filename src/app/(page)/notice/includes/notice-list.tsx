"use client";

import { Eye, EyeOff, Pencil, Trash2, Users, GraduationCap, BookOpen } from "lucide-react";
import {
  useGetNoticesQuery,
  useDeleteNoticeMutation,
  useToggleNoticeVisibilityMutation,
  type Notice,
} from "@/redux/api/noticesApi";
import ErrorState from "@/components/error-state";
import { PageLoader } from "@/components/loaders";

const targetTypeStyles: Record<string, { label: string; icon: typeof Users }> = {
  all: { label: "সবার জন্য", icon: Users },
  students: { label: "সকল শিক্ষার্থী", icon: GraduationCap },
  course_specific: { label: "নির্দিষ্ট কোর্স", icon: BookOpen },
};

function targetLabel(notice: Notice): string {
  if (notice.target_type === "course_specific") {
    return notice.course_title || "নির্দিষ্ট কোর্স";
  }
  return targetTypeStyles[notice.target_type]?.label ?? notice.target_type;
}

const priorityStyles: Record<string, { label: string; dot: string; badge: string }> = {
  urgent: {
    label: "জরুরি",
    dot: "bg-red-500 shadow-[0px_0px_6px_0px_rgba(239,68,68,1.00)]",
    badge: "bg-red-500/5 text-red-500",
  },
  important: {
    label: "গুরুত্বপূর্ণ",
    dot: "bg-amber-500 shadow-[0px_0px_6px_0px_rgba(245,158,11,1.00)]",
    badge: "bg-amber-500/5 text-amber-500",
  },
  normal: {
    label: "সাধারণ",
    dot: "bg-blue-500 shadow-[0px_0px_6px_0px_rgba(59,130,246,1.00)]",
    badge: "bg-blue-500/5 text-blue-500",
  },
};

export default function NoticeList({ onEdit }: { onEdit: (notice: Notice) => void }) {
  const { data, isLoading, isError, error } = useGetNoticesQuery();
  const [deleteNotice] = useDeleteNoticeMutation();
  const [toggleVisibility] = useToggleNoticeVisibilityMutation();

  if (isLoading) {
    return <PageLoader label="নোটিশের তালিকা লোড হচ্ছে…" />;
  }

  if (isError) {
    return <ErrorState message="নোটিশের তালিকা আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।" error={error} />;
  }

  const notices = data?.results ?? [];

  return (
    <section className="flex flex-col gap-2.5">
      {notices.map((notice) => {
        const priority = priorityStyles[notice.priority] ?? priorityStyles.normal;
        const TargetIcon = targetTypeStyles[notice.target_type]?.icon ?? Users;
        return (
          <div
            key={notice.id}
            className="flex items-start gap-3 rounded-2xl border border-white/5 bg-gray-900/75 p-5"
          >
            <span className={`mt-1.5 size-2 shrink-0 rounded-sm ${priority.dot}`} />

            <div className="min-w-48 flex-1">
              <p className="text-sm font-semibold text-slate-50">{notice.title}</p>
              <p className="mt-1 text-xs text-slate-400">{notice.description}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${priority.badge}`}>
                  {priority.label}
                </span>
                <span className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                  <TargetIcon size={10} />
                  {targetLabel(notice)}
                </span>
                <span className="text-xs text-gray-400">
                  {notice.category} • {new Date(notice.created_at).toLocaleDateString("bn-BD")}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => toggleVisibility(notice.id)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                  notice.is_visible
                    ? "bg-teal-500/10 text-teal-500 hover:bg-teal-500/20"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {notice.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                {notice.is_visible ? "দৃশ্যমান" : "লুকানো"}
              </button>
              <button
                type="button"
                onClick={() => onEdit(notice)}
                className="flex size-7 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-colors duration-200 hover:bg-white/10"
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`"${notice.title}" নোটিশটি মুছে ফেলতে চান?`)) deleteNotice(notice.id);
                }}
                className="flex size-7 cursor-pointer items-center justify-center rounded-lg bg-red-500/10 text-red-500 transition-colors duration-200 hover:bg-red-500/20"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        );
      })}

      {notices.length === 0 && (
        <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
          কোনো নোটিশ পাওয়া যায়নি।
        </p>
      )}
    </section>
  );
}
