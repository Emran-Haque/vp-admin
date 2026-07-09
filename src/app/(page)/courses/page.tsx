"use client";

import { useState } from "react";
import OverviewBanner from "./includes/overview-banner";
import CourseList from "./includes/course-list";
import EditCourseModal from "./includes/edit-course-modal";
import type { Course } from "@/redux/api/coursesApi";

export default function Page() {
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  return (
    <div className="flex flex-col gap-7">
      <OverviewBanner />
      <CourseList onEdit={setEditingCourse} />
      {editingCourse && (
        <EditCourseModal course={editingCourse} onClose={() => setEditingCourse(null)} />
      )}
    </div>
  );
}
