"use client";

import { useParams } from "next/navigation";
import { useGetCourseQuery } from "@/redux/api/coursesApi";
import { useGetCourseSubjectsQuery } from "@/redux/api/courseSubjectsApi";
import CourseDetailsHeader from "./includes/course-details-header";
import CourseStatCards from "./includes/course-stat-cards";
import CourseSubjectOverview from "./includes/course-subject-overview";
import CourseTabs from "./includes/course-tabs";
import ErrorState from "@/components/error-state";

export default function Page() {
  const params = useParams<{ id: string }>();
  const courseId = Number(params.id);

  const { data: course, isLoading, isError, error } = useGetCourseQuery(courseId, { skip: !courseId });
  const { data: subjectsData } = useGetCourseSubjectsQuery({ course: courseId }, { skip: !courseId });

  if (isLoading) {
    return <p className="text-center text-sm text-slate-400">কোর্সের তথ্য লোড হচ্ছে…</p>;
  }

  if (isError || !course) {
    return (
      <ErrorState
        message="কোর্সটি খুঁজে পাওয়া যায়নি। API সার্ভার সংযোগ পরীক্ষা করুন।"
        error={isError ? error : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <CourseDetailsHeader course={course} />
      <CourseStatCards course={course} subjectCount={subjectsData?.results.length ?? 0} />
      <CourseSubjectOverview courseId={course.id} />
      <CourseTabs courseId={course.id} />
    </div>
  );
}
