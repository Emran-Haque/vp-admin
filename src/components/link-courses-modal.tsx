"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Link2, Search, X } from "lucide-react";
import { extractErrorMessage } from "@/lib/api-error";
import { useGetCourseSubjectsQuery } from "@/redux/api/courseSubjectsApi";
import {
  useGetLinkableCoursesQuery,
  useLinkToCoursesMutation,
  type LinkKind,
  type LinkTarget,
} from "@/redux/api/linkingApi";

/** "auto" = match the source subject by name, "none" = no subject, else a subject id. */
type SubjectChoice = "auto" | "none" | number;

type Props = {
  kind: LinkKind;
  itemId: number;
  itemTitle: string;
  /** The course this exam/class already belongs to. */
  sourceCourseId: number | null;
  /** Courses it is already linked into. */
  linkedCourseIds: number[];
  onClose: () => void;
};

const KIND_TEXT: Record<LinkKind, { noun: string; perCourse: string; brings: string }> = {
  exam: {
    noun: "পরীক্ষা",
    perCourse: "ফলাফল ও লিডারবোর্ড প্রতিটি কোর্সে আলাদা থাকবে",
    brings: "সব প্রশ্ন ও সেটিংসসহ",
  },
  class: {
    noun: "ক্লাস",
    perCourse: "উপস্থিতি ও লাইভ চ্যাট প্রতিটি কোর্সে আলাদা থাকবে",
    brings: "ভিডিও, ম্যাটেরিয়াল ও কুইজসহ",
  },
};

/** "অন্য কোর্সেও যোগ করুন": copy an exam or class into other courses, linked. */
export default function LinkCoursesModal({
  kind,
  itemId,
  itemTitle,
  sourceCourseId,
  linkedCourseIds,
  onClose,
}: Props) {
  const text = KIND_TEXT[kind];
  const { data, isLoading, isError } = useGetLinkableCoursesQuery();
  const [linkToCourses, { isLoading: isSaving }] = useLinkToCoursesMutation();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<number, SubjectChoice>>({});
  const [error, setError] = useState<string | null>(null);
  const [doneTitles, setDoneTitles] = useState<string[] | null>(null);

  const excluded = useMemo(
    () => new Set([...(sourceCourseId ? [sourceCourseId] : []), ...linkedCourseIds]),
    [sourceCourseId, linkedCourseIds],
  );
  // Offline batches run paper exams and classroom slots, so they are left out.
  const courses = useMemo(
    () =>
      (data?.results ?? [])
        .filter((course) => !excluded.has(course.id) && course.delivery_mode !== "offline")
        .sort((a, b) => a.title.localeCompare(b.title, "bn")),
    [data, excluded],
  );
  const query = search.trim().toLowerCase();
  const visible = query ? courses.filter((course) => course.title.toLowerCase().includes(query)) : courses;
  const selectedIds = Object.keys(selected).map(Number);

  const toggle = (courseId: number) =>
    setSelected((current) => {
      const next = { ...current };
      if (courseId in next) delete next[courseId];
      else next[courseId] = "auto";
      return next;
    });

  const submit = async () => {
    setError(null);
    const targets: LinkTarget[] = selectedIds.map((course) => {
      const choice = selected[course];
      if (choice === "auto") return { course };
      return { course, subject: choice === "none" ? null : choice };
    });
    try {
      const result = await linkToCourses({ kind, id: itemId, targets }).unwrap();
      const titles = new Map(courses.map((course) => [course.id, course.title]));
      setDoneTitles(result.created.map((row) => titles.get(row.course) ?? `#${row.course}`));
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_20px_60px_-15px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-6 py-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-bold text-blue-50">
              <Link2 size={18} className="text-cyan-400" /> অন্য কোর্সেও যোগ করুন
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-400">{itemTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        {doneTitles ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <CheckCircle2 size={40} className="text-emerald-400" />
            <p className="text-base font-bold text-blue-50">
              {doneTitles.length}টি কোর্সে {text.noun} যোগ হয়েছে
            </p>
            <p className="text-sm text-slate-400">{doneTitles.join(", ")}</p>
            <p className="max-w-md text-xs leading-5 text-slate-500">
              এখন যেকোনো কোর্স থেকে এডিট করলে সব কোর্সে একসাথে বদলাবে।
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
            >
              ঠিক আছে
            </button>
          </div>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-6">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3.5 text-xs leading-5 text-slate-300">
                নির্বাচিত প্রতিটি কোর্সে এই {text.noun} {text.brings} যোগ হবে। {text.perCourse}, কিন্তু
                <span className="font-bold text-cyan-200"> যেকোনো কোর্স থেকে এডিট করলে সব কোর্সে একসাথে বদলাবে।</span>
              </div>

              {error ? (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              ) : null}

              <label className="relative block">
                <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="কোর্স খুঁজুন"
                  className="w-full rounded-xl border border-slate-800 bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </label>

              {isLoading ? (
                <p className="py-8 text-center text-sm text-slate-400">কোর্স লোড হচ্ছে…</p>
              ) : isError ? (
                <p className="py-8 text-center text-sm text-red-400">কোর্সের তালিকা আনা যায়নি।</p>
              ) : visible.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500">
                  {courses.length === 0 ? "যোগ করার মতো আর কোনো কোর্স নেই।" : "এই নামে কোনো কোর্স নেই।"}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {visible.map((course) => {
                    const isSelected = course.id in selected;
                    return (
                      <div
                        key={course.id}
                        className={`rounded-xl border px-3.5 py-3 transition ${
                          isSelected ? "border-cyan-500/40 bg-cyan-500/5" : "border-slate-800 bg-gray-900/40"
                        }`}
                      >
                        <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-blue-50">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggle(course.id)}
                            className="size-4 accent-cyan-500"
                          />
                          <span className="min-w-0 flex-1 truncate">{course.title}</span>
                          {!course.is_published ? (
                            <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                              অপ্রকাশিত
                            </span>
                          ) : null}
                        </label>
                        {isSelected ? (
                          <SubjectPicker
                            courseId={course.id}
                            value={selected[course.id]}
                            onChange={(choice) => setSelected((current) => ({ ...current, [course.id]: choice }))}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-800 px-6 py-4">
              <span className="text-xs text-slate-500">{selectedIds.length}টি কোর্স নির্বাচিত</span>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={isSaving || selectedIds.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  <Link2 size={15} />
                  {isSaving ? "যোগ হচ্ছে…" : "যোগ করুন"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SubjectPicker({
  courseId,
  value,
  onChange,
}: {
  courseId: number;
  value: SubjectChoice;
  onChange: (choice: SubjectChoice) => void;
}) {
  const { data, isLoading } = useGetCourseSubjectsQuery({ course: courseId });
  const subjects = data?.results ?? [];
  return (
    <label className="mt-2.5 flex items-center gap-2 pl-7 text-xs text-slate-400">
      বিষয়:
      <select
        value={String(value)}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === "auto" || raw === "none" ? raw : Number(raw));
        }}
        className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-gray-800 px-3 py-2 text-xs text-blue-50 focus:outline-none"
      >
        <option value="auto">একই নামের বিষয় নিজে থেকে মিলিয়ে নিন</option>
        <option value="none">কোনো বিষয় ছাড়া</option>
        {isLoading ? <option disabled>লোড হচ্ছে…</option> : null}
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </select>
    </label>
  );
}
