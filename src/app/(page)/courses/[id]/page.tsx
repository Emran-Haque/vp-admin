"use client";

import { useParams } from "next/navigation";
import { useGetCourseQuery } from "@/redux/api/coursesApi";
import { useGetCourseSubjectsQuery } from "@/redux/api/courseSubjectsApi";
import CourseDetailsHeader from "./includes/course-details-header";
import CourseStatCards from "./includes/course-stat-cards";
import CourseTabs from "./includes/course-tabs";

export default function Page() {
  const params = useParams<{ id: string }>();
  const courseId = Number(params.id);

  const { data: course, isLoading, isError } = useGetCourseQuery(courseId, { skip: !courseId });
  const { data: subjectsData } = useGetCourseSubjectsQuery({ course: courseId }, { skip: !courseId });

  if (isLoading) {
    return <p className="text-center text-sm text-slate-400">কোর্সের তথ্য লোড হচ্ছে…</p>;
  }

  if (isError || !course) {
    return (
      <p className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-center text-sm text-red-500">
        কোর্সটি খুঁজে পাওয়া যায়নি। API সার্ভার সংযোগ পরীক্ষা করুন।
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <CourseDetailsHeader course={course} />
      <CourseStatCards course={course} subjectCount={subjectsData?.results.length ?? 0} />
      <CourseTabs courseId={course.id} />
    </div>
  );
}
