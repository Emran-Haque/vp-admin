"use client";

import { Globe, Link2, Video, Briefcase, Pencil, Trash2, Eye, EyeOff, User } from "lucide-react";
import {
  useGetTeachersQuery,
  useDeleteTeacherMutation,
  useUpdateTeacherMutation,
  type Teacher,
} from "@/redux/api/contentApi";

const socialIcons: Record<string, typeof Globe> = {
  facebook: Link2,
  youtube: Video,
  linkedin: Briefcase,
  website: Globe,
};

export default function TeacherList({ onEdit }: { onEdit: (teacher: Teacher) => void }) {
  const { data, isLoading, isError } = useGetTeachersQuery();
  const [deleteTeacher] = useDeleteTeacherMutation();
  const [updateTeacher] = useUpdateTeacherMutation();

  if (isLoading) {
    return <p className="text-center text-sm text-slate-400">শিক্ষকদের তালিকা লোড হচ্ছে…</p>;
  }

  if (isError) {
    return (
      <p className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-center text-sm text-red-500">
        শিক্ষকদের তালিকা আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।
      </p>
    );
  }

  const teachers = [...(data?.results ?? [])].sort((a, b) => a.ordering - b.ordering);

  return (
    <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {teachers.map((teacher) => (
        <div
          key={teacher.id}
          className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]"
        >
          <div className="flex items-start justify-between">
            {teacher.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={teacher.image}
                alt={teacher.name}
                className="size-16 rounded-2xl object-cover"
              />
            ) : (
              <span className="flex size-16 items-center justify-center rounded-2xl bg-white/10">
                <User size={28} className="text-blue-500" strokeWidth={2} />
              </span>
            )}
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold outline outline-1 outline-offset-[-1px] ${
                teacher.is_active
                  ? "bg-white text-blue-500 outline-emerald-500/40"
                  : "bg-amber-500/10 text-amber-500 outline-amber-500/40"
              }`}
            >
              {teacher.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
            </span>
          </div>

          <div className="pt-4">
            <p className="text-lg font-semibold text-blue-50">{teacher.name}</p>
            <p className="mt-0.5 text-sm text-slate-400">
              {teacher.designation}
              {teacher.subject ? ` • ${teacher.subject}` : ""}
            </p>
          </div>

          {teacher.bio && <p className="mt-3 line-clamp-3 text-sm text-slate-400">{teacher.bio}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {Object.entries(teacher.social_links || {})
              .filter(([, url]) => url)
              .map(([platform, url]) => {
                const Icon = socialIcons[platform] ?? Globe;
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={platform}
                    className="flex size-8 items-center justify-center rounded-lg border border-slate-800 text-slate-300 transition-colors duration-200 hover:bg-white/5"
                  >
                    <Icon size={14} />
                  </a>
                );
              })}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => updateTeacher({ id: teacher.id, data: { is_active: !teacher.is_active } })}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                teacher.is_active
                  ? "bg-teal-500/10 text-teal-500 hover:bg-teal-500/20"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {teacher.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
              {teacher.is_active ? "প্রদর্শিত" : "লুকানো"}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(teacher)}
                className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-slate-800 text-blue-50 transition-colors duration-200 hover:bg-white/5"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`"${teacher.name}" কে মুছে ফেলতে চান?`)) deleteTeacher(teacher.id);
                }}
                className="flex size-9 items-center justify-center rounded-xl border border-red-600/40 bg-red-600/10 text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {teachers.length === 0 && (
        <p className="col-span-full rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
          কোনো শিক্ষক পাওয়া যায়নি।
        </p>
      )}
    </section>
  );
}
