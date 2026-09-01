"use client";

import { CalendarClock, Eye, FileText, Paperclip, Pencil, Star, Trash2, Users } from "lucide-react";
import { formatMarks } from "@/lib/marks";
import type { Assignment } from "@/redux/api/assignmentsApi";
import { AssignmentTelegramButton } from "../../includes/assignments-panel";

/**
 * An assignment, with the numbers an admin actually acts on.
 *
 * The previous row showed only "১০০ নম্বর · active", which answers none of the
 * questions that decide what to do next: is it still open, how long is left,
 * how many students have submitted, and how many still need marking. Those are
 * surfaced here so the list can be scanned instead of opened one by one.
 */
export default function AssignmentCard({
  item,
  onView,
  onEdit,
  onDelete,
  onTelegramMessage,
}: {
  item: Assignment;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTelegramMessage: (message: string | null) => void;
}) {
  const submissions = item.submission_count ?? 0;
  const evaluated = item.evaluated_count ?? 0;
  const pending = Math.max(submissions - evaluated, 0);
  const due = deadline(item.due_date);
  const tone = statusTone(item.status, due.isOverdue);

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
      <span
        className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${tone.line}`}
      />

      <div className="flex items-start gap-4 max-[860px]:flex-col max-[860px]:gap-3">
        <span
          className={`grid size-12 shrink-0 place-items-center rounded-[14px] border ${tone.iconBox}`}
        >
          <FileText size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${tone.badge}`}>
              {tone.label}
            </span>
            {/* Only worth shouting about while the assignment is still open. */}
            {due.text && item.status === "active" ? (
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-black ${
                  due.isOverdue
                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                    : due.isUrgent
                      ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
                      : "border-slate-700 bg-white/[0.03] text-slate-400"
                }`}
              >
                {due.text}
              </span>
            ) : null}
            {pending > 0 ? (
              <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[11px] font-black text-violet-300">
                {pending}টি মূল্যায়ন বাকি
              </span>
            ) : null}
          </div>

          <h3 className="m-0 mt-2 truncate text-[16px] font-black leading-snug text-blue-50">
            {item.title}
          </h3>

          <div className="mt-2.5 grid grid-cols-2 gap-2 max-[520px]:grid-cols-1">
            <Fact icon={<CalendarClock size={13} />} label="শেষ তারিখ" value={due.label} />
            <Fact icon={<Star size={13} />} label="পূর্ণমান" value={`${formatMarks(item.max_marks)} নম্বর`} />
            <Fact
              icon={<Users size={13} />}
              label="জমা পড়েছে"
              value={`${submissions}টি · ${evaluated}টি মূল্যায়িত`}
            />
            <Fact
              icon={<Paperclip size={13} />}
              label="প্রশ্ন ফাইল"
              value={`${item.attachments?.length ?? 0}টি`}
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 max-[860px]:w-full">
          <AssignmentTelegramButton assignmentId={item.id} onMessage={onTelegramMessage} />
          <button
            type="button"
            onClick={onView}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-slate-700 bg-white/[0.03] px-3.5 text-xs font-bold text-blue-50 hover:bg-white/[0.07]"
          >
            <Eye size={13} />
            জমা দেখা
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-slate-700 bg-white/[0.03] px-3.5 text-xs font-bold text-blue-50 hover:bg-white/[0.07]"
          >
            <Pencil size={13} />
            এডিট
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`${item.title} মুছুন`}
            className="inline-flex size-9 items-center justify-center rounded-[10px] border border-red-600/40 bg-red-600/10 text-red-500 hover:bg-red-600/20"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
      <span className="shrink-0 text-slate-500">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[11px] text-slate-400">
        {label}
        <span className="ml-1.5 font-bold text-slate-200">{value}</span>
      </span>
    </div>
  );
}

/**
 * Turn a due date into something worth reading at a glance.
 *
 * "১৫ মার্চ" tells an admin nothing on its own — "২ দিন বাকি" or "সময় শেষ" is
 * what decides whether to chase students today.
 */
function deadline(dueDate: string | null | undefined) {
  if (!dueDate) {
    return { label: "নির্ধারিত নয়", text: "", isOverdue: false, isUrgent: false };
  }
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) {
    return { label: "নির্ধারিত নয়", text: "", isOverdue: false, isUrgent: false };
  }

  const label = due.toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const msLeft = due.getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / 86_400_000);

  if (msLeft < 0) return { label, text: "সময় শেষ", isOverdue: true, isUrgent: false };
  if (daysLeft <= 1) return { label, text: "আজ শেষ", isOverdue: false, isUrgent: true };
  if (daysLeft <= 3)
    return { label, text: `${daysLeft} দিন বাকি`, isOverdue: false, isUrgent: true };
  return { label, text: `${daysLeft} দিন বাকি`, isOverdue: false, isUrgent: false };
}

function statusTone(status: Assignment["status"], isOverdue: boolean) {
  if (status === "evaluated") {
    return {
      label: "মূল্যায়ন সম্পন্ন",
      line: "from-emerald-500 via-emerald-400 to-teal-400",
      iconBox: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
      badge: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    };
  }
  if (status === "closed") {
    return {
      label: "বন্ধ",
      line: "from-slate-500 via-slate-400 to-slate-500",
      iconBox: "border-slate-500/25 bg-slate-500/10 text-slate-300",
      badge: "border-slate-500/25 bg-slate-500/10 text-slate-300",
    };
  }
  return {
    label: "চলমান",
    line: isOverdue
      ? "from-red-500 via-orange-500 to-amber-400"
      : "from-blue-500 via-sky-400 to-cyan-400",
    iconBox: "border-blue-400/25 bg-blue-500/10 text-blue-300",
    badge: "border-blue-400/25 bg-blue-500/10 text-blue-300",
  };
}
