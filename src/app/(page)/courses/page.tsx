"use client";

import OverviewBanner from "./includes/overview-banner";
import CourseList from "./includes/course-list";

export default function Page() {
  return (
    <div className="flex flex-col gap-7">
      <OverviewBanner />
      <CourseList />
    </div>
  );
}
