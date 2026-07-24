"use client";

import { useState } from "react";
import {
  Star,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  User,
  Search,
  Award,
  Quote,
  BookOpen,
} from "lucide-react";
import {
  useGetReviewsQuery,
  useDeleteReviewMutation,
  useUpdateReviewMutation,
  type Review,
} from "@/redux/api/contentApi";
import { useGetCoursesQuery } from "@/redux/api/coursesApi";
import { useGetStudentsQuery } from "@/redux/api/studentsApi";
import { usePermissions } from "@/hooks/use-permissions";
import ErrorState from "@/components/error-state";

export default function ReviewList({ onEdit }: { onEdit: (review: Review) => void }) {
  const { data, isLoading, isError, error } = useGetReviewsQuery();
  const { data: coursesData } = useGetCoursesQuery();
  const { data: studentsData } = useGetStudentsQuery();

  const [deleteReview] = useDeleteReviewMutation();
  const [updateReview] = useUpdateReviewMutation();
  const { hasPermission } = usePermissions();

  const [search, setSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<number | 0>(0);
  const [filterStatus, setFilterStatus] = useState<"all" | "featured" | "visible" | "hidden">("all");
  const [filterRating, setFilterRating] = useState<number | 0>(0);

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-slate-400">রিভিউ সমূহের তালিকা লোড হচ্ছে…</p>;
  }

  if (isError) {
    return <ErrorState message="রিভিউ সমূহের তালিকা আনতে সমস্যা হয়েছে। API সংযোগ পরীক্ষা করুন।" error={error} />;
  }

  const allReviews = data?.results ?? [];
  const courses = coursesData?.results ?? [];
  const students = studentsData?.results ?? [];

  const courseMap = new Map(courses.map((c) => [c.id, c.title]));
  const studentMap = new Map(students.map((s) => [s.id, s]));

  const filteredReviews = allReviews.filter((review) => {
    const student = studentMap.get(review.student);
    const studentName = review.student_name || student?.full_name || "";
    const courseTitle = review.course_title || courseMap.get(review.course) || "";

    const matchesSearch =
      !search.trim() ||
      studentName.toLowerCase().includes(search.toLowerCase()) ||
      courseTitle.toLowerCase().includes(search.toLowerCase()) ||
      (review.comment && review.comment.toLowerCase().includes(search.toLowerCase()));

    const matchesCourse = selectedCourseId === 0 || review.course === selectedCourseId;

    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "featured"
        ? review.is_featured
        : filterStatus === "visible"
        ? review.is_visible
        : !review.is_visible;

    const matchesRating = filterRating === 0 ? true : review.rating === filterRating;

    return matchesSearch && matchesCourse && matchesStatus && matchesRating;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Filters toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <div className="relative min-w-[240px] flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="শিক্ষার্থীর নাম, কোর্স বা মন্তব্য দিয়ে খুঁজুন…"
            className="w-full rounded-2xl border border-slate-800 bg-gray-800 pl-11 pr-4 py-2.5 text-sm text-blue-50 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Course filter dropdown */}
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            className="rounded-2xl border border-slate-800 bg-gray-800 px-3.5 py-2 text-xs font-semibold text-slate-300 focus:border-amber-500 focus:outline-none"
          >
            <option value={0}>সব কোর্স</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          {/* Status filters */}
          <div className="flex items-center gap-1 rounded-2xl border border-slate-800 bg-gray-800 p-1">
            {[
              { key: "all", label: "সকল" },
              { key: "featured", label: "ফিচার্ড" },
              { key: "visible", label: "দৃশ্যমান" },
              { key: "hidden", label: "লুকানো" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilterStatus(key as typeof filterStatus)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filterStatus === key
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Rating filter dropdown */}
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(Number(e.target.value))}
            className="rounded-2xl border border-slate-800 bg-gray-800 px-3.5 py-2 text-xs font-semibold text-slate-300 focus:border-amber-500 focus:outline-none"
          >
            <option value={0}>সব রেটিং</option>
            <option value={5}>৫ স্টার (★ 5)</option>
            <option value={4}>৪ স্টার (★ 4)</option>
            <option value={3}>৩ স্টার (★ 3)</option>
            <option value={2}>২ স্টার (★ 2)</option>
            <option value={1}>১ স্টার (★ 1)</option>
          </select>
        </div>
      </div>

      {/* Review cards grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredReviews.map((review) => {
          const student = studentMap.get(review.student);
          const studentName = review.student_name || student?.full_name || `শিক্ষার্থী #${review.student}`;
          const courseTitle = review.course_title || courseMap.get(review.course) || `কোর্স #${review.course}`;
          const profileImg = student?.profile_image;

          return (
            <div
              key={review.id}
              className="relative flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)] transition-all hover:border-slate-700"
            >
              <div>
                {/* Header: Avatar, Name, Course Badge, Status Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {profileImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profileImg}
                        alt={studentName}
                        className="size-13 rounded-2xl object-cover ring-2 ring-amber-500/20"
                      />
                    ) : (
                      <span className="flex size-13 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 ring-1 ring-amber-500/30">
                        <User size={24} className="text-amber-400" />
                      </span>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-blue-50">{studentName}</h3>
                      {student?.email && <p className="text-xs text-slate-400">{student.email}</p>}
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-col items-end gap-1">
                    {review.is_featured && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-400 outline outline-1 outline-amber-500/40">
                        <Award size={11} />
                        ফিচার্ড
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold outline outline-1 outline-offset-[-1px] ${
                        review.is_visible
                          ? "bg-emerald-500/10 text-emerald-400 outline-emerald-500/40"
                          : "bg-slate-800 text-slate-400 outline-slate-700"
                      }`}
                    >
                      {review.is_visible ? "দৃশ্যমান" : "লুকানো"}
                    </span>
                  </div>
                </div>

                {/* Course Title Badge */}
                <div className="mt-3.5 flex items-center gap-1.5 rounded-xl border border-slate-800 bg-gray-800/80 px-3 py-1.5 text-xs text-slate-300">
                  <BookOpen size={14} className="shrink-0 text-amber-400" />
                  <span className="truncate font-medium text-blue-100">{courseTitle}</span>
                </div>

                {/* Rating stars */}
                <div className="mt-3.5 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={
                        star <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-700"
                      }
                    />
                  ))}
                  <span className="ml-1.5 text-xs font-bold text-amber-400">{review.rating}.0</span>
                </div>

                {/* Review Comment Box */}
                <div className="relative mt-3.5 rounded-2xl border border-slate-800/80 bg-gray-900/60 p-3.5">
                  <Quote size={18} className="absolute right-3 top-3 text-slate-700 opacity-60" />
                  <p className="text-sm italic leading-relaxed text-slate-300">&ldquo;{review.comment}&rdquo;</p>
                </div>
              </div>

              {/* Actions Toolbar at Bottom */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2">
                  {/* Toggle Featured Button */}
                  {hasPermission("can_manage_reviews") && (
                    <button
                      type="button"
                      onClick={() => updateReview({ id: review.id, data: { is_featured: !review.is_featured } })}
                      title={review.is_featured ? "ফিচার্ড তালিকা থেকে সরান" : "ফিচার্ড করুন"}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                        review.is_featured
                          ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                          : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                      }`}
                    >
                      <Award size={14} />
                      {review.is_featured ? "ফিচার্ড" : "ফিচার্ড করুন"}
                    </button>
                  )}

                  {/* Toggle Visibility Button */}
                  {hasPermission("can_manage_reviews") && (
                    <button
                      type="button"
                      onClick={() => updateReview({ id: review.id, data: { is_visible: !review.is_visible } })}
                      title={review.is_visible ? "ওয়েবসাইটে লুকান" : "ওয়েবসাইটে দেখান"}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                        review.is_visible
                          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                      }`}
                    >
                      {review.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      {review.is_visible ? "দৃশ্যমান" : "লুকানো"}
                    </button>
                  )}
                </div>

                {/* Edit & Delete Buttons */}
                <div className="flex items-center gap-2">
                  {hasPermission("can_manage_reviews") && (
                    <button
                      type="button"
                      onClick={() => onEdit(review)}
                      title="সম্পাদনা করুন"
                      className="flex size-9 items-center justify-center rounded-xl border border-slate-800 text-blue-50 transition-colors hover:bg-white/5"
                    >
                      <Pencil size={14} />
                    </button>
                  )}

                  {hasPermission("can_manage_reviews") && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`রিভিউটি মুছে ফেলতে চান?`)) {
                          deleteReview(review.id);
                        }
                      }}
                      title="মুছে ফেলুন"
                      className="flex size-9 items-center justify-center rounded-xl border border-red-600/40 bg-red-600/10 text-red-500 transition-colors hover:bg-red-600/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredReviews.length === 0 && (
          <p className="col-span-full rounded-3xl border border-dashed border-slate-800 p-12 text-center text-sm text-slate-400">
            কোনো রিভিউ পাওয়া যায়নি।
          </p>
        )}
      </div>
    </div>
  );
}
