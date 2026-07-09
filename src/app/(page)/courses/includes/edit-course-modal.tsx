"use client";

import { useState } from "react";
import { X, Save, AlertTriangle } from "lucide-react";
import {
  useUpdateCourseMutation,
  useGetCourseCategoriesQuery,
  type Course,
} from "@/redux/api/coursesApi";

const levels = [
  { value: "beginner", label: "শুরুর স্তর" },
  { value: "intermediate", label: "মধ্যম স্তর" },
  { value: "advanced", label: "উচ্চ স্তর" },
];

export default function EditCourseModal({ course, onClose }: { course: Course; onClose: () => void }) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.short_description);
  const [category, setCategory] = useState(String(course.category));
  const [level, setLevel] = useState(course.level);
  const [price, setPrice] = useState(course.price);
  const [duration, setDuration] = useState(course.duration);
  const [isPublished, setIsPublished] = useState(course.is_published);

  const { data: categoriesData } = useGetCourseCategoriesQuery();
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results ?? [];

  const [updateCourse, { isLoading, isError }] = useUpdateCourseMutation();

  const handleSave = async () => {
    try {
      await updateCourse({
        id: course.id,
        data: {
          title,
          short_description: description,
          category: Number(category),
          level,
          price,
          duration,
          is_published: isPublished,
        },
      }).unwrap();
      onClose();
    } catch {
      // error state shown inline below
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="w-full max-w-[560px] rounded-[20px] border border-white/5 bg-gray-900/75 p-7 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-50">কোর্স সম্পাদনা করুন</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 pt-6">
          {isError && (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-500">কোর্স সংরক্ষণ করা যায়নি। API সার্ভার সংযোগ পরীক্ষা করুন।</p>
            </div>
          )}

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">কোর্সের নাম</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: HSC বাংলা প্রস্তুতি কোর্স"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">সংক্ষিপ্ত বিবরণ</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="কোর্সে কী কী থাকবে তা সংক্ষেপে লিখুন"
              rows={3}
              className="w-full resize-none rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">ক্যাটাগরি</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-800 text-slate-200">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">স্তর</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              >
                {levels.map((l) => (
                  <option key={l.value} value={l.value} className="bg-slate-800 text-slate-200">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">মূল্য (৳)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">মোট সময়কাল</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="যেমন: ৩০ ঘণ্টা"
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="size-4 cursor-pointer accent-blue-500"
            />
            <span className="text-xs font-medium text-slate-400">কোর্সটি প্রকাশিত রাখুন</span>
          </label>

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
              disabled={isLoading || !title.trim()}
              className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0px_4px_12px_0px_rgba(0,200,150,0.19)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} />
              {isLoading ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
