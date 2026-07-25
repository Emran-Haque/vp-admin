"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  Eye,
  FileText,
  Link as LinkIcon,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  useCreateAssignmentMutation,
  useDeleteAssignmentMutation,
  useEvaluateSubmissionMutation,
  useGetAssignmentsQuery,
  useGetSubmissionsQuery,
  type Assignment,
  type Submission,
} from "@/redux/api/assignmentsApi";
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
  active: "Active",
  closed: "Closed",
  evaluated: "Evaluated",
  submitted: "Submitted",
  late: "Late",
  rejected: "Rejected",
};

function formatDateTime(value: string) {
  if (!value) return "No deadline";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
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
  const { data, isLoading } = useGetAssignmentsQuery({ course: courseId });
  const [deleteAssignment] = useDeleteAssignmentMutation();
  const { hasPermission } = usePermissions();

  const assignments = data?.results ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-blue-50">Assignments</h3>
          <p className="mt-1 text-xs text-slate-400">
            {assignments.length} assignment{assignments.length === 1 ? "" : "s"} added for this course
          </p>
        </div>
        {hasPermission("can_manage_assignments") && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            Add Assignment
          </button>
        )}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-400">Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-7 text-center">
            <ClipboardList size={28} className="mx-auto text-slate-500" />
            <p className="mt-3 text-sm font-semibold text-blue-50">No assignments yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Add class based assignments here so students can view and submit them.
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
                      {assignment.course_class_title || "All classes"}
                      {assignment.subject_name ? ` • ${assignment.subject_name}` : ""}
                      {" • "}
                      Due {formatDateTime(assignment.due_date)}
                      {" • "}
                      {assignment.max_marks} marks
                    </p>
                    {assignment.description && (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-400">{assignment.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {hasPermission("can_manage_assignments") && (
                      <button
                        type="button"
                        onClick={() => setSelectedAssignment(assignment)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-blue-50 hover:bg-white/5"
                      >
                        <Eye size={14} />
                        Submissions
                      </button>
                    )}
                    {hasPermission("can_manage_assignments") && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete "${assignment.title}"?`)) deleteAssignment(assignment.id);
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

function AddAssignmentModal({ courseId, onClose }: { courseId: number; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseClassId, setCourseClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [status, setStatus] = useState<Assignment["status"]>("active");
  const [error, setError] = useState<string | null>(null);

  const { data: classesData } = useGetClassesQuery({ course: courseId });
  const { data: subjectsData } = useGetCourseSubjectsQuery({ course: courseId });
  const [createAssignment, { isLoading }] = useCreateAssignmentMutation();

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
      await createAssignment({
        course: courseId,
        course_class: courseClassId ? Number(courseClassId) : null,
        subject: subjectId ? Number(subjectId) : null,
        title,
        description,
        due_date: dueDate,
        max_marks: maxMarks || "0",
        status,
      }).unwrap();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="max-h-[92vh] w-full max-w-[640px] overflow-y-auto rounded-[20px] border border-white/5 bg-gray-900/75 p-7 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-50">Add Assignment</h2>
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

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">Assignment title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Example: Chapter 1 Assignment"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Write assignment instructions"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">Class</label>
              <select
                value={courseClassId}
                onChange={(e) => {
                  setCourseClassId(e.target.value);
                  setSubjectId("");
                }}
                className="w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              >
                <option value="" className="bg-slate-800 text-slate-200">
                  All classes / no class
                </option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id} className="bg-slate-800 text-slate-200">
                    {item.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              >
                <option value="" className="bg-slate-800 text-slate-200">
                  No subject
                </option>
                {subjectOptions.map((subject) => (
                  <option key={subject.id} value={subject.id} className="bg-slate-800 text-slate-200">
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-3">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">Due date</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
              />
            </div>
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">Marks</label>
              <input
                type="number"
                min="0"
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Assignment["status"])}
                className="w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              >
                <option value="active" className="bg-slate-800 text-slate-200">
                  Active
                </option>
                <option value="closed" className="bg-slate-800 text-slate-200">
                  Closed
                </option>
                <option value="evaluated" className="bg-slate-800 text-slate-200">
                  Evaluated
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
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || !title.trim() || !dueDate}
              className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0px_4px_12px_0px_rgba(0,200,150,0.19)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} />
              {isLoading ? "Saving..." : "Save Assignment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignmentSubmissionsModal({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) {
  const { data, isLoading } = useGetSubmissionsQuery({ assignment: assignment.id });
  const submissions = data?.results ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-[20px] border border-white/5 bg-gray-900/75 p-7 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-50">Assignment Submissions</h2>
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
            <p className="py-10 text-center text-sm text-slate-400">Loading submissions...</p>
          ) : submissions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-7 text-center">
              <FileText size={28} className="mx-auto text-slate-500" />
              <p className="mt-3 text-sm font-semibold text-blue-50">No submissions yet</p>
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
            {submission.student_name || submission.student_email || `Student #${submission.student}`}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Submitted {formatDateTime(submission.submitted_at)}
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

      <div className="mt-3 flex flex-wrap gap-2">
        {submission.file && (
          <a
            href={submission.file}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-blue-50 hover:bg-white/5"
          >
            <FileText size={14} />
            File
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
            Link
          </a>
        )}
      </div>

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
            placeholder="Marks"
            className="rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Submission["status"])}
            className="cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
          >
            <option value="submitted" className="bg-slate-800 text-slate-200">
              Submitted
            </option>
            <option value="evaluated" className="bg-slate-800 text-slate-200">
              Evaluated
            </option>
            <option value="late" className="bg-slate-800 text-slate-200">
              Late
            </option>
            <option value="rejected" className="bg-slate-800 text-slate-200">
              Rejected
            </option>
          </select>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Teacher comment"
            className="rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleEvaluate}
            disabled={isLoading}
            className="rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Evaluate"}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
