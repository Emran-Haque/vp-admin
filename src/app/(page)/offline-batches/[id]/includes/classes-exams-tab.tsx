"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardPen,
  Loader2,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { useScrollPagination } from "@/hooks/use-infinite-scroll";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useDeleteClassMutation,
  useGetClassListInfiniteQuery,
  type CourseClass,
} from "@/redux/api/classesApi";
import { useGetCourseSubjectsQuery } from "@/redux/api/courseSubjectsApi";
import {
  useDeleteExamMutation,
  usePublishOfflineResultMutation,
  type ClassQuiz,
  type OfflineMarksErrorBody,
} from "@/redux/api/examsApi";
import ConfirmActionDialog from "@/components/confirm-action-dialog";
import { extractErrorMessage } from "@/lib/api-error";
import ClassFormModal from "./class-form-modal";
import OfflineExamFormModal from "./offline-exam-form-modal";

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" });
}

function plainMarks(value: string | undefined) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("bn-BD") : value ?? "";
}

type Pending =
  | { kind: "publish"; exam: ClassQuiz }
  | { kind: "delete-exam"; exam: ClassQuiz }
  | { kind: "delete-class"; courseClass: CourseClass };

export default function ClassesExamsTab({
  courseId,
  canAddExams,
}: {
  courseId: number;
  canAddExams: boolean;
}) {
  const { hasPermission } = usePermissions();
  const canCreateClass = hasPermission("can_create_live_class");
  const canEditClass = hasPermission("can_edit_live_class");
  const canDeleteClass = hasPermission("can_delete_live_class");
  const canCreateExam = hasPermission("can_create_exam") && canAddExams;
  const canEditExam = hasPermission("can_edit_exam");
  const canDeleteExam = hasPermission("can_delete_exam");
  const canViewMarks = hasPermission("can_view_results");
  const canPublish = hasPermission("can_publish_result");

  const [classForm, setClassForm] = useState<{ edit?: CourseClass } | null>(null);
  const [examForm, setExamForm] = useState<{ courseClass: CourseClass; edit?: ClassQuiz } | null>(
    null,
  );
  const [pending, setPending] = useState<Pending | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const { data: subjectsData } = useGetCourseSubjectsQuery({ course: courseId });
  const subjectName = new Map((subjectsData?.results ?? []).map((s) => [s.id, s.name]));

  const classesQuery = useGetClassListInfiniteQuery({ course: courseId });
  const { isLoading, isError, hasNextPage, isFetchingNextPage } = classesQuery;
  const {
    items: classes,
    sentinelRef,
    loadMore,
    loadMoreFailed,
  } = useScrollPagination(classesQuery);

  const [publishResult, { isLoading: isPublishing }] = usePublishOfflineResultMutation();
  const [deleteExam, { isLoading: isDeletingExam }] = useDeleteExamMutation();
  const [deleteClass, { isLoading: isDeletingClass }] = useDeleteClassMutation();

  const confirm = async () => {
    if (!pending) return;
    setNotice(null);
    try {
      if (pending.kind === "publish") {
        const outcome = await publishResult(pending.exam.id).unwrap();
        const drafts = Object.keys(outcome.sms_campaigns).length;
        setNotice({
          tone: "ok",
          text: `“${pending.exam.title}” এর ফলাফল প্রকাশিত হয়েছে (${outcome.results} জন)।${
            drafts
              ? " SMS খসড়া তৈরি হয়েছে — “অভিভাবক SMS” পাতা থেকে খরচ দেখে পাঠান।"
              : ""
          }`,
        });
      } else if (pending.kind === "delete-exam") {
        await deleteExam(pending.exam.id).unwrap();
      } else {
        await deleteClass(pending.courseClass.id).unwrap();
      }
    } catch (err) {
      const body = (err as { data?: OfflineMarksErrorBody })?.data;
      setNotice({ tone: "error", text: body?.detail || extractErrorMessage(err) });
    }
    setPending(null);
  };

  const pendingCopy = (() => {
    if (!pending) return { title: "", message: "", confirm: "" };
    if (pending.kind === "publish") {
      return {
        title: "ফলাফল প্রকাশ করবেন?",
        message: `“${pending.exam.title}” এর নম্বর শিক্ষার্থীরা দেখতে পাবে এবং মেধাক্রম তৈরি হবে। অভিভাবক ও শিক্ষার্থীর SMS শুধু খসড়া হিসেবে তৈরি হবে — “অভিভাবক SMS” পাতা থেকে আপনি পাঠালেই যাবে। কারো নম্বর বাকি থাকলে প্রকাশ হবে না।`,
        confirm: "ফলাফল প্রকাশ করুন",
      };
    }
    if (pending.kind === "delete-exam") {
      return {
        title: "পরীক্ষা মুছবেন?",
        message: `“${pending.exam.title}” এবং এর সব নম্বর মুছে যাবে। এটি ফেরত আনা যাবে না।`,
        confirm: "মুছে ফেলুন",
      };
    }
    return {
      title: "ক্লাস মুছবেন?",
      message: `“${pending.courseClass.title}” রুটিন থেকে মুছে যাবে।`,
      confirm: "মুছে ফেলুন",
    };
  })();

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-blue-50">ক্লাস ও পরীক্ষা</h2>
          <p className="text-xs text-slate-400">
            প্রতিটি ক্লাসের নিচে তার পরীক্ষা — নম্বর দিন, তারপর ফলাফল প্রকাশ করুন।
          </p>
        </div>
        {canCreateClass && (
          <button
            type="button"
            onClick={() => setClassForm({})}
            className="flex items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white"
          >
            <Plus size={14} />
            নতুন ক্লাস
          </button>
        )}
      </div>

      {notice && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-2xl border p-3 ${
            notice.tone === "ok"
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
              : "border-red-500/30 bg-red-500/5 text-red-300"
          }`}
        >
          {notice.tone === "ok" ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          )}
          <p className="text-sm">
            {notice.text}
            {notice.tone === "ok" && notice.text.includes("SMS") ? (
              <>
                {" "}
                <Link href="/guardian-sms" className="font-bold underline">
                  অভিভাবক SMS পাতায় যান
                </Link>
              </>
            ) : null}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-4">
        {isLoading && <p className="text-center text-sm text-slate-400">ক্লাস লোড হচ্ছে…</p>}
        {isError && (
          <p className="text-center text-sm text-red-400">ক্লাসের তালিকা আনা যায়নি।</p>
        )}
        {!isLoading && !isError && classes.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
            এখনো কোনো ক্লাস নেই। “নতুন ক্লাস” দিয়ে রুটিন শুরু করুন।
          </p>
        )}

        {classes.map((courseClass) => {
          const exams = courseClass.quizzes.filter((quiz) => quiz.mode === "offline");
          const subject = courseClass.subject
            ? subjectName.get(Number(courseClass.subject))
            : undefined;
          return (
            <article
              key={courseClass.id}
              className="rounded-2xl border border-slate-800 bg-gray-900/40 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-blue-50">{courseClass.title}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    {courseClass.class_date && (
                      <span className="flex items-center gap-1">
                        <CalendarDays size={12} />
                        {formatDate(courseClass.class_date)}
                        {courseClass.start_time ? ` · ${courseClass.start_time.slice(0, 5)}` : ""}
                      </span>
                    )}
                    {subject && <span>বিষয়: {subject}</span>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canCreateExam && (
                    <button
                      type="button"
                      onClick={() => setExamForm({ courseClass })}
                      className="flex items-center gap-1 rounded-[10px] border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-100"
                    >
                      <Plus size={13} />
                      পরীক্ষা
                    </button>
                  )}
                  {canEditClass && (
                    <button
                      type="button"
                      onClick={() => setClassForm({ edit: courseClass })}
                      aria-label="ক্লাস এডিট"
                      className="flex size-8 items-center justify-center rounded-[10px] border border-slate-700 text-slate-300 hover:bg-white/5"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  {canDeleteClass && (
                    <button
                      type="button"
                      onClick={() => {
                        if (courseClass.quizzes.length > 0) {
                          setNotice({
                            tone: "error",
                            text: "এই ক্লাসে পরীক্ষা আছে — আগে পরীক্ষাগুলো মুছুন, তারপর ক্লাস মুছুন।",
                          });
                          return;
                        }
                        setPending({ kind: "delete-class", courseClass });
                      }}
                      aria-label="ক্লাস মুছুন"
                      className="flex size-8 items-center justify-center rounded-[10px] border border-red-500/30 text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {exams.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {exams.map((exam) => {
                    const published = exam.result_status === "published";
                    const negative = Number(exam.negative_mark_per_wrong ?? 0);
                    return (
                      <li
                        key={exam.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-100">{exam.title}</p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            পূর্ণমান {plainMarks(exam.total_marks)}
                            {negative > 0 ? ` · প্রতি ভুলে −${plainMarks(String(negative))}` : ""}
                            {exam.exam_date ? ` · ${formatDate(exam.exam_date)}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                              published
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                            }`}
                          >
                            {published ? "ফলাফল প্রকাশিত" : "প্রকাশ হয়নি"}
                          </span>
                          {canViewMarks && (
                            <Link
                              href={`/offline-batches/${courseId}/exams/${exam.id}`}
                              className="flex items-center gap-1 rounded-[10px] border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-100"
                            >
                              <ClipboardPen size={13} />
                              নম্বর দিন
                            </Link>
                          )}
                          {canPublish && !published && (
                            <button
                              type="button"
                              onClick={() => setPending({ kind: "publish", exam })}
                              className="flex items-center gap-1 rounded-[10px] bg-gradient-to-br from-emerald-500 to-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                            >
                              <Send size={13} />
                              ফলাফল প্রকাশ
                            </button>
                          )}
                          {canEditExam && (
                            <button
                              type="button"
                              onClick={() => setExamForm({ courseClass, edit: exam })}
                              aria-label="পরীক্ষা এডিট"
                              className="flex size-8 items-center justify-center rounded-[10px] border border-slate-700 text-slate-300 hover:bg-white/5"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          {canDeleteExam && !published && (
                            <button
                              type="button"
                              onClick={() => setPending({ kind: "delete-exam", exam })}
                              aria-label="পরীক্ষা মুছুন"
                              className="flex size-8 items-center justify-center rounded-[10px] border border-red-500/30 text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-slate-500">এই ক্লাসে এখনো কোনো পরীক্ষা নেই।</p>
              )}
            </article>
          );
        })}

        {hasNextPage && <div ref={sentinelRef} aria-hidden className="h-px" />}
        {isFetchingNextPage && (
          <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 size={14} className="animate-spin" />
            আরও ক্লাস লোড হচ্ছে…
          </p>
        )}
        {loadMoreFailed && (
          <button
            type="button"
            onClick={loadMore}
            className="mx-auto rounded-[10px] border border-red-400/30 bg-red-400/10 px-4 py-2 text-xs font-bold text-red-200"
          >
            আরও লোড করা যায়নি — আবার চেষ্টা করুন
          </button>
        )}
      </div>

      {classForm && (
        <ClassFormModal
          courseId={courseId}
          editItem={classForm.edit}
          onClose={() => setClassForm(null)}
        />
      )}
      {examForm && (
        <OfflineExamFormModal
          courseId={courseId}
          courseClass={examForm.courseClass}
          editItem={examForm.edit}
          onClose={() => setExamForm(null)}
        />
      )}
      <ConfirmActionDialog
        open={pending !== null}
        title={pendingCopy.title}
        message={pendingCopy.message}
        confirmLabel={pendingCopy.confirm}
        isLoading={isPublishing || isDeletingExam || isDeletingClass}
        onClose={() => setPending(null)}
        onConfirm={confirm}
      />
    </section>
  );
}
