"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageLoader } from "@/components/loaders";
import OverviewBanner from "./includes/overview-banner";
import ReviewQueue, { toReviewTab } from "./includes/review-queue";

/** `?status=pending` (from a notification) opens that tab; keyed so a new link re-applies it. */
function QueueFromUrl() {
  const status = toReviewTab(useSearchParams().get("status"));
  return <ReviewQueue initialStatus={status} key={status} />;
}

export default function Page() {
  return (
    <div className="flex flex-col gap-4 sm:gap-7">
      <OverviewBanner />
      <Suspense fallback={<PageLoader />}>
        <QueueFromUrl />
      </Suspense>
    </div>
  );
}
