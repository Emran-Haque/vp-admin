"use client";

import { useState } from "react";
import OverviewBanner from "./includes/overview-banner";
import ReviewList from "./includes/review-list";
import AddReviewModal from "./includes/add-review-modal";
import EditReviewModal from "./includes/edit-review-modal";
import type { Review } from "@/redux/api/contentApi";

export default function Page() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  return (
    <div className="flex flex-col gap-7">
      <OverviewBanner onAddClick={() => setIsAddModalOpen(true)} />
      <ReviewList onEdit={setEditingReview} />
      {isAddModalOpen && <AddReviewModal onClose={() => setIsAddModalOpen(false)} />}
      {editingReview && (
        <EditReviewModal review={editingReview} onClose={() => setEditingReview(null)} />
      )}
    </div>
  );
}
