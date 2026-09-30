"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Ban,
  BookMarked,
  Calendar,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Hash,
  Mail,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCheck,
  UserMinus,
} from "lucide-react";
import {
  useGetCourseEnrollmentsQuery,
  useUpdateEnrollmentStatusMutation,
  useUpdateEnrollmentVerificationMutation,
  type Enrollment,
  type EnrollmentStatusAction,
  type EnrollmentTab,
} from "@/redux/api/coursesApi";
import { useGetStudentQuery } from "@/redux/api/studentsApi";
import { usePermissions } from "@/hooks/use-permissions";
import { statusOf, studentStatusStyles } from "@/lib/student-status";
import ConfirmActionDialog from "@/components/confirm-action-dialog";
import StudentDetailModal from "../../../students/includes/student-detail-modal";
import BulkEnrollmentImport from "./bulk-enrollment-import";

const TABS: { value: EnrollmentTab; label: string; countKey: "enrolled" | "suspended" | "removed" }[] = [
  { value: "", label: "সব ভর্তি", countKey: "enrolled" },
  { value: "suspended", label: "নিষ্ক্রিয়", countKey: "suspended" },
  { value: "removed", label: "সরানো", countKey: "removed" },
];

/** What each action's confirmation popup says. */
const ACTION_COPY: Record<
  EnrollmentStatusAction,
  { title: string; message: (name: string, course: string) => string; confirm: string }
> = {
  suspend: {
    title: "শিক্ষার্থী নিষ্ক্রিয় করবেন?",
    message: (name, course) =>
      `${name} “${course}” কোর্সে আর ঢুকতে পারবে না — ক্লাস, পরীক্ষা, রিসোর্স সব বন্ধ থাকবে। ভর্তি, পেমেন্ট ও রেজাল্ট থেকে যাবে, পরে যেকোনো সময় আবার সক্রিয় করা যাবে।`,
    confirm: "নিষ্ক্রিয় করুন",
  },
  activate: {
    title: "শিক্ষার্থী সক্রিয় করবেন?",
    message: (name, course) =>
      `${name} আবার “${course}” কোর্সের সবকিছু দেখতে পারবে।`,
    confirm: "সক্রিয় করুন",
  },
  remove: {
    title: "কোর্স থেকে সরাবেন?",
    message: (name, course) =>
      `${name} কে “${course}” কোর্স থেকে সরানো হবে — কোর্সটি তার তালিকা থেকে চলে যাবে। অর্ডার, পেমেন্ট, কিস্তি ও রেজাল্ট মুছবে না, আর টাকা নিজে থেকে ফেরত যাবে না। “সরানো” ট্যাব থেকে পরে ফেরত আনা যাবে।`,
    confirm: "কোর্স থেকে সরান",
  },
  restore: {
    title: "কোর্সে ফেরত আনবেন?",
    message: (name, course) =>
      `${name} আবার “${course}” কোর্সে ভর্তি হিসেবে দেখাবে। সরানোর সময় নিষ্ক্রিয় থাকলে ফেরত আনার পরও নিষ্ক্রিয় থাকবে।`,
    confirm: "ফেরত আনুন",
  },
};

