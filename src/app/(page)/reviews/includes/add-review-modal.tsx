"use client";

import { useState } from "react";
import { X, Star, BookOpen, Users, AlertCircle } from "lucide-react";
import { useCreateReviewMutation } from "@/redux/api/contentApi";
import { useGetCoursesQuery } from "@/redux/api/coursesApi";
import { useGetStudentsQuery } from "@/redux/api/studentsApi";
import { extractErrorMessage } from "@/lib/api-error";

export default function AddReviewModal({ onClose }: { onClose: () => void }) {
  const [createReview, { isLoading }] = useCreateReviewMutation();
  const { data: coursesData, isLoading: isLoadingCourses } = useGetCoursesQuery();
  const { data: studentsData, isLoading: isLoadingStudents } = useGetStudentsQuery();

  const courses = coursesData?.results ?? [];
  const students = studentsData?.results ?? [];

  const [courseId, setCourseId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !studentId || !comment.trim()) {
      setErrorMsg("কোর্স, শিক্ষার্থী এবং মন্তব্য ঘরগুলো পূরণ করা আবশ্যক।");
      return;
    }

    setErrorMsg(null);

    try {
      await createReview({
        course: Number(courseId),
        student: Number(studentId),
        rating,
        comment: comment.trim(),
        is_featured: isFeatured,
        is_visible: isVisible,
      }).unwrap();
      onClose();
    } catch (err) {
      console.error("Failed to create review:", err);
      setErrorMsg(extractErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Star size={18} className="fill-amber-400" />
            </span>
            <h2 className="text-lg font-bold text-blue-50">নতুন কোর্স রিভিউ যোগ করুন</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {Boolean(errorMsg) && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {/* Select Course */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <BookOpen size={14} className="text-amber-400" />
              কোর্স নির্বাচন করুন *
            </label>
            <select
              required
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-2.5 text-sm text-blue-50 focus:border-amber-500 focus:outline-none"
            >
              <option value="">-- কোর্স নির্বাচন করুন --</option>
              {isLoadingCourses ? (
                <option disabled>কোর্স লোড হচ্ছে…</option>
              ) : (
                courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Select Student */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <Users size={14} className="text-cyan-400" />
              শিক্ষার্থী নির্বাচন করুন *
            </label>
            <select
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-2.5 text-sm text-blue-50 focus:border-amber-500 focus:outline-none"
            >
              <option value="">-- শিক্ষার্থী নির্বাচন করুন --</option>
              {isLoadingStudents ? (
                <option disabled>শিক্ষার্থী লোড হচ্ছে…</option>
              ) : (
                students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.email})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="text-xs font-medium text-slate-300">রেটিং (১ - ৫)</label>
            <div className="mt-1.5 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={24}
                    className={star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-semibold text-amber-400">{rating} / 5</span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs font-medium text-slate-300">রিভিউ মন্তব্য *</label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="শিক্ষার্থীর কোর্স রিভিউ মন্তব্য লিখুন…"
              className="mt-1.5 w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-2.5 text-sm text-blue-50 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 rounded-xl border border-slate-800 bg-gray-900/40 p-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="size-4 rounded border-slate-700 bg-gray-800 text-amber-500 focus:ring-amber-500"
              />
              <span>ফিচার্ড রিভিউ হিসেবে দেখান</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="size-4 rounded border-slate-700 bg-gray-800 text-emerald-500 focus:ring-emerald-500"
              />
              <span>ওয়েবসাইটে দৃশ্যমান রাখুন</span>
            </label>
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
            >
              {isLoading ? "সংরক্ষণ করা হচ্ছে…" : "সংরক্ষণ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
