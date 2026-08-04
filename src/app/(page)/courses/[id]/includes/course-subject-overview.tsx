"use client";

import { useMemo, useState } from "react";
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
  Plus,
  Radio,
  Trash2,
  Video,
  type LucideIcon,
} from "lucide-react";
import {
  useGetAssignmentsQuery,
  useDeleteAssignmentMutation,
  type Assignment,
} from "@/redux/api/assignmentsApi";
import {
  useGetClassesQuery,
  useDeleteClassMutation,
  type CourseClass,
} from "@/redux/api/classesApi";
import {
  useGetCourseSubjectsQuery,
  type CourseSubject,
} from "@/redux/api/courseSubjectsApi";
import {
  useGetExamsQuery,
  useDeleteExamMutation,
  type Exam,
} from "@/redux/api/examsApi";
import {
  useGetResourcesQuery,
  useDeleteResourceMutation,
  type CourseResource,
} from "@/redux/api/resourcesApi";
import AddExamModal from "./add-exam-modal";
import AddLiveClassModal from "./add-live-class-modal";
import AddRecordingModal from "./add-recording-modal";
import AddResourceModal from "./add-resource-modal";
import {
  AddAssignmentModal,
  AssignmentSubmissionsModal,
} from "../../includes/assignments-panel";

type SubjectTab = "lectures" | "live" | "notes" | "assignments" | "mcq";
type ModalKey = "recording" | "live" | "resource" | "assignment" | "exam" | null;

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

const tabs: { key: SubjectTab; label: string; icon: LucideIcon }[] = [
  { key: "lectures", label: "লেকচার", icon: Video },
  { key: "live", label: "লাইভ", icon: Radio },
  { key: "notes", label: "নোট/ম্যাটেরিয়াল", icon: FileText },
  { key: "assignments", label: "অ্যাসাইনমেন্ট", icon: ClipboardList },
  { key: "mcq", label: "MCQ", icon: ClipboardCheck },
];

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
    bundle.recordings +
    bundle.resources.length +
    bundle.assignments.length +
    bundle.exams.length
  );
}

