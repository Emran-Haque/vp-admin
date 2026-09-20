"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FileText,
  Pencil,
  Play,
  Plus,
  Radio,
  Trophy,
  Trash2,
} from "lucide-react";
import {
  useGetAssignmentsQuery,
  useDeleteAssignmentMutation,
  type Assignment,
} from "@/redux/api/assignmentsApi";
import {
  useGetClassesQuery,
  useDeleteClassMutation,
  useDeleteClassMaterialMutation,
  type ClassMaterial,
  type CourseClass,
} from "@/redux/api/classesApi";
import { getMediaUrl } from "@/redux/api/baseApi";
import AssignmentCard from "./assignment-card";
import ClassCard from "./class-card";
import {
  useGetCourseSubjectsQuery,
  type CourseSubject,
} from "@/redux/api/courseSubjectsApi";
import {
  useGetExamsQuery,
  useDeleteExamMutation,
  type Exam,
} from "@/redux/api/examsApi";
import { useGetCourseMaterialsQuery } from "@/redux/api/courseMaterialsApi";
import ConfirmDeleteDialog from "@/components/confirm-delete-dialog";
import { extractErrorMessage } from "@/lib/api-error";
import {
  useGetResourcesQuery,
  useDeleteResourceMutation,
  type CourseResource,
} from "@/redux/api/resourcesApi";
import AddExamModal from "./add-exam-modal";
import AddLiveClassModal from "./add-live-class-modal";
import AddRecordingModal from "./add-recording-modal";
import AddResourceModal from "./add-resource-modal";
import AddClassMaterialModal from "./add-class-material-modal";
import {
  AddAssignmentModal,
  AssignmentSubmissionsModal,
  AssignmentTelegramButton,
} from "../../includes/assignments-panel";

type SubjectTab = "lectures" | "live" | "notes" | "assignments" | "mcq";
type ModalKey = "recording" | "live" | "material" | "resource" | "assignment" | "exam" | null;
type DeleteTarget = { tab: SubjectTab; id: number; title: string };

type SubjectBundle = {
  subject: CourseSubject;
  classes: CourseClass[];
  liveClasses: CourseClass[];
  recordings: number;
  resources: CourseResource[];
  assignments: Assignment[];
  exams: Exam[];
};

type EditTarget =
  | { type: "lectures" | "live"; item: CourseClass }
  | { type: "notes"; item: CourseResource }
  | { type: "assignments"; item: Assignment };

const GENERAL_SUBJECT = "সাধারণ";

function cleanSubject(value: unknown, subjects: CourseSubject[]) {
  if (value === null || value === undefined || value === "") return GENERAL_SUBJECT;
  const raw = String(value).trim();
  const byId = subjects.find((subject) => String(subject.id) === raw);
  if (byId) return byId.name;
  return raw || GENERAL_SUBJECT;
}

function sameSubject(value: unknown, subject: CourseSubject, subjects: CourseSubject[]) {
  return cleanSubject(value, subjects) === subject.name;
}

function totalItems(bundle: SubjectBundle) {
  return (
    bundle.classes.length +
    bundle.resources.length +
    bundle.assignments.length +
    bundle.exams.length
  );
}

