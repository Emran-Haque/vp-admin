"use client";

import { Pencil, Trash2, Eye, EyeOff, User } from "lucide-react";
import {
  useGetTeachersQuery,
  useDeleteTeacherMutation,
  useUpdateTeacherMutation,
  type Teacher,
} from "@/redux/api/contentApi";
import ErrorState from "@/components/error-state";
import AdminDeleteButton from "@/components/admin-delete-button";
import { PageLoader } from "@/components/loaders";

export default function TeacherList({ onEdit }: { onEdit: (teacher: Teacher) => void }) {
  const { data, isLoading, isError, error } = useGetTeachersQuery();
  const [deleteTeacher] = useDeleteTeacherMutation();
  const [updateTeacher] = useUpdateTeacherMutation();

  if (isLoading) {
    return <PageLoader label="শিক্ষকদের তালিকা লোড হচ্ছে…" />;
  }

  if (isError) {
    return <ErrorState message="শিক্ষকদের তালিকা আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।" error={error} />;
  }

  const teachers = [...(data?.results ?? [])].sort((a, b) => a.ordering - b.ordering);

  return (
    <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {teachers.map((teacher) => {
        const description = teacher.short_description || teacher.bio || teacher.long_description;

        return (
          <div
            key={teacher.id}
            className="flex min-h-[360px] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]"
          >
            <div className="relative h-44 bg-sky-100/90">
              {teacher.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={teacher.image}
                  alt={teacher.name}
                  className="h-full w-full object-contain object-bottom"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <User size={44} className="text-blue-500" strokeWidth={2} />
                </span>
              )}
              <span
                className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold outline outline-1 outline-offset-[-1px] ${
                  teacher.is_active
                    ? "bg-white text-blue-500 outline-emerald-500/40"
                    : "bg-amber-500/10 text-amber-500 outline-amber-500/40"
                }`}
              >
                {teacher.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-6">
              <div>
                <p className="text-lg font-semibold text-blue-50">{teacher.name}</p>
                <p className="mt-0.5 text-sm text-slate-400">
                  {teacher.designation}
                  {teacher.subject ? ` • ${teacher.subject}` : ""}
                </p>
              </div>

              {description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{description}</p>}

              <div className="mt-auto flex items-center justify-between border-t border-slate-800 pt-4">
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
                  <AdminDeleteButton
                    itemName={teacher.name}
                    itemType="শিক্ষক"
                    impact="শিক্ষকের প্রোফাইল, প্রদর্শন তথ্য ও পাবলিক মেন্টর কার্ড মুছে যাবে।"
                    onDelete={() => deleteTeacher(teacher.id).unwrap()}
                    className="flex size-9 items-center justify-center rounded-xl border border-red-600/40 bg-red-600/10 text-red-600"
                  >
                    <Trash2 size={14} />
                  </AdminDeleteButton>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {teachers.length === 0 && (
        <p className="col-span-full rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
          কোনো শিক্ষক পাওয়া যায়নি।
        </p>
      )}
    </section>
  );
}
