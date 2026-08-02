"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { BookOpen, Users, type LucideIcon } from "lucide-react";
import { useGetCourseQuery } from "@/redux/api/coursesApi";
import { useGetCourseSubjectsQuery } from "@/redux/api/courseSubjectsApi";
import CourseDetailsHeader from "./includes/course-details-header";
import CourseStatCards from "./includes/course-stat-cards";
import CourseSubjectOverview from "./includes/course-subject-overview";
import CourseEnrolledStudents from "./includes/course-enrolled-students";
import ErrorState from "@/components/error-state";

type CourseManagementTab = "subjects" | "students";

const managementTabs: {
  key: CourseManagementTab;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: "subjects", label: "বিষয় ও কন্টেন্ট", icon: BookOpen },
  { key: "students", label: "ভর্তি শিক্ষার্থী", icon: Users },
];

export default function Page() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const courseId = Number(params.id);
  const [activeTab, setActiveTab] = useState<CourseManagementTab>(
    searchParams.get("tab") === "students" ? "students" : "subjects"
  );

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

      <div className="flex flex-wrap gap-2.5">
        {managementTabs.map(({ icon: Icon, key, label }) => {
          const active = activeTab === key;
          return (
            <button
              className={`flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors duration-200 ${
                active
                  ? "border-blue-500 bg-blue-500/10 text-blue-50"
                  : "border-slate-800 bg-slate-900 text-slate-400 hover:text-blue-50"
              }`}
              key={key}
              onClick={() => setActiveTab(key)}
              type="button"
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === "subjects" ? (
        <CourseSubjectOverview courseId={course.id} />
      ) : (
        <CourseEnrolledStudents
          courseId={course.id}
          verificationRequired={course.verification_required}
        />
      )}
    </div>
  );
}
