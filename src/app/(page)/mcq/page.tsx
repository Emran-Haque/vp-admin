"use client";

import OverviewBanner from "./includes/overview-banner";
import ExamList from "./includes/exam-list";

export default function Page() {
  return (
    <div className="flex flex-col gap-7">
      <OverviewBanner />
      <ExamList />
    </div>
  );
}