type PendingAction = {
  enrollment: Enrollment;
  action: EnrollmentStatusAction;
  studentName: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  return date.toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sourceLabel(value: string) {
  if (value === "admin") return "Admin";
  if (value === "free") return "Free";
  if (value === "order") return "Order";
  return value || "Manual";
}

export default function CourseEnrolledStudents({
  courseId,
  courseTitle,
  verificationRequired,
}: {
  courseId: number;
  courseTitle: string;
  verificationRequired: boolean;
}) {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<EnrollmentTab>("");
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState("");
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("can_manage_course_enrollments");
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateEnrollmentStatusMutation();
  // Debounced so typing does not fire a request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, refetch } = useGetCourseEnrollmentsQuery({
    id: courseId,
    page,
    search: debouncedSearch || undefined,
    status: tab || undefined,
  });

  const confirmPendingAction = async () => {
    if (!pendingAction) return;
    setActionError("");
    try {
      await updateStatus({
        courseId,
        enrollmentId: pendingAction.enrollment.id,
        action: pendingAction.action,
      }).unwrap();
      setPendingAction(null);
    } catch (error) {
      const detail = (error as { data?: { detail?: string } })?.data?.detail;
      setActionError(detail || "কাজটি সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।");
      setPendingAction(null);
    }
  };

  if (!hasPermission("can_view_course_enrollments")) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 text-center shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <ShieldCheck size={28} className="mx-auto text-slate-500" />
        <p className="mt-3 text-sm font-semibold text-blue-50">
          ভর্তি শিক্ষার্থী দেখার অনুমতি নেই
        </p>
      </section>
    );
  }

  const enrollments = data?.results ?? [];
  const counts = data?.counts;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold leading-8 text-blue-50">
            ভর্তি শিক্ষার্থী
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            এই কোর্সে মোট {counts?.enrolled ?? data?.count ?? 0} জন শিক্ষার্থী ভর্তি আছে
            {verificationRequired ? " · এই কোর্সে অ্যাডমিন ভেরিফিকেশন চালু আছে" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BulkEnrollmentImport
            courseId={courseId}
            courseTitle={courseTitle}
            onCompleted={() => void refetch()}
          />
          <label className="flex min-w-[260px] items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/35 px-3.5 py-2.5">
            <Search size={15} className="text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="নাম, আইডি, ইমেইল বা ফোন খুঁজুন"
              className="w-full bg-transparent text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none"
            />
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((option) => (
          <button
            key={option.value || "all"}
            type="button"
            onClick={() => {
              setTab(option.value);
              setPage(1);
            }}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${
              tab === option.value
                ? "border-blue-400/40 bg-blue-500/15 text-blue-200"
                : "border-slate-800 bg-slate-950/35 text-slate-400"
            }`}
          >
            {option.label}
            {counts ? ` (${counts[option.countKey]})` : ""}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/5 p-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
          <p className="text-sm text-red-300">{actionError}</p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {isLoading ? (
          <p className="rounded-2xl border border-slate-800 bg-gray-900/40 p-6 text-center text-sm text-slate-400">
            শিক্ষার্থী তালিকা লোড হচ্ছে...
          </p>
        ) : isError ? (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center text-sm text-red-400">
            ভর্তি শিক্ষার্থীর তালিকা আনা যায়নি।
          </p>
        ) : enrollments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
            {debouncedSearch
              ? "এই খোঁজে কোনো শিক্ষার্থী পাওয়া যায়নি।"
              : tab === "suspended"
                ? "এই কোর্সে কোনো নিষ্ক্রিয় শিক্ষার্থী নেই।"
                : tab === "removed"
                  ? "এই কোর্স থেকে কাউকে সরানো হয়নি।"
                  : "এই কোর্সে এখনো কোনো শিক্ষার্থী ভর্তি হয়নি।"}
          </p>
        ) : (
          enrollments.map((enrollment) => (
            <EnrollmentStudentRow
              enrollment={enrollment}
              key={enrollment.id}
              onSelect={() => setSelectedStudentId(enrollment.student)}
              verificationRequired={verificationRequired}
              canManage={canManage}
              onAction={(action, studentName) => {
                setActionError("");
                setPendingAction({ enrollment, action, studentName });
              }}
            />
          ))
        )}
      </div>

      {data && (data.previous || data.next) ? (
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={!data.previous}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-4 py-2 text-sm font-semibold text-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={15} />
            আগের পেজ
          </button>
          <span className="text-xs font-semibold text-slate-400">পেজ {page}</span>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={!data.next}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-4 py-2 text-sm font-semibold text-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            পরের পেজ
            <ChevronRight size={15} />
          </button>
        </div>
      ) : null}

      {selectedStudentId !== null ? (
        <StudentDetailModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      ) : null}

      <ConfirmActionDialog
        open={pendingAction !== null}
        title={pendingAction ? ACTION_COPY[pendingAction.action].title : ""}
        message={
          pendingAction
            ? ACTION_COPY[pendingAction.action].message(pendingAction.studentName, courseTitle)
            : ""
        }
        confirmLabel={pendingAction ? ACTION_COPY[pendingAction.action].confirm : undefined}
        isLoading={isUpdatingStatus}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
      />
    </section>
  );
}

function EnrollmentStudentRow({
  enrollment,
  onSelect,
  verificationRequired,
  canManage,
  onAction,
}: {
  enrollment: Enrollment;
  onSelect: () => void;
  verificationRequired: boolean;
  canManage: boolean;
  onAction: (action: EnrollmentStatusAction, studentName: string) => void;
}) {
  const { data: student, isLoading } = useGetStudentQuery(enrollment.student);
  const [updateVerification, { isLoading: isUpdating }] = useUpdateEnrollmentVerificationMutation();
  const studentName = student?.full_name || enrollment.student_name || `শিক্ষার্থী #${enrollment.student}`;
  const studentEmail = student?.email || enrollment.student_email || "-";
  const studentPhone = student?.phone || enrollment.student_phone || "-";
  const isRemoved = !enrollment.is_active;
  const status = student
    ? studentStatusStyles[statusOf(student)]
    : {
        label: enrollment.is_active ? "সক্রিয়" : "নিষ্ক্রিয়",
        className: enrollment.is_active
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
          : "border-slate-500/30 bg-slate-500/10 text-slate-400",
      };

  // Stops the row's own click, which opens the student profile.
  const act = (action: EnrollmentStatusAction) => (event: React.MouseEvent) => {
    event.stopPropagation();
    onAction(action, studentName);
  };

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
      className={`flex w-full cursor-pointer flex-wrap items-center gap-4 rounded-2xl border p-4 text-left transition hover:border-slate-700 ${
        enrollment.is_suspended || isRemoved
          ? "border-red-500/20 bg-red-500/[0.03]"
          : "border-slate-800 bg-gray-900/40"
      }`}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500">
        <GraduationCap size={24} className="text-white" />
      </span>

      <div className="min-w-[240px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-semibold text-blue-50">
            {isLoading ? "লোড হচ্ছে..." : studentName}
          </p>
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${status.className}`}>
            {status.label}
          </span>
          {enrollment.is_suspended && (
            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-300">
              কোর্সে নিষ্ক্রিয়
            </span>
          )}
          {isRemoved && (
            <span className="rounded-full border border-slate-500/30 bg-slate-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
              কোর্স থেকে সরানো
            </span>
          )}
          <span className="rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300">
            {sourceLabel(enrollment.source)}
          </span>
          {verificationRequired && !isRemoved && (
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                enrollment.is_verified
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300"
              }`}
            >
              {enrollment.is_verified ? "ভেরিফায়েড" : "ভেরিফিকেশন বাকি"}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-400">
          {enrollment.student_code && (
            <span className="flex items-center gap-1">
              <Hash size={13} />
              {enrollment.student_code}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Mail size={13} />
            {studentEmail}
          </span>
          <span className="flex items-center gap-1">
            <Phone size={13} />
            {studentPhone}
          </span>
          <span className="flex items-center gap-1">
            <BookMarked size={13} />
            {student?.student_profile?.institution || "-"}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={13} />
            ভর্তি: {formatDate(enrollment.enrolled_at)}
          </span>
        </div>
        {enrollment.is_suspended && enrollment.suspended_at && (
          <p className="mt-1.5 text-xs text-red-300/80">
            নিষ্ক্রিয় করা হয়েছে: {formatDate(enrollment.suspended_at)}
            {enrollment.suspended_by_name ? ` · ${enrollment.suspended_by_name}` : ""}
          </p>
        )}
        {isRemoved && (
          <p className="mt-1.5 text-xs text-slate-400">
            {enrollment.removed_at
              ? `সরানো হয়েছে: ${formatDate(enrollment.removed_at)}${
                  enrollment.removed_by_name ? ` · ${enrollment.removed_by_name}` : ""
                }`
              : "অর্ডার বাতিল/রিফান্ডের কারণে ভর্তি বন্ধ হয়েছে"}
          </p>
        )}
      </div>

      <div className="ml-auto flex flex-wrap items-end gap-2" onClick={(event) => event.stopPropagation()}>
        {verificationRequired && !isRemoved && (
          <label className="flex min-w-[170px] cursor-pointer flex-col gap-1.5 text-xs font-semibold text-slate-400">
            ভেরিফিকেশন
            <select
              value={enrollment.is_verified ? "yes" : "no"}
              disabled={isUpdating}
              onChange={(event) => {
                void updateVerification({
                  courseId: enrollment.course,
                  enrollmentId: enrollment.id,
                  is_verified: event.target.value === "yes",
                });
              }}
              className="h-10 rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm font-bold text-blue-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="yes">হ্যাঁ, ভেরিফায়েড</option>
              <option value="no">না, পেন্ডিং</option>
            </select>
          </label>
        )}

        {canManage &&
          (isRemoved ? (
            <button
              type="button"
              onClick={act("restore")}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 text-xs font-bold text-blue-200 hover:bg-blue-500/15"
            >
              <RotateCcw size={14} />
              ফেরত আনুন
            </button>
          ) : (
            <>
              {enrollment.is_suspended ? (
                <button
                  type="button"
                  onClick={act("activate")}
                  className="flex h-10 items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/15"
                >
                  <UserCheck size={14} />
                  সক্রিয় করুন
                </button>
              ) : (
                <button
                  type="button"
                  onClick={act("suspend")}
                  className="flex h-10 items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 text-xs font-bold text-amber-200 hover:bg-amber-500/15"
                >
                  <Ban size={14} />
                  নিষ্ক্রিয় করুন
                </button>
              )}
              <button
                type="button"
                onClick={act("remove")}
                className="flex h-10 items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 text-xs font-bold text-red-200 hover:bg-red-500/15"
              >
                <UserMinus size={14} />
                কোর্স থেকে সরান
              </button>
            </>
          ))}
      </div>
    </div>
  );
}