export default function CourseSubjectOverview({ courseId }: { courseId: number }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalKey>(null);
  const { data: subjectsData, isLoading: subjectsLoading } =
    useGetCourseSubjectsQuery({ course: courseId });
  const { data: classesData, isLoading: classesLoading } = useGetClassesQuery({
    course: courseId,
  });
  const { data: resourcesData, isLoading: resourcesLoading } =
    useGetResourcesQuery({ course: courseId });
  const { data: assignmentsData, isLoading: assignmentsLoading } =
    useGetAssignmentsQuery({ course: courseId });
  const { data: examsData, isLoading: examsLoading } = useGetExamsQuery({
    course: courseId,
  });
  const { data: materialsData, isLoading: materialsLoading } =
    useGetCourseMaterialsQuery({ course: courseId });

  const subjects = useMemo(() => subjectsData?.results ?? [], [subjectsData?.results]);
  const classes = useMemo(() => classesData?.results ?? [], [classesData?.results]);
  const resources = useMemo(
    () => resourcesData?.results ?? [],
    [resourcesData?.results],
  );
  const assignments = useMemo(
    () => assignmentsData?.results ?? [],
    [assignmentsData?.results],
  );
  // Exams linked as free-preview course materials (added in the create/edit
  // "materials" step) are course-level previews with no subject on purpose — so
  // they must not be treated as regular subject exams nor flagged as
  // "subjectless content" that needs fixing.
  const freePreviewExamIds = useMemo(
    () =>
      new Set(
        (materialsData?.results ?? [])
          .filter((material) => material.kind === "mcq" && material.quiz != null)
          .map((material) => material.quiz as number),
      ),
    [materialsData?.results],
  );
  const exams = useMemo(
    () => (examsData?.results ?? []).filter((exam) => !freePreviewExamIds.has(exam.id)),
    [examsData?.results, freePreviewExamIds],
  );
  const isLoading =
    subjectsLoading ||
    classesLoading ||
    resourcesLoading ||
    assignmentsLoading ||
    examsLoading ||
    materialsLoading;

  const selectedSubject =
    subjects.find((subject) => subject.id === selectedSubjectId) ?? subjects[0] ?? null;

  const bundles = useMemo<SubjectBundle[]>(
    () =>
      subjects.map((subject) => {
        const subjectClasses = classes.filter((item) =>
          sameSubject(item.subject, subject, subjects),
        );
        return {
          subject,
          // Every CourseClass is one lecture container. It can carry a video,
          // live settings, notes, assignments and MCQs at the same time.
          classes: subjectClasses,
          liveClasses: subjectClasses.filter((item) => item.is_live),
          recordings: subjectClasses.reduce((sum, item) => sum + item.videos.length, 0),
          resources: resources.filter((item) => sameSubject(item.subject, subject, subjects)),
          assignments: assignments.filter((item) =>
            sameSubject(item.subject ?? item.subject_name, subject, subjects),
          ),
          exams: exams.filter((item) => sameSubject(item.subject, subject, subjects)),
        };
      }),
    [assignments, classes, exams, resources, subjects],
  );

  const selectedBundle =
    bundles.find((bundle) => bundle.subject.id === selectedSubject?.id) ?? bundles[0];

  const unassignedCount = useMemo(() => {
    const unassignedClasses = classes.filter(
      (item) => cleanSubject(item.subject, subjects) === GENERAL_SUBJECT,
    );
    return (
      unassignedClasses.length +
      unassignedClasses.reduce((sum, item) => sum + item.videos.length, 0) +
      resources.filter((item) => cleanSubject(item.subject, subjects) === GENERAL_SUBJECT)
        .length +
      assignments.filter(
        (item) =>
          cleanSubject(item.subject ?? item.subject_name, subjects) === GENERAL_SUBJECT,
      ).length +
      exams.filter((item) => cleanSubject(item.subject, subjects) === GENERAL_SUBJECT)
        .length
    );
  }, [assignments, classes, exams, resources, subjects]);

  // The actual unassigned items (no subject) so admins can fix them in place.
  const unassignedItems = useMemo(() => {
    const isGen = (v: unknown) => cleanSubject(v, subjects) === GENERAL_SUBJECT;
    return {
      lectures: classes.filter((c) => !c.is_live && isGen(c.subject)),
      live: classes.filter((c) => c.is_live && isGen(c.subject)),
      notes: resources.filter((r) => isGen(r.subject)),
      assignments: assignments.filter((a) => isGen(a.subject ?? a.subject_name)),
      exams: exams.filter((e) => isGen(e.subject)),
    };
  }, [assignments, classes, exams, resources, subjects]);

  const closeModal = () => {
    setModal(null);
    setActionLecture(null);
    setEditMaterial(null);
  };

  const router = useRouter();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [actionLecture, setActionLecture] = useState<CourseClass | null>(null);
  const [editMaterial, setEditMaterial] = useState<ClassMaterial | null>(null);
  const [viewSubmissions, setViewSubmissions] = useState<Assignment | null>(null);
  const [telegramMessage, setTelegramMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteClass] = useDeleteClassMutation();
  const [deleteClassMaterial] = useDeleteClassMaterialMutation();
  const [deleteResource] = useDeleteResourceMutation();
  const [deleteAssignment] = useDeleteAssignmentMutation();
  const [deleteExam] = useDeleteExamMutation();

  const deleteTypeLabels: Record<SubjectTab, string> = {
    lectures: "লেকচার",
    live: "লাইভ ক্লাস",
    notes: "রিসোর্স",
    assignments: "অ্যাসাইনমেন্ট",
    mcq: "MCQ পরীক্ষা",
  };

  const handleDelete = (tab: SubjectTab, id: number, title: string) => {
    setDeleteError(null);
    setDeleteTarget({ tab, id, title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const { tab, id } = deleteTarget;
      if (tab === "lectures" || tab === "live") await deleteClass(id).unwrap();
      else if (tab === "notes") await deleteResource(id).unwrap();
      else if (tab === "assignments") await deleteAssignment(id).unwrap();
      else if (tab === "mcq") await deleteExam(id).unwrap();
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(extractErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
            <BookOpen size={20} />
          </span>
          <div>
            <h2 className="text-xl font-bold leading-8 text-blue-50">
              বিষয়ভিত্তিক কোর্স ম্যানেজমেন্ট
            </h2>
            <p className="text-sm text-slate-400">
              বিষয় বেছে নিয়ে সেই বিষয়ের লেকচার, লাইভ, নোট, অ্যাসাইনমেন্ট ও MCQ সাজান।
            </p>
          </div>
        </div>
        <Link
          href={`/courses/${courseId}/edit`}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-2.5 text-sm font-semibold text-blue-50 hover:bg-white/5"
        >
          <Plus size={16} />
          নতুন বিষয় যোগ করুন
        </Link>
      </div>

      {telegramMessage ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-100">
          <span>{telegramMessage}</span>
          <button
            type="button"
            onClick={() => setTelegramMessage(null)}
            className="shrink-0 rounded-lg border border-blue-400/30 px-2 py-1 font-bold text-blue-200"
          >
            বন্ধ
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <p className="mt-5 rounded-2xl border border-slate-800 bg-gray-900/40 p-6 text-center text-sm text-slate-400">
          বিষয়ভিত্তিক তথ্য লোড হচ্ছে...
        </p>
      ) : subjects.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
          আগে কোর্সে বিষয় যোগ করুন। তারপর প্রতিটি বিষয়ের অধীনে লেকচার, পরীক্ষা ও অ্যাসাইনমেন্ট সাজানো যাবে।
        </p>
      ) : (
        <>
          {/* Compact subject chips that scroll horizontally (mobile-friendly);
              the selected subject's content shows in the panel below. */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {bundles.map((bundle) => {
              const isActive = bundle.subject.id === selectedBundle?.subject.id;
              return (
                <button
                  className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] font-black transition ${
                    isActive
                      ? "border-blue-400/50 bg-blue-500/15 text-white"
                      : "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:text-white"
                  }`}
                  key={bundle.subject.id}
                  onClick={() => {
                    setSelectedSubjectId(bundle.subject.id);
                  }}
                  type="button"
                >
                  <BookOpen size={15} />
                  {bundle.subject.name}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                      isActive ? "bg-white/15 text-white" : "bg-white/[0.06] text-slate-400"
                    }`}
                  >
                    {totalItems(bundle)}
                  </span>
                </button>
              );
            })}
          </div>

          {unassignedCount > 0 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
                <div>
                  <p className="text-sm font-bold text-amber-100">
                    {unassignedCount}টি কন্টেন্টে বিষয় দেওয়া নেই
                  </p>
                  <p className="mt-1 text-xs text-amber-100/70">
                    এগুলোকে সঠিক বিষয়ের লেকচারে বা রিসোর্সে সাজিয়ে দিন।
                  </p>
                </div>
              </div>
              <Link
                href={`/courses/${courseId}/edit`}
                className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-slate-950"
              >
                বিষয় ঠিক করুন
              </Link>
            </div>
          ) : null}

          {unassignedItems.lectures.length +
            unassignedItems.live.length +
            unassignedItems.notes.length +
            unassignedItems.assignments.length +
            unassignedItems.exams.length >
          0 ? (
            <div className="mt-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-4">
              <p className="text-sm font-bold text-amber-100">
                বিষয়হীন কন্টেন্ট — এডিট করে বিষয় দিন
              </p>
              <div className="mt-3 space-y-4">
                {unassignedItems.lectures.length > 0 ? (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-400">লেকচার</p>
                    <ClassCardList
                      empty=""
                      items={unassignedItems.lectures}
                      onDelete={(item) => handleDelete("lectures", item.id, item.title)}
                      onEdit={(item) => setEditTarget({ type: "lectures", item })}
                      variant="lecture"
                    />
                  </div>
                ) : null}
                {unassignedItems.live.length > 0 ? (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-400">লাইভ ক্লাস</p>
                    <ClassCardList
                      empty=""
                      items={unassignedItems.live}
                      onDelete={(item) => handleDelete("live", item.id, item.title)}
                      onEdit={(item) => setEditTarget({ type: "live", item })}
                      variant="live"
                    />
                  </div>
                ) : null}
                {unassignedItems.notes.length > 0 ? (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-400">নোট/রিসোর্স</p>
                    <ItemList
                      empty=""
                      items={unassignedItems.notes.map((item) => ({
                        id: item.id,
                        title: item.title,
                        meta: item.resource_type,
                        onEdit: () => setEditTarget({ type: "notes", item }),
                        onDelete: () => handleDelete("notes", item.id, item.title),
                      }))}
                    />
                  </div>
                ) : null}
                {unassignedItems.assignments.length > 0 ? (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-400">অ্যাসাইনমেন্ট</p>
                    <AssignmentCardList
                      empty=""
                      items={unassignedItems.assignments}
                      onDelete={(item) => handleDelete("assignments", item.id, item.title)}
                      onEdit={(item) => setEditTarget({ type: "assignments", item })}
                      onTelegramMessage={setTelegramMessage}
                      onView={(item) => setViewSubmissions(item)}
                    />
                  </div>
                ) : null}
                {unassignedItems.exams.length > 0 ? (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-400">MCQ পরীক্ষা</p>
                    <ItemList
                      empty=""
                      items={unassignedItems.exams.map((item) => ({
                        id: item.id,
                        title: item.title,
                        meta: `${item.total_questions} প্রশ্ন`,
                        onEdit: () => router.push(`/mcq/${item.id}/edit`),
                        onDelete: () => handleDelete("mcq", item.id, item.title),
                      }))}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {selectedBundle ? (
            <div className="mt-5 rounded-2xl border border-slate-800 bg-gray-900/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-blue-300">নির্বাচিত বিষয়</p>
                  <h3 className="mt-1 text-lg font-bold text-blue-50">
                    {selectedBundle.subject.name}
                  </h3>
                  {selectedBundle.subject.description ? (
                    <p className="mt-1 text-sm text-slate-400">
                      {selectedBundle.subject.description}
                    </p>
                  ) : null}
                </div>
                <button
                  className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2 text-xs font-bold text-white"
                  onClick={() => setModal("recording")}
                  type="button"
                >
                  <Plus size={14} />
                  লেকচার যোগ করুন
                </button>
              </div>

              <LectureAdminList
                bundle={selectedBundle}
                onAddAssignment={(item) => {
                  setActionLecture(item);
                  setModal("assignment");
                }}
                onAddExam={(item) => {
                  setActionLecture(item);
                  setModal("exam");
                }}
                onAddLive={(item) => {
                  setActionLecture(item);
                  setModal("live");
                }}
                onAddMaterial={(item) => {
                  setActionLecture(item);
                  setEditMaterial(null);
                  setModal("material");
                }}
                onDeleteClass={(item) => handleDelete("lectures", item.id, item.title)}
                onDeleteAssignment={(item) => handleDelete("assignments", item.id, item.title)}
                onDeleteExam={(item) => handleDelete("mcq", item.id, item.title)}
                onDeleteMaterial={(item) => void deleteClassMaterial(item.id)}
                onEditClass={(item) => setEditTarget({ type: "lectures", item })}
                onEditMaterial={(lecture, material) => {
                  setActionLecture(lecture);
                  setEditMaterial(material);
                  setModal("material");
                }}
                onEditAssignment={(item) => setEditTarget({ type: "assignments", item })}
                onViewSubmissions={setViewSubmissions}
                onTelegramMessage={setTelegramMessage}
              />
            </div>
          ) : null}
        </>
      )}

      {modal === "recording" && selectedBundle ? (
        <AddRecordingModal
          courseId={courseId}
          initialSubjectId={selectedBundle.subject.id}
          initialSubjectName={selectedBundle.subject.name}
          onClose={closeModal}
        />
      ) : null}
      {modal === "live" && selectedBundle ? (
        <AddLiveClassModal
          courseId={courseId}
          editItem={actionLecture ?? undefined}
          initialSubjectId={selectedBundle.subject.id}
          initialSubjectName={selectedBundle.subject.name}
          onClose={closeModal}
        />
      ) : null}
      {modal === "resource" && selectedBundle ? (
        <AddResourceModal
          courseId={courseId}
          initialSubjectId={selectedBundle.subject.id}
          initialSubjectName={selectedBundle.subject.name}
          onClose={closeModal}
        />
      ) : null}
      {modal === "assignment" && selectedBundle ? (
        <AddAssignmentModal
          courseId={courseId}
          initialCourseClassId={actionLecture?.id}
          initialSubjectId={selectedBundle.subject.id}
          initialSubjectName={selectedBundle.subject.name}
          onClose={closeModal}
        />
      ) : null}
      {modal === "exam" && selectedBundle ? (
        <AddExamModal
          courseId={courseId}
          initialCourseClassId={actionLecture?.id}
          initialSubjectId={selectedBundle.subject.id}
          initialSubjectName={selectedBundle.subject.name}
          onClose={closeModal}
        />
      ) : null}

      {/* Edit modals — reuse the add modals in edit mode. */}
      {editTarget?.type === "lectures" ? (
        <AddRecordingModal
          courseId={courseId}
          editItem={editTarget.item}
          onClose={() => setEditTarget(null)}
        />
      ) : null}
      {editTarget?.type === "live" ? (
        <AddLiveClassModal
          courseId={courseId}
          editItem={editTarget.item}
          onClose={() => setEditTarget(null)}
        />
      ) : null}
      {editTarget?.type === "notes" ? (
        <AddResourceModal
          courseId={courseId}
          editItem={editTarget.item}
          onClose={() => setEditTarget(null)}
        />
      ) : null}
      {editTarget?.type === "assignments" ? (
        <AddAssignmentModal
          courseId={courseId}
          editItem={editTarget.item}
          onClose={() => setEditTarget(null)}
        />
      ) : null}

      {viewSubmissions ? (
        <AssignmentSubmissionsModal
          assignment={viewSubmissions}
          onClose={() => setViewSubmissions(null)}
        />
      ) : null}
      {modal === "material" && actionLecture ? (
        <AddClassMaterialModal
          courseClass={actionLecture}
          editItem={editMaterial ?? undefined}
          onClose={closeModal}
        />
      ) : null}

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        itemType={deleteTarget ? deleteTypeLabels[deleteTarget.tab] : "কন্টেন্ট"}
        itemName={deleteTarget?.title || ""}
        impact="এটি মুছে ফেললে সংশ্লিষ্ট ভিডিও, ম্যাটেরিয়াল এবং শিক্ষার্থীদের অ্যাক্সেসও প্রভাবিত হতে পারে।"
        error={deleteError}
        isLoading={isDeleting}
        onClose={() => {
          if (isDeleting) return;
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={confirmDelete}
      />
    </section>
  );
}

function LectureAdminList({
  bundle,
  onAddAssignment,
  onAddExam,
  onAddLive,
  onAddMaterial,
  onDeleteAssignment,
  onDeleteClass,
  onDeleteExam,
  onDeleteMaterial,
  onEditAssignment,
  onEditClass,
  onEditMaterial,
  onTelegramMessage,
  onViewSubmissions,
}: {
  bundle: SubjectBundle;
  onAddAssignment: (item: CourseClass) => void;
  onAddExam: (item: CourseClass) => void;
  onAddLive: (item: CourseClass) => void;
  onAddMaterial: (item: CourseClass) => void;
  onDeleteAssignment: (item: Assignment) => void;
  onDeleteClass: (item: CourseClass) => void;
  onDeleteExam: (item: Exam) => void;
  onDeleteMaterial: (item: ClassMaterial) => void;
  onEditAssignment: (item: Assignment) => void;
  onEditClass: (item: CourseClass) => void;
  onEditMaterial: (lecture: CourseClass, item: ClassMaterial) => void;
  onTelegramMessage: (message: string | null) => void;
  onViewSubmissions: (item: Assignment) => void;
}) {
  const router = useRouter();
  const unlinkedAssignments = bundle.assignments.filter((item) => !item.course_class);
  const unlinkedExams = bundle.exams.filter((item) => !item.course_class);
  const hasLegacy =
    bundle.resources.length > 0 || unlinkedAssignments.length > 0 || unlinkedExams.length > 0;

  return (
    <div className="mt-4 space-y-3">
      {bundle.classes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
          এই বিষয়ে এখনো কোনো লেকচার নেই। প্রথমে একটি লেকচার যোগ করুন।
        </p>
      ) : (
        bundle.classes.map((lecture) => (
          <AdminLectureCard
            assignments={bundle.assignments.filter(
              (item) => item.course_class === lecture.id,
            )}
            exams={bundle.exams.filter((item) => item.course_class === lecture.id)}
            key={lecture.id}
            lecture={lecture}
            onAddAssignment={() => onAddAssignment(lecture)}
            onAddExam={() => onAddExam(lecture)}
            onAddLive={() => onAddLive(lecture)}
            onAddMaterial={() => onAddMaterial(lecture)}
            onDeleteAssignment={onDeleteAssignment}
            onDeleteClass={() => onDeleteClass(lecture)}
            onDeleteExam={onDeleteExam}
            onDeleteMaterial={onDeleteMaterial}
            onEditAssignment={onEditAssignment}
            onEditClass={() => onEditClass(lecture)}
            onEditMaterial={(material) => onEditMaterial(lecture, material)}
            onTelegramMessage={onTelegramMessage}
            onViewSubmissions={onViewSubmissions}
            subjectName={bundle.subject.name}
          />
        ))
      )}

      {hasLegacy ? (
        <details className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04]">
          <summary className="cursor-pointer list-none p-4 text-sm font-bold text-amber-100">অন্যান্য কন্টেন্ট (লেকচারে যুক্ত নয়)</summary>
          <div className="space-y-4 border-t border-amber-500/20 p-4">
            <ItemList empty="" items={bundle.resources.map((item) => ({ id: item.id, title: item.title, meta: item.resource_type }))} />
            <AssignmentCardList empty="" items={unlinkedAssignments} onDelete={onDeleteAssignment} onEdit={onEditAssignment} onTelegramMessage={onTelegramMessage} onView={onViewSubmissions} />
            <ItemList empty="" items={unlinkedExams.map((exam) => ({ id: exam.id, title: exam.title, meta: `${exam.total_questions} প্রশ্ন`, onEdit: () => router.push(`/mcq/${exam.id}/edit`), onDelete: () => onDeleteExam(exam) }))} />
          </div>
        </details>
      ) : null}
    </div>
  );
}

type AdminLectureModal = "live" | "notes" | "assignments" | "mcq" | "results" | null;

type AdminVideoSource = {
  title: string;
  url: string;
  sourceType?: string;
  isLive?: boolean;
};

function AdminLectureCard({
  assignments,
  exams,
  lecture,
  onAddAssignment,
  onAddExam,
  onAddLive,
  onAddMaterial,
  onDeleteAssignment,
  onDeleteClass,
  onDeleteExam,
  onDeleteMaterial,
  onEditAssignment,
  onEditClass,
  onEditMaterial,
  onTelegramMessage,
  onViewSubmissions,
  subjectName,
}: {
  assignments: Assignment[];
  exams: Exam[];
  lecture: CourseClass;
  onAddAssignment: () => void;
  onAddExam: () => void;
  onAddLive: () => void;
  onAddMaterial: () => void;
  onDeleteAssignment: (item: Assignment) => void;
  onDeleteClass: () => void;
  onDeleteExam: (item: Exam) => void;
  onDeleteMaterial: (item: ClassMaterial) => void;
  onEditAssignment: (item: Assignment) => void;
  onEditClass: () => void;
  onEditMaterial: (item: ClassMaterial) => void;
  onTelegramMessage: (message: string | null) => void;
  onViewSubmissions: (item: Assignment) => void;
  subjectName: string;
}) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<AdminLectureModal>(null);
  const [activeVideo, setActiveVideo] = useState<AdminVideoSource | null>(null);
  const firstVideo = lecture.videos[0];
  const poster =
    getMediaUrl(firstVideo?.thumbnail ?? null) ?? getMediaUrl(lecture.thumbnail);
  const publishedResults = exams.filter(
    (exam) => exam.result_status === "published" || exam.is_result_published,
  ).length;
  const chips = [
    { key: "live" as const, label: "লাইভ", icon: Radio, count: lecture.is_live ? 1 : 0 },
    {
      key: "notes" as const,
      label: "নোট",
      icon: FileText,
      count: lecture.class_materials.length,
    },
    {
      key: "assignments" as const,
      label: "অ্যাসাইনমেন্ট",
      icon: ClipboardList,
      count: assignments.length,
    },
    { key: "mcq" as const, label: "MCQ", icon: ClipboardCheck, count: exams.length },
    {
      key: "results" as const,
      label: "ফলাফল",
      icon: Trophy,
      count: publishedResults,
    },
  ];

  const closeThen = (action: () => void) => {
    setActiveModal(null);
    action();
  };

  const openLectureVideo = () => {
    if (!firstVideo?.video_url) return;
    setActiveVideo({
      title: firstVideo.title || lecture.title,
      url: firstVideo.video_url,
      sourceType: firstVideo.source_type,
    });
  };

  return (
    <>
      <article className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/30 p-3 max-[720px]:p-2.5">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400" />

        <div className="flex items-stretch gap-4 max-[720px]:grid max-[720px]:grid-cols-[132px_minmax(0,1fr)] max-[720px]:gap-2.5 max-[380px]:grid-cols-[112px_minmax(0,1fr)]">
          <button
            aria-label={`${lecture.title} ভিডিও দেখুন`}
            className="relative aspect-video w-[176px] shrink-0 self-center overflow-hidden rounded-[12px] bg-black max-[720px]:w-full"
            disabled={!firstVideo?.video_url}
            onClick={openLectureVideo}
            type="button"
          >
            {poster ? (
              <Image
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-90"
                height={275}
                src={poster}
                unoptimized
                width={440}
              />
            ) : null}
            <span className="absolute inset-0 bg-black/30" />
            <span className="absolute inset-0 grid place-items-center">
              <span
                className={`grid size-12 place-items-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-sm transition max-[720px]:size-9 ${
                  firstVideo?.video_url ? "hover:scale-105 hover:bg-white/25" : "opacity-50"
                }`}
              >
                <Play fill="currentColor" size={22} />
              </span>
            </span>
          </button>

          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-[8px] border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-black text-blue-300 max-[720px]:px-2 max-[720px]:py-0.5 max-[720px]:text-[9px]">
                {subjectName}
              </span>
              {lecture.is_live ? (
                <span className="rounded-[8px] border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-black text-red-400 max-[720px]:px-2 max-[720px]:py-0.5 max-[720px]:text-[9px]">
                  লাইভ যুক্ত
                </span>
              ) : null}
            </div>
            <h4 className="mt-2 truncate text-[16px] font-black leading-snug text-blue-50 max-[720px]:mt-1.5 max-[720px]:line-clamp-2 max-[720px]:whitespace-normal max-[720px]:text-[13px]">
              {lecture.title}
            </h4>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-slate-400 max-[720px]:mt-1.5 max-[720px]:gap-x-2 max-[720px]:gap-y-0.5 max-[720px]:text-[9px]">
              {lecture.class_date ? <span>📅 {lecture.class_date}</span> : null}
              {lecture.start_time ? <span>🕐 {lecture.start_time.slice(0, 5)}</span> : null}
              <span>🎬 {lecture.videos.length}টি ভিডিও</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 max-[720px]:col-span-2 max-[720px]:justify-end">
            <button
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[12px] border border-slate-700 bg-white/[0.03] px-4 text-[13px] font-bold text-blue-50 hover:bg-white/[0.07] max-[720px]:h-8 max-[720px]:px-3 max-[720px]:text-[10px]"
              onClick={onEditClass}
              type="button"
            >
              <Pencil size={14} />
              লেকচার এডিট
            </button>
            <button
              aria-label={`${lecture.title} মুছুন`}
              className="inline-flex size-10 items-center justify-center rounded-[12px] border border-red-600/40 bg-red-600/10 text-red-500 hover:bg-red-600/20 max-[720px]:size-8"
              onClick={onDeleteClass}
              type="button"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-5 gap-2 border-t border-white/[0.06] pt-3 max-[720px]:mt-2.5 max-[720px]:grid-cols-3 max-[720px]:gap-1.5 max-[720px]:pt-2.5">
          {chips.map(({ count, icon: Icon, key, label }) => (
            <button
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[11px] border border-white/[0.08] bg-white/[0.035] px-2.5 py-2 text-[11px] font-black text-white/70 transition hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-white max-[720px]:min-h-9 max-[720px]:gap-1 max-[720px]:px-1 max-[720px]:py-1.5 max-[720px]:text-[9px]"
              key={key}
              onClick={() => setActiveModal(key)}
              type="button"
            >
              <Icon className="shrink-0 text-blue-300 max-[720px]:size-[11px]" size={14} />
              {label}
              <span className="rounded-full bg-white/[0.07] px-1.5 py-0.5 text-[9px] text-white/55 max-[720px]:px-1 max-[720px]:text-[8px]">
                {count}
              </span>
            </button>
          ))}
        </div>
      </article>

      {activeModal ? (
        <AdminLectureContentModal
          onClose={() => setActiveModal(null)}
          title={`${lecture.title} · ${chips.find((chip) => chip.key === activeModal)?.label ?? ""}`}
        >
          {activeModal === "live" ? (
            <div className="space-y-4">
              <ModalActionBar
                label={lecture.is_live ? "লাইভ ক্লাস এডিট করুন" : "লাইভ ক্লাস যোগ করুন"}
                onClick={() => closeThen(onAddLive)}
              />
              {lecture.is_live ? (
                <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
                  <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
                      <Radio size={19} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-white">{lecture.title}</p>
                      <p className="mt-1 truncate text-xs text-emerald-100/65">
                        {lecture.live_url || "লাইভ ক্লাস কনফিগার করা হয়েছে"}
                      </p>
                    </div>
                    {lecture.live_url ? (
                      <button
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-xs font-black text-white"
                        onClick={() =>
                          setActiveVideo({
                            isLive: true,
                            title: lecture.title,
                            url: lecture.live_url,
                          })
                        }
                        type="button"
                      >
                        <Play fill="currentColor" size={14} />
                        লাইভ দেখুন
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <AdminEmpty text="লাইভ ক্লাস কনফিগার করা হয়নি" />
              )}
            </div>
          ) : null}

          {activeModal === "notes" ? (
            <div className="space-y-4">
              <ModalActionBar label="নোট যোগ করুন" onClick={() => closeThen(onAddMaterial)} />
              {lecture.class_materials.length > 0 ? (
                <div className="space-y-2">
                  {lecture.class_materials.map((material) => (
                    <div
                      className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3"
                      key={material.id}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-500/10 text-blue-300">
                        <FileText size={15} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-200">
                        {material.title}
                      </span>
                      <button
                        className="text-xs font-bold text-blue-300"
                        onClick={() => closeThen(() => onEditMaterial(material))}
                        type="button"
                      >
                        এডিট
                      </button>
                      <button
                        aria-label={`${material.title} মুছুন`}
                        className="text-red-400"
                        onClick={() => {
                          if (window.confirm(`“${material.title}” মুছে ফেলবেন?`)) {
                            onDeleteMaterial(material);
                          }
                        }}
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <AdminEmpty text="নোট বা ম্যাটেরিয়াল যোগ করা হয়নি" />
              )}
            </div>
          ) : null}

          {activeModal === "assignments" ? (
            <div className="space-y-4">
              <ModalActionBar
                label="অ্যাসাইনমেন্ট যোগ করুন"
                onClick={() => closeThen(onAddAssignment)}
              />
              <AssignmentCardList
                empty="অ্যাসাইনমেন্ট যোগ করা হয়নি"
                items={assignments}
                onDelete={onDeleteAssignment}
                onEdit={(item) => closeThen(() => onEditAssignment(item))}
                onTelegramMessage={onTelegramMessage}
                onView={(item) => closeThen(() => onViewSubmissions(item))}
              />
            </div>
          ) : null}

          {activeModal === "mcq" ? (
            <div className="space-y-4">
              <ModalActionBar label="MCQ যোগ করুন" onClick={() => closeThen(onAddExam)} />
              <ItemList
                empty="MCQ যোগ করা হয়নি"
                items={exams.map((exam) => ({
                  id: exam.id,
                  title: exam.title,
                  meta: `${exam.total_questions} প্রশ্ন · ${exam.status}`,
                  onEdit: () => router.push(`/mcq/${exam.id}/edit`),
                  onDelete: () => onDeleteExam(exam),
                }))}
              />
            </div>
          ) : null}

          {activeModal === "results" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 max-[680px]:grid-cols-1">
                <ResultStat label="মোট MCQ" value={exams.length} />
                <ResultStat label="প্রকাশিত ফলাফল" value={publishedResults} />
                <ResultStat label="অপ্রকাশিত" value={Math.max(exams.length - publishedResults, 0)} />
              </div>
              <ItemList
                empty="এই লেকচারে কোনো MCQ ফলাফল নেই"
                items={exams.map((exam) => ({
                  id: exam.id,
                  title: exam.title,
                  meta: `ফলাফল: ${exam.result_status} · ${exam.total_questions} প্রশ্ন`,
                  onEdit: () => router.push(`/mcq/${exam.id}/edit`),
                }))}
              />
            </div>
          ) : null}
        </AdminLectureContentModal>
      ) : null}

      <AdminVideoModal onClose={() => setActiveVideo(null)} video={activeVideo} />
    </>
  );
}

function ModalActionBar({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-blue-500 px-4 text-xs font-black text-white hover:bg-blue-400"
        onClick={onClick}
        type="button"
      >
        <Plus size={14} />
        {label}
      </button>
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/[0.045] p-4">
      <p className="text-xs font-bold text-emerald-100/65">{label}</p>
      <strong className="mt-2 block text-2xl font-black text-white">{value}</strong>
    </div>
  );
}

function AdminLectureContentModal({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      aria-label={title}
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm max-[640px]:p-0"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="flex max-h-[88vh] w-full max-w-[960px] flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[#0b0f17] shadow-2xl max-[640px]:h-full max-[640px]:max-h-none max-[640px]:rounded-none"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3.5">
          <h3 className="min-w-0 flex-1 truncate text-[15px] font-black text-white">
            {title}
          </h3>
          <button
            aria-label="বন্ধ করুন"
            className="grid size-9 place-items-center rounded-[10px] border border-white/10 bg-white/[0.05] text-xl text-white/75 hover:bg-red-500/15 hover:text-red-300"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

function AdminVideoModal({
  onClose,
  video,
}: {
  onClose: () => void;
  video: AdminVideoSource | null;
}) {
  useEffect(() => {
    if (!video) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, video]);

  if (!video || typeof document === "undefined") return null;
  const embed = adminVideoEmbed(video.url, video.sourceType);

  return createPortal(
    <div
      aria-label={video.title}
      aria-modal="true"
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm max-[640px]:p-0"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="flex w-full max-w-[960px] flex-col overflow-hidden rounded-[16px] border border-white/10 bg-[#0b0f17] shadow-2xl max-[640px]:h-full max-[640px]:rounded-none"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          {video.isLive ? (
            <span className="rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-black text-white">
              LIVE
            </span>
          ) : null}
          <h3 className="min-w-0 flex-1 truncate text-sm font-black text-white">
            {video.title}
          </h3>
          <button
            aria-label="বন্ধ করুন"
            className="grid size-9 place-items-center rounded-[10px] border border-white/10 bg-white/[0.05] text-xl text-white/75"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>
        <div className="relative aspect-video w-full bg-black max-[640px]:flex-1">
          {embed.kind === "iframe" ? (
            <iframe
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
              src={embed.src}
              title={video.title}
            />
          ) : embed.kind === "video" ? (
            <video
              autoPlay
              className="absolute inset-0 h-full w-full"
              controls
              playsInline
              src={embed.src}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div>
                <p className="text-sm font-bold text-white/80">
                  এই ভিডিওটি এখানে চালানো যাচ্ছে না।
                </p>
                <a
                  className="mt-3 inline-flex rounded-[10px] bg-blue-500 px-4 py-2.5 text-[13px] font-black text-white no-underline"
                  href={embed.src}
                  rel="noreferrer"
                  target="_blank"
                >
                  নতুন ট্যাবে খুলুন ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function adminVideoEmbed(url: string, sourceType = "") {
  const value = url.trim();
  const hint = sourceType.toLowerCase();
  if (hint === "facebook" || /facebook\.com|fb\.watch/i.test(value)) {
    return {
      kind: "iframe" as const,
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(value)}&show_text=false&autoplay=true`,
    };
  }
  const driveMatch = value.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ?? value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if ((hint === "drive" || /drive\.google\.com/i.test(value)) && driveMatch) {
    return {
      kind: "iframe" as const,
      src: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
    };
  }
  const vimeoMatch = value.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if ((hint === "vimeo" || /vimeo\.com/i.test(value)) && vimeoMatch) {
    return {
      kind: "iframe" as const,
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
    };
  }
  const youtubeMatch = value.match(
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/(?:embed|live|shorts)\/)([a-zA-Z0-9_-]{11})/,
  );
  const youtubeId = /^[a-zA-Z0-9_-]{11}$/.test(value) ? value : youtubeMatch?.[1];
  if (youtubeId) {
    return {
      kind: "iframe" as const,
      src: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`,
    };
  }
  if (/\.(mp4|webm|ogg|mov|m3u8)(\?.*)?$/i.test(value)) {
    return { kind: "video" as const, src: value };
  }
  return { kind: "unsupported" as const, src: value };
}

function AdminEmpty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-slate-800 p-3 text-xs text-slate-500">{text}</p>;
}


/**
 * Lecture / live-class list, rendered as the cards a student would see.
 *
 * Kept separate from `ItemList` because these two rows carry a poster, a play
 * target and video metadata that notes, assignments and exams have no use for.
 */
function ClassCardList({
  empty,
  items,
  variant,
  onEdit,
  onDelete,
}: {
  empty: string;
  items: CourseClass[];
  variant: "lecture" | "live";
  onEdit: (item: CourseClass) => void;
  onDelete: (item: CourseClass) => void;
}) {
  if (items.length === 0) {
    return empty ? (
      <p className="mt-4 rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
        {empty}
      </p>
    ) : null;
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {items.map((item) => (
        <ClassCard
          item={item}
          key={item.id}
          onDelete={() => onDelete(item)}
          onEdit={() => onEdit(item)}
          subjectLabel={variant === "live" ? "লাইভ ক্লাস" : "লেকচার"}
          variant={variant}
        />
      ))}
    </div>
  );
}

/** Assignment list, rendered as scannable cards rather than one-line rows. */
function AssignmentCardList({
  empty,
  items,
  onView,
  onEdit,
  onDelete,
  onTelegramMessage,
}: {
  empty: string;
  items: Assignment[];
  onView: (item: Assignment) => void;
  onEdit: (item: Assignment) => void;
  onDelete: (item: Assignment) => void;
  onTelegramMessage: (message: string | null) => void;
}) {
  if (items.length === 0) {
    return empty ? (
      <p className="mt-4 rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
        {empty}
      </p>
    ) : null;
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {items.map((item) => (
        <AssignmentCard
          item={item}
          key={item.id}
          onDelete={() => onDelete(item)}
          onEdit={() => onEdit(item)}
          onTelegramMessage={onTelegramMessage}
          onView={() => onView(item)}
        />
      ))}
    </div>
  );
}

type ListItem = {
  id: number;
  title: string;
  meta: string;
  href?: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  telegramAssignmentId?: number;
};

function ItemList({
  empty,
  items,
  onTelegramMessage,
}: {
  empty: string;
  items: ListItem[];
  onTelegramMessage?: (message: string | null) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="mt-4 rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
        {empty}
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2.5">
      {items.map((item) => {
        const body = (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-blue-50">{item.title}</p>
            <p className="mt-1 text-xs text-slate-400">{item.meta}</p>
          </div>
        );
        const actions =
          item.onView ||
          item.onEdit ||
          item.onDelete ||
          item.telegramAssignmentId ? (
            <div className="flex shrink-0 items-center gap-2">
              {item.telegramAssignmentId ? (
                <AssignmentTelegramButton
                  assignmentId={item.telegramAssignmentId}
                  onMessage={onTelegramMessage ?? (() => {})}
                />
              ) : null}
              {item.onView ? (
                <button
                  type="button"
                  onClick={item.onView}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-blue-50 hover:bg-white/5"
                >
                  <Eye size={13} />
                  জমা দেখা
                </button>
              ) : null}
              {item.onEdit ? (
                <button
                  type="button"
                  onClick={item.onEdit}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-blue-50 hover:bg-white/5"
                >
                  <Pencil size={13} />
                  এডিট
                </button>
              ) : null}
              {item.onDelete ? (
                <button
                  type="button"
                  onClick={item.onDelete}
                  className="flex size-8 items-center justify-center rounded-lg border border-red-600/40 bg-red-600/10 text-red-500 hover:bg-red-600/20"
                >
                  <Trash2 size={14} />
                </button>
              ) : null}
            </div>
          ) : null;

        return item.href ? (
          <Link
            className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/25 p-4 no-underline hover:bg-white/5"
            href={item.href}
            key={item.id}
          >
            {body}
          </Link>
        ) : (
          <div
            className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/25 p-4"
            key={item.id}
          >
            {body}
            {actions}
          </div>
        );
      })}
    </div>
  );
}

