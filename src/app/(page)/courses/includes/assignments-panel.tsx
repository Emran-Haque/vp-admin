"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
  useEvaluateSubmissionMutation,
  useGetAssignmentsQuery,
  useGetAssignmentTelegramStatusQuery,
  useGetSubmissionsQuery,
  usePostAssignmentToTelegramMutation,
  type Assignment,
  type Submission,
  type SubmissionAttachment,
} from "@/redux/api/assignmentsApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useGetClassesQuery } from "@/redux/api/classesApi";
import { useGetCourseSubjectsQuery } from "@/redux/api/courseSubjectsApi";
import { usePermissions } from "@/hooks/use-permissions";
import { extractErrorMessage } from "@/lib/api-error";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500 outline-emerald-500/40",
  closed: "bg-slate-500/10 text-slate-400 outline-slate-500/40",
  evaluated: "bg-blue-500/10 text-blue-500 outline-blue-500/40",
  submitted: "bg-amber-500/10 text-amber-500 outline-amber-500/40",
  late: "bg-orange-500/10 text-orange-500 outline-orange-500/40",
  rejected: "bg-red-500/10 text-red-500 outline-red-500/40",
};

const statusLabels: Record<string, string> = {
  active: "চলমান",
  closed: "বন্ধ",
  evaluated: "মূল্যায়িত",
  submitted: "জমা হয়েছে",
  late: "দেরিতে জমা",
  rejected: "বাতিল",
};

