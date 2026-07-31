"use client";

import Link from "next/link";
import {
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Plus,
  Radio,
  Video,
} from "lucide-react";
import { useGetAssignmentsQuery } from "@/redux/api/assignmentsApi";
import { useGetClassesQuery } from "@/redux/api/classesApi";
import { useGetCourseSubjectsQuery } from "@/redux/api/courseSubjectsApi";
import { useGetExamsQuery } from "@/redux/api/examsApi";
import { useGetResourcesQuery } from "@/redux/api/resourcesApi";

type SubjectStats = {
  name: string;
  classes: number;
  liveClasses: number;
  recordings: number;
  resources: number;
  assignments: number;
  exams: number;
};

function cleanSubject(value?: string | null) {
  const name = value?.trim();
  return name || "সাধারণ";
}

function countBySubject<T>(
  items: T[],
  subjectOf: (item: T) => string | null | undefined,
) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const subject = cleanSubject(subjectOf(item));
    acc[subject] = (acc[subject] ?? 0) + 1;
    return acc;
  }, {});
}

function countRecordingsBySubject(
  classes: { subject: string; videos: unknown[] }[],
) {
  return classes.reduce<Record<string, number>>((acc, item) => {
    const subject = cleanSubject(item.subject);
    acc[subject] = (acc[subject] ?? 0) + item.videos.length;
    return acc;
  }, {});
}

export default function CourseSubjectOverview({ courseId }: { courseId: number }) {
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

  const subjects = subjectsData?.results ?? [];
  const classes = classesData?.results ?? [];
  const resources = resourcesData?.results ?? [];
  const assignments = assignmentsData?.results ?? [];
  const exams = examsData?.results ?? [];
  const isLoading =
    subjectsLoading ||
    classesLoading ||
    resourcesLoading ||
    assignmentsLoading ||
    examsLoading;

  const classCounts = countBySubject(classes, (item) => item.subject);
  const liveCounts = countBySubject(
    classes.filter((item) => item.is_live),
    (item) => item.subject,
  );
  const recordingCounts = countRecordingsBySubject(classes);
  const resourceCounts = countBySubject(resources, (item) => item.subject);
  const assignmentCounts = countBySubject(assignments, (item) => item.subject_name);
  const subjectNameById = new Map(subjects.map((subject) => [subject.id, subject.name]));
  const examCounts = countBySubject(exams, (item) =>
    item.subject ? subjectNameById.get(item.subject) : null,
  );

  const subjectNames = Array.from(
    new Set([
      ...subjects.map((subject) => subject.name),
      ...Object.keys(classCounts),
      ...Object.keys(resourceCounts),
      ...Object.keys(assignmentCounts),
      ...Object.keys(examCounts),
    ].map(cleanSubject)),
  );

  const stats: SubjectStats[] = subjectNames.map((name) => ({
    name,
    classes: classCounts[name] ?? 0,
    liveClasses: liveCounts[name] ?? 0,
    recordings: recordingCounts[name] ?? 0,
    resources: resourceCounts[name] ?? 0,
    assignments: assignmentCounts[name] ?? 0,
    exams: examCounts[name] ?? 0,
  }));

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
              <BookOpen size={20} />
            </span>
            <div>
              <h2 className="text-xl font-bold leading-8 text-blue-50">
                বিষয়ভিত্তিক কোর্স ম্যানেজমেন্ট
              </h2>
              <p className="text-sm text-slate-400">
                প্রতিটি বিষয়ের ক্লাস, রেকর্ডিং, রিসোর্স, অ্যাসাইনমেন্ট ও MCQ এক নজরে দেখুন।
              </p>
            </div>
          </div>
        </div>
        <Link
          href={`/courses/${courseId}/edit`}
          className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={16} />
          বিষয় ও কন্টেন্ট সাজান
        </Link>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <p className="rounded-2xl border border-slate-800 bg-gray-900/40 p-6 text-center text-sm text-slate-400">
            বিষয়ভিত্তিক তথ্য লোড হচ্ছে...
          </p>
        ) : stats.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
            এখনো কোনো বিষয় যোগ করা হয়নি। আগে বিষয় তৈরি করুন, তারপর সেই বিষয়ের অধীনে ক্লাস, পরীক্ষা ও অ্যাসাইনমেন্ট সাজান।
          </p>
        ) : (
          <div className="grid gap-3 xl:grid-cols-3 md:grid-cols-2">
            {stats.map((subject) => (
              <SubjectCard key={subject.name} stats={subject} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SubjectCard({ stats }: { stats: SubjectStats }) {
  const total =
    stats.classes +
    stats.recordings +
    stats.resources +
    stats.assignments +
    stats.exams;
  const items = [
    { label: "ক্লাস", value: stats.classes, icon: Video },
    { label: "লাইভ", value: stats.liveClasses, icon: Radio },
    { label: "রেকর্ডিং", value: stats.recordings, icon: Video },
    { label: "রিসোর্স", value: stats.resources, icon: FileText },
    { label: "অ্যাসাইনমেন্ট", value: stats.assignments, icon: ClipboardList },
    { label: "MCQ", value: stats.exams, icon: ClipboardCheck },
  ];

  return (
    <article className="rounded-2xl border border-slate-800 bg-gray-900/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-blue-50">{stats.name}</h3>
          <p className="mt-1 text-xs text-slate-400">
            মোট {total}টি শেখার আইটেম
          </p>
        </div>
        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">
          বিষয়
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {items.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-800 bg-slate-950/35 px-2.5 py-2"
          >
            <div className="flex items-center gap-1.5 text-slate-400">
              <Icon size={13} />
              <span className="text-[11px] font-semibold">{label}</span>
            </div>
            <strong className="mt-1 block text-base font-black text-blue-50">
              {value}
            </strong>
          </div>
        ))}
      </div>
    </article>
  );
}
