"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  HelpCircle,
  LoaderCircle,
  PlayCircle,
  Radio,
  RotateCw,
  Trophy,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useGetCourseStudentPreviewQuery,
  type Course,
  type CourseStudentPreview,
} from "@/redux/api/coursesApi";

const STUDENT_SITE_URL = (
  process.env.NEXT_PUBLIC_STUDENT_SITE_URL || "https://www.vaiyaderpathshala.com"
).replace(/\/+$/, "");

const bnNumber = new Intl.NumberFormat("bn-BD");
const bnDate = new Intl.DateTimeFormat("bn-BD", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

type PreviewTab = "public" | "private";

function subjectName(value?: string | null) {
  return value?.trim() || "সাধারণ";
}

function EmptyContent({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[14px] border border-dashed border-white/10 p-7 text-center">
      <BookOpen className="mx-auto text-white/30" size={28} />
      <p className="mt-3 text-[13px] font-bold text-white/55">{children}</p>
    </div>
  );
}

type PreviewClass = CourseStudentPreview["classes"][number];
type PreviewResource = CourseStudentPreview["resources"][number];
type PreviewAssignment = CourseStudentPreview["assignments"][number];
type PreviewExam = CourseStudentPreview["exams"][number];

function ClassPreviewCard({
  footer,
  item,
  live = false,
  showActions = true,
}: {
  footer?: ReactNode;
  item: PreviewClass;
  live?: boolean;
  showActions?: boolean;
}) {
  const poster = item.videos[0]?.thumbnail || item.thumbnail;
  return (
    <article className="relative overflow-hidden rounded-[16px] border border-white/[0.07] bg-[#0c111d] p-3">
      <span className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${live ? "from-red-400 via-red-500" : "from-blue-400 via-blue-500"} to-transparent`} />
      <div className="flex items-stretch gap-4 max-[860px]:flex-col max-[860px]:gap-3">
        <div
          className="relative aspect-video w-[176px] shrink-0 overflow-hidden rounded-[12px] bg-black bg-cover bg-center max-[860px]:w-full"
          style={poster ? { backgroundImage: `url(${poster})` } : undefined}
        >
          <div className="absolute inset-0 bg-black/35" />
          {live && item.stream_status === "live" && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-black text-white">
              <Radio size={12} /> LIVE
            </span>
          )}
          <span className="absolute inset-0 grid place-items-center">
            <span className={`grid size-12 place-items-center rounded-full border text-white backdrop-blur-sm ${live ? "border-red-400/50 bg-red-500/30" : "border-white/30 bg-white/15"}`}>
              <PlayCircle size={25} />
            </span>
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[8px] border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-black text-blue-300">
              {item.subject_name || "সাধারণ"}
            </span>
            {live && item.stream_status === "live" && (
              <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-[11px] font-black text-red-400">
                <Radio size={12} /> LIVE
              </span>
            )}
          </div>
          <h4 className="mt-2 text-[16px] font-black leading-snug text-[#f8fafc]">{item.title}</h4>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-white/65">
            {item.class_date && <span>📅 {bnDate.format(new Date(item.class_date))}</span>}
            {item.start_time && <span>🕐 {item.start_time.slice(0, 5)}</span>}
            <span>🎬 {bnNumber.format(item.videos.length)}টি ভিডিও</span>
          </div>
        </div>

        {showActions ? <div className="flex shrink-0 items-center gap-3 max-[860px]:items-stretch">
          <span className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] border border-white/[0.07] bg-white/[0.05] px-4 text-[13px] font-black text-[#e2e8f0]">
            <PlayCircle size={15} /> ভিডিও <ChevronDown size={14} />
          </span>
          <span className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] border border-white/[0.07] bg-white/[0.03] px-4 text-[13px] font-black text-[#e2e8f0]">
            <FileText size={15} /> ম্যাটেরিয়াল <ChevronDown size={14} />
          </span>
        </div> : null}
      </div>
      {footer}
    </article>
  );
}

function ResourcePreviewCard({ item }: { item: PreviewResource }) {
  const isDrive = item.resource_type === "drive";
  const label = isDrive ? "ড্রাইভ" : item.resource_type === "doc" ? "ডকুমেন্ট" : "পিডিএফ";
  const tone = isDrive
    ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
    : item.resource_type === "doc"
      ? "border-blue-400/25 bg-blue-500/10 text-blue-300"
      : "border-red-500/25 bg-red-500/10 text-red-300";
  return (
    <article className="relative flex items-center gap-3 overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#0c111d] p-3">
      <span className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${isDrive ? "from-emerald-500/0 via-emerald-500 to-emerald-500/0" : "from-blue-500/0 via-blue-500 to-blue-500/0"}`} />
      <span className={`grid size-11 shrink-0 place-items-center rounded-[12px] border ${tone}`}>
        {isDrive ? <ExternalLink size={19} /> : <FileText size={19} />}
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-1 text-[14px] font-black text-[#f8fafc]">{item.title}</h4>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-white/55">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${tone}`}>{label}</span>
          <span>📚 {item.subject_name || "সাধারণ"}</span>
          {item.file_size && <span>💾 {item.file_size}</span>}
          <span>⬇️ {bnNumber.format(item.download_count)} বার</span>
        </div>
      </div>
      <span className={`grid size-10 shrink-0 place-items-center rounded-[10px] border ${isDrive ? "border-emerald-400/40 bg-emerald-500/[0.06] text-emerald-200" : "border-blue-400/40 bg-blue-500/[0.06] text-blue-200"}`}>
        {isDrive ? <ExternalLink size={16} /> : <Download size={16} />}
      </span>
    </article>
  );
}

function AssignmentPreviewRow({ item }: { item: PreviewAssignment }) {
  return (
    <article className="rounded-[13px] border border-white/[0.07] bg-white/[0.025]">
      <div className="flex items-center gap-3 p-3 max-[760px]:flex-wrap">
        <span className="grid size-10 shrink-0 place-items-center rounded-[10px] border border-white/[0.08] bg-white/[0.04] text-blue-300">
          <ClipboardList size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-[14px] font-black text-white">{item.title}</h4>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${item.status === "active" ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-white/50"}`}>
              {item.status === "active" ? "চলমান" : "বন্ধ"}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-white/55">
            শেষ তারিখ {item.due_date ? bnDate.format(new Date(item.due_date)) : "নির্ধারিত নয়"} · {bnNumber.format(Number(item.max_marks))} নম্বর{item.course_class_title ? ` · ${item.course_class_title}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-2 max-[760px]:w-full">
          <span className="inline-flex h-9 flex-1 items-center justify-center rounded-[10px] bg-blue-500 px-3 text-[12px] font-black text-white opacity-55">লিংক</span>
          <span className="inline-flex h-9 flex-1 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.04] px-3 text-[12px] font-black text-white/80 opacity-55">ফাইল</span>
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-white/10 bg-white/[0.04] text-white/60"><ChevronDown size={16} /></span>
        </div>
      </div>
    </article>
  );
}

