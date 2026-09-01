"use client";

import OverviewBanner from "./includes/overview-banner";
import ReviewQueue from "./includes/review-queue";

export default function Page() {
  return (
    <div className="flex flex-col gap-7">
      <OverviewBanner />
      <ReviewQueue />
    </div>
  );
}