export default function CourseSubjectOverview({ courseId }: { courseId: number }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<SubjectTab>("lectures");
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
  const exams = useMemo(() => examsData?.results ?? [], [examsData?.results]);
  const isLoading =
    subjectsLoading ||
    classesLoading ||
    resourcesLoading ||
    assignmentsLoading ||
    examsLoading;

  const selectedSubject =
    subjects.find((subject) => subject.id === selectedSubjectId) ?? subjects[0] ?? null;

  const bundles = useMemo<SubjectBundle[]>(
    () =>
      subjects.map((subject) => {
        const subjectClasses = classes.filter((item) =>
          sameSubject(item.subject, subject, subjects),
        );
        const recordedClasses = subjectClasses.filter((item) => !item.is_live);
        return {
          subject,
          // Lectures are recorded (non-live) classes only; live classes live in
          // their own tab so they don't double-show in the lecture list.
          classes: recordedClasses,
          liveClasses: subjectClasses.filter((item) => item.is_live),
          recordings: recordedClasses.reduce((sum, item) => sum + item.videos.length, 0),
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

  const closeModal = () => setModal(null);

  const router = useRouter();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [viewSubmissions, setViewSubmissions] = useState<Assignment | null>(null);
  const [deleteClass] = useDeleteClassMutation();
  const [deleteResource] = useDeleteResourceMutation();
  const [deleteAssignment] = useDeleteAssignmentMutation();
  const [deleteExam] = useDeleteExamMutation();

  const handleDelete = (tab: SubjectTab, id: number, title: string) => {
    if (!confirm(`"${title}" মুছে ফেলতে চান?`)) return;
    if (tab === "lectures" || tab === "live") deleteClass(id);
    else if (tab === "notes") deleteResource(id);
    else if (tab === "assignments") deleteAssignment(id);
    else if (tab === "mcq") deleteExam(id);
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
          <div className="mt-5 grid gap-3 xl:grid-cols-3 md:grid-cols-2">
            {bundles.map((bundle) => (
              <SubjectCard
                bundle={bundle}
                isActive={bundle.subject.id === selectedBundle?.subject.id}
                key={bundle.subject.id}
                onSelect={() => {
                  setSelectedSubjectId(bundle.subject.id);
                  setActiveTab("lectures");
                }}
              />
            ))}
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
                বিষয়হীন কন্টেন্ট — সম্পাদনা করে বিষয় দিন
              </p>
              <div className="mt-3 space-y-4">
                {unassignedItems.lectures.length > 0 ? (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-400">লেকচার</p>
                    <ItemList
                      empty=""
                      items={unassignedItems.lectures.map((item) => ({
                        id: item.id,
                        title: item.title,
                        meta: `${item.videos.length}টি ভিডিও`,
                        onEdit: () => setEditTarget({ type: "lectures", item }),
                        onDelete: () => handleDelete("lectures", item.id, item.title),
                      }))}
                    />
                  </div>
                ) : null}
                {unassignedItems.live.length > 0 ? (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-400">লাইভ ক্লাস</p>
                    <ItemList
                      empty=""
                      items={unassignedItems.live.map((item) => ({
                        id: item.id,
                        title: item.title,
                        meta: item.class_date || "—",
                        onEdit: () => setEditTarget({ type: "live", item }),
                        onDelete: () => handleDelete("live", item.id, item.title),
                      }))}
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
                    <ItemList
                      empty=""
                      items={unassignedItems.assignments.map((item) => ({
                        id: item.id,
                        title: item.title,
                        meta: `${item.max_marks} নম্বর`,
                        onView: () => setViewSubmissions(item),
                        onEdit: () => setEditTarget({ type: "assignments", item }),
                        onDelete: () => handleDelete("assignments", item.id, item.title),
                      }))}
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
                <SubjectActions activeTab={activeTab} onOpen={setModal} />
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {tabs.map(({ icon: Icon, key, label }) => {
                  const active = activeTab === key;
                  return (
                    <button
                      className={`flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-xs font-bold ${
                        active
                          ? "border-blue-500 bg-blue-500/15 text-blue-50"
                          : "border-slate-800 bg-slate-950/30 text-slate-400 hover:text-blue-50"
                      }`}
                      key={key}
                      onClick={() => setActiveTab(key)}
                      type="button"
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  );
                })}
              </div>

              <SubjectTabContent
                activeTab={activeTab}
                bundle={selectedBundle}
                courseId={courseId}
                onEdit={setEditTarget}
                onDelete={handleDelete}
                onViewSubmissions={setViewSubmissions}
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
          initialSubjectId={selectedBundle.subject.id}
          initialSubjectName={selectedBundle.subject.name}
          onClose={closeModal}
        />
      ) : null}
      {modal === "exam" && selectedBundle ? (
        <AddExamModal
          courseId={courseId}
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
    </section>
  );
}

function SubjectCard({
  bundle,
  isActive,
  onSelect,
}: {
  bundle: SubjectBundle;
  isActive: boolean;
  onSelect: () => void;
}) {
  const items = [
    { label: "লেকচার", value: bundle.classes.length, icon: Video },
    { label: "লাইভ", value: bundle.liveClasses.length, icon: Radio },
    { label: "রেকর্ডিং", value: bundle.recordings, icon: Video },
    { label: "নোট", value: bundle.resources.length, icon: FileText },
    { label: "কাজ", value: bundle.assignments.length, icon: ClipboardList },
    { label: "MCQ", value: bundle.exams.length, icon: ClipboardCheck },
  ];

  return (
    <button
      className={`rounded-2xl border p-4 text-left transition ${
        isActive
          ? "border-blue-500 bg-blue-500/10"
          : "border-slate-800 bg-gray-900/40 hover:border-slate-700"
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-blue-50">{bundle.subject.name}</h3>
          <p className="mt-1 text-xs text-slate-400">
            মোট {totalItems(bundle)}টি শেখার আইটেম
          </p>
        </div>
        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">
          বিষয়
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {items.map(({ icon: Icon, label, value }) => (
          <span
            className="rounded-xl border border-slate-800 bg-slate-950/35 px-2.5 py-2"
            key={label}
          >
            <span className="flex items-center gap-1.5 text-slate-400">
              <Icon size={13} />
              <span className="text-[11px] font-semibold">{label}</span>
            </span>
            <strong className="mt-1 block text-base font-black text-blue-50">
              {value}
            </strong>
          </span>
        ))}
      </div>
    </button>
  );
}

function SubjectActions({
  activeTab,
  onOpen,
}: {
  activeTab: SubjectTab;
  onOpen: (modal: ModalKey) => void;
}) {
  const actions: { label: string; modal: ModalKey; icon: LucideIcon }[] =
    activeTab === "live"
      ? [{ label: "লাইভ ক্লাস যোগ", modal: "live", icon: Radio }]
      : activeTab === "notes"
        ? [{ label: "নোট/রিসোর্স যোগ", modal: "resource", icon: FileText }]
        : activeTab === "assignments"
          ? [{ label: "অ্যাসাইনমেন্ট যোগ", modal: "assignment", icon: ClipboardList }]
      : activeTab === "mcq"
        ? [{ label: "MCQ যোগ", modal: "exam", icon: ClipboardCheck }]
        : [{ label: "লেকচার যোগ", modal: "recording", icon: Video }];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ icon: Icon, label, modal }) => (
        <button
          className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2 text-xs font-bold text-white"
          key={label}
          onClick={() => onOpen(modal)}
          type="button"
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}

function SubjectTabContent({
  activeTab,
  bundle,
  courseId,
  onEdit,
  onDelete,
  onViewSubmissions,
}: {
  activeTab: SubjectTab;
  bundle: SubjectBundle;
  courseId: number;
  onEdit: (target: EditTarget) => void;
  onDelete: (tab: SubjectTab, id: number, title: string) => void;
  onViewSubmissions: (assignment: Assignment) => void;
}) {
  const router = useRouter();

  if (activeTab === "lectures") {
    return (
      <ItemList
        empty="এই বিষয়ে এখনো কোনো লেকচার নেই।"
        items={bundle.classes.map((item) => ({
          id: item.id,
          title: item.title,
          meta: `${item.videos.length}টি ভিডিও · ${item.class_materials.length}টি ম্যাটেরিয়াল`,
          onEdit: () => onEdit({ type: "lectures", item }),
          onDelete: () => onDelete("lectures", item.id, item.title),
        }))}
      />
    );
  }

  if (activeTab === "live") {
    return (
      <ItemList
        empty="এই বিষয়ে এখনো কোনো লাইভ ক্লাস নেই।"
        items={bundle.liveClasses.map((item) => ({
          id: item.id,
          title: item.title,
          meta: item.class_date || "তারিখ দেওয়া হয়নি",
          onEdit: () => onEdit({ type: "live", item }),
          onDelete: () => onDelete("live", item.id, item.title),
        }))}
      />
    );
  }

  if (activeTab === "notes") {
    return (
      <ItemList
        empty="এই বিষয়ে এখনো কোনো নোট বা রিসোর্স নেই।"
        items={bundle.resources.map((item) => ({
          id: item.id,
          title: item.title,
          meta: item.resource_type,
          onEdit: () => onEdit({ type: "notes", item }),
          onDelete: () => onDelete("notes", item.id, item.title),
        }))}
      />
    );
  }

  if (activeTab === "assignments") {
    return (
      <ItemList
        empty="এই বিষয়ে এখনো কোনো অ্যাসাইনমেন্ট নেই।"
        items={bundle.assignments.map((item) => ({
          id: item.id,
          title: item.title,
          meta: `${item.max_marks} নম্বর · ${item.status}`,
          onView: () => onViewSubmissions(item),
          onEdit: () => onEdit({ type: "assignments", item }),
          onDelete: () => onDelete("assignments", item.id, item.title),
        }))}
      />
    );
  }

  return (
    <div className="mt-4">
      <ItemList
        empty="এই বিষয়ে এখনো কোনো MCQ পরীক্ষা নেই।"
        items={bundle.exams.map((item) => ({
          id: item.id,
          title: item.title,
          meta: `${item.total_questions} প্রশ্ন · ${item.duration_minutes} মিনিট`,
          onEdit: () => router.push(`/mcq/${item.id}/edit`),
          onDelete: () => onDelete("mcq", item.id, item.title),
        }))}
      />
      <Link
        className="mt-3 inline-flex rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-100"
        href={`/courses/${courseId}/edit`}
      >
        কোর্সের সব কন্টেন্ট এডিট করুন
      </Link>
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
};

function ItemList({ empty, items }: { empty: string; items: ListItem[] }) {
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
          item.onView || item.onEdit || item.onDelete ? (
            <div className="flex shrink-0 items-center gap-2">
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
                  সম্পাদনা
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
            className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/25 p-4"
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