function ExamPreviewRow({ item }: { item: PreviewExam }) {
  return (
    <article className="flex items-center gap-4 rounded-[14px] border border-white/[0.07] bg-[#0c111d] p-4 max-[760px]:flex-wrap">
      <span className="grid size-11 shrink-0 place-items-center rounded-[12px] border border-blue-500/25 bg-blue-500/10 text-blue-300">
        <HelpCircle size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="text-[15px] font-bold text-[#f8fafc]">{item.title}</h4>
        <p className="mt-1 text-[12px] text-white/55">
          {item.subject || "সাধারণ"} · {bnNumber.format(item.total_questions)} প্রশ্ন · {bnNumber.format(item.duration_minutes)} মিনিট · {bnNumber.format(Number(item.total_marks))} নম্বর
        </p>
      </div>
      <span className="inline-flex h-10 shrink-0 items-center justify-center rounded-[10px] bg-[#3b82f6] px-5 text-[13px] font-black text-white opacity-55 max-[760px]:w-full">
        পরীক্ষা দিন
      </span>
    </article>
  );
}

function ResultPreview() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
        {[
          ["MCQ সম্পন্ন", "০", HelpCircle],
          ["অ্যাসাইনমেন্ট মূল্যায়িত", "০", ClipboardList],
          ["প্রাপ্ত নম্বর", "০/০", Trophy],
          ["পারফরম্যান্স", "০%", GraduationCap],
        ].map(([label, value, Icon]) => {
          const ResultIcon = Icon as LucideIcon;
          return (
          <div key={label as string} className="rounded-[14px] border border-emerald-400/15 bg-emerald-500/[0.045] p-4">
            <span className="flex items-center gap-2 text-[12px] font-bold text-emerald-100/65">
              <ResultIcon className="text-emerald-300" size={16} /> {label as string}
            </span>
            <strong className="mt-2 block text-[22px] font-black text-white">{value as string}</strong>
          </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-4">
        <p className="text-[12px] text-white/60">
          এই বিষয়ে এখনো প্রকাশিত কোনো ব্যক্তিগত রেজাল্ট নেই।
        </p>
        <span className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#3b82f6] px-4 text-[13px] font-black text-white opacity-50">
          <Download size={16} /> এই বিষয়ের রেজাল্ট
        </span>
      </div>
    </div>
  );
}

function PreviewLectureCard({
  assignments,
  exams,
  item,
}: {
  assignments: PreviewAssignment[];
  exams: PreviewExam[];
  item: PreviewClass;
}) {
  const [activeModal, setActiveModal] = useState<PreviewLectureModal>(null);
  const chips: {
    key: Exclude<PreviewLectureModal, null>;
    label: string;
    icon: LucideIcon;
    count: number;
  }[] = [
    { key: "live", label: "লাইভ", icon: Radio, count: item.is_live ? 1 : 0 },
    { key: "notes", label: "নোট", icon: FileText, count: item.class_materials.length },
    { key: "assignments", label: "অ্যাসাইনমেন্ট", icon: ClipboardList, count: assignments.length },
    { key: "mcq", label: "MCQ", icon: HelpCircle, count: exams.length },
    { key: "results", label: "ফলাফল", icon: Trophy, count: 0 },
  ];

  return (
    <>
      <ClassPreviewCard
        footer={
          <div className="mt-3 grid grid-cols-5 gap-2 border-t border-white/[0.06] pt-3 max-[720px]:grid-cols-2">
            {chips.map(({ count, icon: Icon, key, label }) => (
              <button
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[11px] border border-white/[0.08] bg-white/[0.035] px-2.5 py-2 text-[11px] font-black text-white/70 transition hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-white"
                key={key}
                onClick={() => setActiveModal(key)}
                type="button"
              >
                <Icon className="text-blue-300" size={14} />
                {label}
                <span className="rounded-full bg-white/[0.07] px-1.5 py-0.5 text-[9px] text-white/55">{bnNumber.format(count)}</span>
              </button>
            ))}
          </div>
        }
        item={item}
        showActions={false}
      />

      {activeModal ? (
        <PreviewLectureModalView onClose={() => setActiveModal(null)} title={`${item.title} · ${chips.find((chip) => chip.key === activeModal)?.label ?? ""}`}>
          {activeModal === "live" ? (item.is_live ? <ClassPreviewCard item={item} live /> : <EmptyContent>লাইভ ক্লাস নির্ধারণ করা হয়নি।</EmptyContent>) : null}
          {activeModal === "notes" ? (item.class_materials.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {item.class_materials.map((material) => (
                <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-xs font-bold text-white/75" key={material.id}>
                  <FileText className="text-blue-300" size={16} /> {material.title}
                </div>
              ))}
            </div>
          ) : <EmptyContent>নোট বা ম্যাটেরিয়াল যোগ করা হয়নি।</EmptyContent>) : null}
          {activeModal === "assignments" ? (assignments.length > 0 ? <div className="space-y-2">{assignments.map((assignment) => <AssignmentPreviewRow item={assignment} key={assignment.id} />)}</div> : <EmptyContent>অ্যাসাইনমেন্ট যোগ করা হয়নি।</EmptyContent>) : null}
          {activeModal === "mcq" ? (exams.length > 0 ? <div className="space-y-2">{exams.map((exam) => <ExamPreviewRow item={exam} key={exam.id} />)}</div> : <EmptyContent>MCQ যোগ করা হয়নি।</EmptyContent>) : null}
          {activeModal === "results" ? <ResultPreview /> : null}
        </PreviewLectureModalView>
      ) : null}
    </>
  );
}

type PreviewLectureModal = "live" | "notes" | "assignments" | "mcq" | "results" | null;

function PreviewLectureModalView({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return createPortal(
    <div aria-label={title} aria-modal="true" className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm max-[640px]:p-0" onClick={onClose} role="dialog">
      <div className="flex max-h-[88vh] w-full max-w-[960px] flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[#0b0f17] shadow-2xl max-[640px]:h-full max-[640px]:max-h-none max-[640px]:rounded-none" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3.5">
          <h3 className="min-w-0 flex-1 truncate text-[15px] font-black text-white">{title}</h3>
          <button aria-label="বন্ধ করুন" className="grid size-9 place-items-center rounded-[10px] border border-white/10 bg-white/[0.05] text-xl text-white/75" onClick={onClose} type="button">×</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

function PrivateStudentView({ data }: { data: CourseStudentPreview }) {
  const subjectNames = Array.from(
    new Set([
      ...data.course.subjects.map((item) => subjectName(item.name)),
      ...data.classes.map((item) => subjectName(item.subject_name)),
      ...data.resources.map((item) => subjectName(item.subject_name)),
      ...data.assignments.map((item) => subjectName(item.subject_name)),
      ...data.exams.map((item) => subjectName(item.subject)),
    ]),
  );
  const [selectedSubject, setSelectedSubject] = useState(subjectNames[0] || "সাধারণ");
  const activeSubject = subjectNames.includes(selectedSubject)
    ? selectedSubject
    : subjectNames[0] || "সাধারণ";

  const subjectClasses = data.classes.filter(
    (item) => subjectName(item.subject_name) === activeSubject,
  );
  const resources = data.resources.filter(
    (item) => subjectName(item.subject_name) === activeSubject,
  );
  const assignments = data.assignments.filter(
    (item) => subjectName(item.subject_name) === activeSubject,
  );
  const exams = data.exams.filter((item) => subjectName(item.subject) === activeSubject);
  const unlinkedAssignments = assignments.filter((item) => !item.course_class);
  const unlinkedExams = exams.filter((item) => !item.course_class);

  const courseStats = [
    { label: "ক্লাস", value: data.course.total_classes, icon: PlayCircle },
    { label: "কুইজ", value: data.course.total_quizzes, icon: HelpCircle },
    { label: "অ্যাসাইনমেন্ট", value: data.course.total_assignments, icon: ClipboardList },
    { label: "বিষয়", value: data.course.subjects.length, icon: BookOpen },
  ];

  const contentCountFor = (name: string) =>
    data.classes.filter((item) => subjectName(item.subject_name) === name).length +
    data.resources.filter((item) => subjectName(item.subject_name) === name).length +
    data.assignments.filter((item) => subjectName(item.subject_name) === name).length +
    data.exams.filter((item) => subjectName(item.subject) === name).length;

  return (
    <div className="min-h-full bg-[#070b14] text-slate-100">
      <div className="flex min-h-full">
        <aside className="sticky top-0 hidden h-full min-h-[760px] w-[254px] shrink-0 flex-col border-r border-white/[0.07] bg-[#080c14] px-4 py-7 xl:flex">
          <div className="mb-8 px-2">
            <Image alt="ভাইয়াদের পাঠশালা" className="h-auto w-[128px]" height={60} src="/main_logo_white.png" width={177} />
          </div>
          <nav className="min-h-0 flex-1 space-y-1.5 overflow-hidden" aria-label="শিক্ষার্থী ড্যাশবোর্ড প্রিভিউ">
            {[
              ["ড্যাশবোর্ড", GraduationCap],
              ["আমার কোর্সসমূহ", BookOpen],
              ["লাইভ ক্লাস", Radio],
              ["ক্লাস রেকর্ডিং", PlayCircle],
              ["অ্যাসাইনমেন্ট", ClipboardList],
              ["MCQ পরীক্ষা", HelpCircle],
              ["কোর্স রিসোর্স", FileText],
              ["ফলাফল", Trophy],
            ].map(([label, Icon]) => {
              const active = label === "আমার কোর্সসমূহ";
              const MenuIcon = Icon as LucideIcon;
              return (
                <div key={label as string} className={`flex h-[46px] items-center gap-3 rounded-[12px] px-3 text-[13px] ${active ? "bg-[linear-gradient(100deg,#073044,#0d1f32)] text-white" : "text-white/65"}`}>
                  <span className={`grid size-8 place-items-center rounded-[9px] ${active ? "bg-white text-blue-500" : "bg-white/[0.04]"}`}>
                    <MenuIcon size={16} />
                  </span>
                  <span>{label as string}</span>
                </div>
              );
            })}
          </nav>
          <div className="mt-4 flex items-center gap-3 rounded-[14px] border border-white/[0.06] bg-white/[0.04] p-3">
            <span className="grid size-[38px] place-items-center rounded-[11px] bg-gradient-to-br from-pink-500 to-blue-500">
              <GraduationCap size={18} />
            </span>
            <div>
              <p className="text-[12px] font-bold text-slate-200">শিক্ষার্থী অ্যাকাউন্ট</p>
              <p className="text-[10px] text-white/40">প্রিভিউ মোড</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="sticky top-0 z-[5] flex h-[60px] items-center justify-between border-b border-white/[0.05] bg-[#080c14]/95 px-4 backdrop-blur-xl sm:px-5">
            <div className="flex items-center gap-1.5 text-[12px] font-bold">
              <span className="text-white/60">ভাইয়াদের পাঠশালা</span>
              <span className="text-white/30">/</span>
              <span className="text-white">ড্যাশবোর্ড</span>
            </div>
            <span className="rounded-[10px] border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-200">
              শুধু প্রিভিউ
            </span>
          </div>

          <div className="mx-auto max-w-[1240px] space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white/65">
          <ArrowLeft size={15} />
          আমার কোর্সসমূহ
        </div>

        <section className="relative overflow-hidden rounded-[18px] border border-[#29303e] bg-[linear-gradient(105deg,#0b2440_0%,#123a63_45%,#2a2a63_100%)] p-5 sm:p-7">
          <span className="pointer-events-none absolute -right-10 -top-24 h-[240px] w-[520px] -rotate-[18deg] bg-white/[0.06] blur-2xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-5 max-[900px]:flex-col">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-sky-400/35 bg-sky-400/10 px-3 py-1 text-[11px] font-bold text-sky-200">
                    {data.course.category?.name || "কোর্স"}
                  </span>
                  <span className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-200">
                    {data.course.is_free ? "ফ্রি কোর্স" : "সক্রিয় কোর্স"}
                  </span>
                </div>
                <h2 className="mt-3 text-[22px] font-black leading-tight text-white sm:text-[30px]">
                  {data.course.title}
                </h2>
                {data.course.short_description && (
                  <p className="mt-2 max-w-[720px] text-[12px] leading-6 text-white/70 sm:text-[13px]">
                    {data.course.short_description}
                  </p>
                )}
              </div>

              <div className="grid min-w-[360px] grid-cols-3 gap-2 max-[900px]:hidden">
                {[
                  ["MCQ", "০/০"],
                  ["অ্যাসাইনমেন্ট", "০/০"],
                  ["মোট", "০/০"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[12px] border border-white/10 bg-white/[0.07] p-3">
                    <span className="text-[11px] font-bold text-white/60">{label}</span>
                    <strong className="mt-1.5 block text-[17px] font-black text-white">{value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-1.5 sm:gap-3">
              {courseStats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-[10px] border border-white/10 bg-white/[0.06] px-1 py-2 text-center sm:rounded-[12px] sm:px-4 sm:py-3 sm:text-left">
                  <span className="flex items-center justify-center gap-1.5 text-[9.5px] text-white/65 sm:justify-start sm:text-[11px]">
                    <Icon className="hidden sm:block" size={13} /> {label}
                  </span>
                  <strong className="mt-1 block text-[17px] font-black text-white sm:text-[22px]">
                    {bnNumber.format(value)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <h3 className="text-[20px] font-black text-white">বিষয়ভিত্তিক শেখা</h3>
            <p className="mt-1 text-[12px] leading-5 text-white/55">
              একটি বিষয় বেছে নিন, তারপর সেই বিষয়ের ক্লাস, রিসোর্স, পরীক্ষা, অ্যাসাইনমেন্ট ও রেজাল্ট এক জায়গায় দেখুন।
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {subjectNames.map((name) => {
              const isActive = name === activeSubject;
              return (
                <button
                  key={name}
                  className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] font-black transition ${isActive ? "border-blue-400/50 bg-blue-500/15 text-white" : "border-white/[0.08] bg-[#0c111d] text-white/75 hover:border-white/15"}`}
                  onClick={() => setSelectedSubject(name)}
                  type="button"
                >
                  <BookOpen size={15} />
                  {name}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${isActive ? "bg-white/15 text-white" : "bg-white/[0.06] text-white/55"}`}>
                    {bnNumber.format(contentCountFor(name))}টি
                  </span>
                </button>
              );
            })}
          </div>

          {subjectNames.length === 0 ? (
            <EmptyContent>এখনো কোনো বিষয় সাজানো হয়নি।</EmptyContent>
          ) : (
            <div className="rounded-[18px] border border-white/[0.08] bg-[#0c111d] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.22)] sm:p-5">
              <div>
                <p className="text-[12px] font-bold text-blue-300">নির্বাচিত বিষয়</p>
                <h3 className="mt-1 text-[18px] font-black text-white sm:text-[22px]">{activeSubject}</h3>
              </div>

              <div className="mt-5 space-y-3">
                {subjectClasses.length > 0 ? (
                  subjectClasses.map((item) => (
                    <PreviewLectureCard
                      assignments={assignments.filter((assignment) => assignment.course_class === item.id)}
                      exams={exams.filter((exam) => exam.course_class === item.id)}
                      item={item}
                      key={item.id}
                    />
                  ))
                ) : (
                  <EmptyContent>এই বিষয়ে এখনো কোনো লেকচার যোগ করা হয়নি।</EmptyContent>
                )}
              </div>

              {resources.length > 0 || unlinkedAssignments.length > 0 || unlinkedExams.length > 0 ? (
                <details className="mt-4 rounded-[14px] border border-amber-400/20 bg-amber-400/[0.05]">
                  <summary className="cursor-pointer list-none px-4 py-3 text-[13px] font-black text-amber-100">
                    অন্যান্য উপকরণ (লেকচারে যুক্ত নয়)
                  </summary>
                  <div className="space-y-4 border-t border-amber-400/15 p-4">
                    {resources.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {resources.map((item) => <ResourcePreviewCard item={item} key={item.id} />)}
                      </div>
                    ) : null}
                    {unlinkedAssignments.map((item) => <AssignmentPreviewRow item={item} key={item.id} />)}
                    {unlinkedExams.map((item) => <ExamPreviewRow item={item} key={item.id} />)}
                  </div>
                </details>
              ) : null}
            </div>
          )}
        </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentPreviewModal({
  course,
  onClose,
}: {
  course: Pick<Course, "id" | "slug" | "title">;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("public");
  const [isPublicLoading, setIsPublicLoading] = useState(true);
  const {
    data: privatePreview,
    isFetching: isPrivateLoading,
    isError: isPrivateError,
    refetch,
  } = useGetCourseStudentPreviewQuery(course.id, { skip: activeTab !== "private" });
  const previewUrl = `${STUDENT_SITE_URL}/course/${encodeURIComponent(course.slug)}`;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div aria-label="শিক্ষার্থী প্রিভিউ" aria-modal="true" className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-sm" role="dialog">
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-white">শিক্ষার্থী প্রিভিউ</h2>
          <p className="truncate text-xs text-slate-400">{course.title}</p>
        </div>

        <div aria-label="প্রিভিউ ধরন" className="order-3 flex w-full rounded-xl bg-slate-950 p-1 sm:order-2 sm:w-auto" role="tablist">
          {([[
            "public", "পাবলিক ভিউ",
          ], [
            "private", "প্রাইভেট ভিউ",
          ]] as const).map(([value, label]) => (
            <button
              key={value}
              aria-selected={activeTab === value}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${activeTab === value ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
              onClick={() => {
                if (value === "public" && activeTab !== "public") setIsPublicLoading(true);
                setActiveTab(value);
              }}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="order-2 flex items-center gap-2 sm:order-3">
          {activeTab === "public" && (
            <a aria-label="নতুন ট্যাবে খুলুন" className="grid size-10 place-items-center rounded-xl border border-slate-700 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white" href={previewUrl} rel="noopener noreferrer" target="_blank" title="নতুন ট্যাবে খুলুন">
              <ExternalLink size={17} />
            </a>
          )}
          <button aria-label="প্রিভিউ বন্ধ করুন" className="grid size-10 place-items-center rounded-xl border border-slate-700 text-slate-300 transition-colors hover:bg-rose-500/15 hover:text-rose-300" onClick={onClose} title="বন্ধ করুন" type="button">
            <X size={18} />
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 p-2 sm:p-4">
        <div className="relative h-full overflow-hidden rounded-xl border border-slate-800 bg-white shadow-2xl" role="tabpanel">
          {activeTab === "public" ? (
            <>
              <iframe
                className="block h-full w-full border-0"
                onLoad={() => setIsPublicLoading(false)}
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-downloads allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                src={previewUrl}
                title={`${course.title} — শিক্ষার্থীর পাবলিক ভিউ`}
              />
              {isPublicLoading && (
                <div className="absolute inset-0 grid place-items-center bg-slate-950/90">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <LoaderCircle className="animate-spin" size={18} />
                    পাবলিক ভিউ লোড হচ্ছে…
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="h-full overflow-y-auto bg-[#070b14]">
              {isPrivateLoading && !privatePreview ? (
                <div className="grid min-h-full place-items-center text-slate-200">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <LoaderCircle className="animate-spin" size={18} />
                    প্রাইভেট ভিউ লোড হচ্ছে…
                  </span>
                </div>
              ) : isPrivateError || !privatePreview ? (
                <div className="grid min-h-full place-items-center p-6 text-center">
                  <div>
                    <p className="font-semibold text-white">প্রাইভেট ভিউ লোড করা যায়নি</p>
                    <p className="mt-1 text-sm text-slate-400">আপনার অনুমতি ও API সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।</p>
                    <button className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500" onClick={() => refetch()} type="button">
                      <RotateCw size={16} /> আবার চেষ্টা করুন
                    </button>
                  </div>
                </div>
              ) : (
                <PrivateStudentView data={privatePreview} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