function formatDateTime(value: string) {
  if (!value) return "শেষ তারিখ নেই";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusClass(status: string) {
  return statusStyles[status] ?? "bg-slate-500/10 text-slate-400 outline-slate-500/40";
}

type AssignmentsPanelProps = {
  courseId: number;
  compact?: boolean;
};

export default function AssignmentsPanel({ courseId, compact = false }: AssignmentsPanelProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [panelMessage, setPanelMessage] = useState<string | null>(null);
  const { data, isLoading } = useGetAssignmentsQuery({ course: courseId });
  const [deleteAssignment] = useDeleteAssignmentMutation();
  const { hasPermission } = usePermissions();

  const assignments = data?.results ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-blue-50">অ্যাসাইনমেন্ট</h3>
          <p className="mt-1 text-xs text-slate-400">
            এই কোর্সে {assignments.length}টি অ্যাসাইনমেন্ট যোগ করা হয়েছে
          </p>
        </div>
        {hasPermission("can_manage_assignments") && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            অ্যাসাইনমেন্ট যোগ করুন
          </button>
        )}
      </div>

      <div className="mt-5">
        {panelMessage ? (
          <p className="mb-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200">
            {panelMessage}
          </p>
        ) : null}
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-400">অ্যাসাইনমেন্ট লোড হচ্ছে...</p>
        ) : assignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-7 text-center">
            <ClipboardList size={28} className="mx-auto text-slate-500" />
            <p className="mt-3 text-sm font-semibold text-blue-50">এখনো কোনো অ্যাসাইনমেন্ট নেই</p>
            <p className="mt-1 text-xs text-slate-400">
              এখানে ক্লাসভিত্তিক অ্যাসাইনমেন্ট যোগ করুন, যাতে শিক্ষার্থীরা দেখতে ও জমা দিতে পারে।
            </p>
          </div>
        ) : (
          <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1"}`}>
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-2xl border border-slate-800 bg-gray-900/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-blue-50">{assignment.title}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold outline outline-1 outline-offset-[-1px] ${getStatusClass(
                          assignment.status
                        )}`}
                      >
                        {statusLabels[assignment.status] ?? assignment.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {assignment.course_class_title || "সব ক্লাস"}
                      {assignment.subject_name ? ` • ${assignment.subject_name}` : ""}
                      {" • "}
                      শেষ তারিখ {formatDateTime(assignment.due_date)}
                      {" • "}
                      {assignment.max_marks} নম্বর
                    </p>
                    {assignment.description && (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-400">{assignment.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {hasPermission("can_manage_assignments") && (
                      <AssignmentTelegramButton
                        assignmentId={assignment.id}
                        onMessage={setPanelMessage}
                      />
                    )}
                    {hasPermission("can_manage_assignments") && (
                      <button
                        type="button"
                        onClick={() => setSelectedAssignment(assignment)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-blue-50 hover:bg-white/5"
                      >
                        <Eye size={14} />
                        জমা দেখা
                      </button>
                    )}
                    {hasPermission("can_manage_assignments") && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`"${assignment.title}" অ্যাসাইনমেন্টটি মুছে ফেলতে চান?`)) deleteAssignment(assignment.id);
                        }}
                        className="flex size-9 items-center justify-center rounded-xl border border-red-600/40 bg-red-600/10 text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && <AddAssignmentModal courseId={courseId} onClose={() => setShowAddModal(false)} />}
      {selectedAssignment && (
        <AssignmentSubmissionsModal assignment={selectedAssignment} onClose={() => setSelectedAssignment(null)} />
      )}
    </div>
  );
}

export function AssignmentTelegramButton({
  assignmentId,
  onMessage,
}: {
  assignmentId: number;
  onMessage: (message: string | null) => void;
}) {
  const { data: status } = useGetAssignmentTelegramStatusQuery(assignmentId);
  const [postToTelegram, { isLoading }] = usePostAssignmentToTelegramMutation();

  const handlePost = async () => {
    onMessage(null);
    try {
      const result = await postToTelegram({
        id: assignmentId,
        force_repost: Boolean(status?.is_posted),
      }).unwrap();
      onMessage(
        result.posted
          ? "অ্যাসাইনমেন্টটি সফলভাবে Telegram-এ পোস্ট হয়েছে।"
          : "এই অ্যাসাইনমেন্টটি আগে থেকেই Telegram-এ পোস্ট করা আছে।"
      );
    } catch (err) {
      onMessage(extractErrorMessage(err));
    }
  };

  return (
    <button
      type="button"
      onClick={handlePost}
      disabled={isLoading}
      className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-blue-50 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Send size={14} />
      {isLoading ? "পোস্ট হচ্ছে..." : status?.is_posted ? "আবার পোস্ট" : "Telegram-এ পোস্ট"}
    </button>
  );
}

type AddAssignmentModalProps = {
  courseId: number;
  initialSubjectId?: number;
  initialSubjectName?: string;
  editItem?: Assignment;
  onClose: () => void;
};

export function AddAssignmentModal({
  courseId,
  initialSubjectId,
  initialSubjectName,
  editItem,
  onClose,
}: AddAssignmentModalProps) {
  const isEdit = Boolean(editItem);
  const [title, setTitle] = useState(editItem?.title ?? "");
  const [description, setDescription] = useState(editItem?.description ?? "");
  const [courseClassId, setCourseClassId] = useState(
    editItem?.course_class ? String(editItem.course_class) : "",
  );
  const [subjectId, setSubjectId] = useState(
    editItem?.subject
      ? String(editItem.subject)
      : initialSubjectId
        ? String(initialSubjectId)
        : "",
  );
  const [dueDate, setDueDate] = useState(editItem?.due_date?.slice(0, 16) ?? "");
  const [maxMarks, setMaxMarks] = useState(editItem?.max_marks ?? "100");
  const [status, setStatus] = useState<Assignment["status"]>(editItem?.status ?? "active");
  const [error, setError] = useState<string | null>(null);

  const { data: classesData } = useGetClassesQuery({ course: courseId });
  const { data: subjectsData } = useGetCourseSubjectsQuery({ course: courseId });
  const [createAssignment, { isLoading: isCreating }] = useCreateAssignmentMutation();
  const [updateAssignment, { isLoading: isUpdating }] = useUpdateAssignmentMutation();
  const isLoading = isCreating || isUpdating;

  const classes = useMemo(() => classesData?.results ?? [], [classesData?.results]);
  const subjects = useMemo(() => subjectsData?.results ?? [], [subjectsData?.results]);

  const subjectOptions = useMemo(() => {
    const selectedClass = classes.find((item) => String(item.id) === courseClassId);
    const selectedClassSubject = selectedClass?.subject ? Number(selectedClass.subject) : null;
    if (!selectedClassSubject || Number.isNaN(selectedClassSubject)) return subjects;
    return subjects.filter((subject) => subject.id === selectedClassSubject);
  }, [classes, courseClassId, subjects]);

  const handleSave = async () => {
    setError(null);
    try {
      const payload = {
        course: courseId,
        course_class: courseClassId ? Number(courseClassId) : null,
        subject: subjectId ? Number(subjectId) : null,
        title,
        description,
        due_date: dueDate,
        max_marks: maxMarks || "0",
        status,
      };
      if (isEdit && editItem) {
        await updateAssignment({ id: editItem.id, data: payload }).unwrap();
      } else {
        await createAssignment(payload).unwrap();
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="max-h-[92vh] w-full max-w-[640px] overflow-y-auto rounded-[20px] border border-white/5 bg-gray-900/75 p-7 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-50">
            {isEdit ? "অ্যাসাইনমেন্ট সম্পাদনা" : "অ্যাসাইনমেন্ট যোগ করুন"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 pt-6">
          {error && (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-500">{error}</p>
            </div>
          )}

          {initialSubjectName ? (
            <div className="rounded-[10px] border border-blue-500/25 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-100">
              বিষয়: {initialSubjectName}
            </div>
          ) : null}

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">অ্যাসাইনমেন্টের শিরোনাম</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: অধ্যায় ১ অ্যাসাইনমেন্ট"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">বর্ণনা</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="অ্যাসাইনমেন্টের নির্দেশনা লিখুন"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          {!initialSubjectId ? (
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="block pb-1.5 text-xs font-semibold text-slate-400">ক্লাস (ঐচ্ছিক)</label>
                <select
                  value={courseClassId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setCourseClassId(cid);
                    // Follow the selected class's subject instead of clearing it,
                    // so the assignment never loses its subject.
                    const cls = classes.find((c) => String(c.id) === cid);
                    if (cls?.subject) setSubjectId(String(cls.subject));
                  }}
                  className="w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="">সব ক্লাস / কোনো ক্লাস নয়</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block pb-1.5 text-xs font-semibold text-slate-400">বিষয়</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="">কোনো বিষয় নয়</option>
                  {subjectOptions.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3.5 sm:grid-cols-3">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">শেষ তারিখ</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
              />
            </div>
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">নম্বর</label>
              <input
                type="number"
                min="0"
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">স্ট্যাটাস</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Assignment["status"])}
                className="w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              >
                <option value="active" className="bg-slate-800 text-slate-200">
                  চলমান
                </option>
                <option value="closed" className="bg-slate-800 text-slate-200">
                  বন্ধ
                </option>
                <option value="evaluated" className="bg-slate-800 text-slate-200">
                  মূল্যায়িত
                </option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-[10px] border border-slate-400/20 bg-slate-400/5 px-4 py-2 text-xs font-bold text-slate-400"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || !title.trim() || !dueDate}
              className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0px_4px_12px_0px_rgba(0,200,150,0.19)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} />
              {isLoading ? "সংরক্ষণ হচ্ছে..." : "অ্যাসাইনমেন্ট সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AssignmentSubmissionsModal({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) {
  const { data, isLoading } = useGetSubmissionsQuery({ assignment: assignment.id });
  const submissions = data?.results ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-[20px] border border-white/5 bg-gray-900/75 p-7 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-50">অ্যাসাইনমেন্ট জমা</h2>
            <p className="mt-1 text-xs text-slate-400">{assignment.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-slate-400">জমা তালিকা লোড হচ্ছে...</p>
          ) : submissions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-7 text-center">
              <FileText size={28} className="mx-auto text-slate-500" />
              <p className="mt-3 text-sm font-semibold text-blue-50">এখনো কেউ জমা দেয়নি</p>
            </div>
          ) : (
            submissions.map((submission) => <SubmissionCard key={submission.id} submission={submission} />)
          )}
        </div>
      </div>
    </div>
  );
}

function SubmissionCard({ submission }: { submission: Submission }) {
  const [marks, setMarks] = useState(submission.marks_obtained ?? "");
  const [comment, setComment] = useState(submission.teacher_comment ?? "");
  const [status, setStatus] = useState<Submission["status"]>(submission.status);
  const [error, setError] = useState<string | null>(null);
  const [evaluateSubmission, { isLoading }] = useEvaluateSubmissionMutation();
  const { hasPermission } = usePermissions();
  const attachments = submission.attachments ?? [];

  const handleEvaluate = async () => {
    setError(null);
    try {
      await evaluateSubmission({
        id: submission.id,
        data: {
          marks_obtained: marks || "0",
          teacher_comment: comment,
          status,
        },
      }).unwrap();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-gray-900/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-blue-50">
            {submission.student_name || submission.student_email || `শিক্ষার্থী #${submission.student}`}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            জমা: {formatDateTime(submission.submitted_at)}
            {submission.student_email ? ` • ${submission.student_email}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold outline outline-1 outline-offset-[-1px] ${getStatusClass(
            submission.status
          )}`}
        >
          {statusLabels[submission.status] ?? submission.status}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        মাধ্যম: <span className="font-semibold text-blue-50">{submission.source === "telegram" ? "Telegram" : "ওয়েবসাইট"}</span>
        {submission.original_filename ? ` • ${submission.original_filename}` : ""}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {submission.file && (
          <a
            href={submission.file}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-blue-50 hover:bg-white/5"
          >
            <FileText size={14} />
            ফাইল
          </a>
        )}
        {submission.drive_link && (
          <a
            href={submission.drive_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-blue-50 hover:bg-white/5"
          >
            <LinkIcon size={14} />
            লিংক
          </a>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {attachments.map((attachment) => (
            <SubmissionAttachmentCard attachment={attachment} key={attachment.id} />
          ))}
        </div>
      )}

      {submission.text_answer && (
        <p className="mt-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300">
          {submission.text_answer}
        </p>
      )}

      {hasPermission("can_evaluate_assignments") && (
        <div className="mt-4 grid gap-3 sm:grid-cols-[120px_160px_1fr_auto]">
          <input
            type="number"
            min="0"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            placeholder="নম্বর"
            className="rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Submission["status"])}
            className="cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
          >
            <option value="submitted" className="bg-slate-800 text-slate-200">
              জমা হয়েছে
            </option>
            <option value="evaluated" className="bg-slate-800 text-slate-200">
              মূল্যায়িত
            </option>
            <option value="late" className="bg-slate-800 text-slate-200">
              দেরিতে জমা
            </option>
            <option value="rejected" className="bg-slate-800 text-slate-200">
              বাতিল
            </option>
          </select>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="শিক্ষকের মন্তব্য"
            className="rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleEvaluate}
            disabled={isLoading}
            className="rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "সংরক্ষণ হচ্ছে..." : "মূল্যায়ন করুন"}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function formatFileSize(value: number | null | undefined) {
  if (!value) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function SubmissionAttachmentCard({ attachment }: { attachment: SubmissionAttachment }) {
  const token = useSelector((state: RootState) => state.auth.token);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attachment.is_image || !attachment.view_url || !token) return;
    let active = true;
    let objectUrl: string | null = null;

    async function loadPreview() {
      setIsLoadingPreview(true);
      setError(null);
      try {
        const response = await fetch(attachment.view_url, {
          headers: { Authorization: `Token ${token}` },
        });
        if (!response.ok) throw new Error("Preview failed");
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (active) setPreviewUrl(objectUrl);
      } catch {
        if (active) setError("প্রিভিউ আনা যায়নি");
      } finally {
        if (active) setIsLoadingPreview(false);
      }
    }

    void loadPreview();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.is_image, attachment.view_url, token]);

  const openAttachment = async (mode: "view" | "download") => {
    const url = mode === "download" ? attachment.download_url : attachment.view_url;
    if (!url || !token) return;
    setError(null);
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Token ${token}` },
      });
      if (!response.ok) throw new Error("File failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      if (mode === "download") {
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = attachment.original_filename || `attachment-${attachment.id}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
      } else {
        window.open(objectUrl, "_blank", "noopener,noreferrer");
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      }
    } catch {
      setError("ফাইল খোলা যায়নি");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-3">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
          {attachment.is_image ? <ImageIcon size={18} /> : <FileText size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-blue-50">
            {attachment.original_filename || `Attachment #${attachment.id}`}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {attachment.source === "telegram" ? "Telegram" : "ওয়েবসাইট"}
            {formatFileSize(attachment.file_size) ? ` • ${formatFileSize(attachment.file_size)}` : ""}
          </p>
        </div>
      </div>

      {attachment.is_image && (
        <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={attachment.original_filename || "Attachment"} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
              {isLoadingPreview ? "প্রিভিউ লোড হচ্ছে..." : "প্রিভিউ নেই"}
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void openAttachment("view")}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-blue-50 hover:bg-white/5"
        >
          <Eye size={14} />
          দেখুন
        </button>
        <button
          type="button"
          onClick={() => void openAttachment("download")}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-blue-50 hover:bg-white/5"
        >
          <Download size={14} />
          ডাউনলোড
        </button>
      </div>
    </div>
  );
}
