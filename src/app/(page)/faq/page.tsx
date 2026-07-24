"use client";

import { useState } from "react";
import OverviewBanner from "./includes/overview-banner";
import FaqList from "./includes/faq-list";
import AddFaqModal from "./includes/add-faq-modal";
import EditFaqModal from "./includes/edit-faq-modal";
import type { Faq } from "@/redux/api/contentApi";

export default function Page() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);

  return (
    <div className="flex flex-col gap-7">
      <OverviewBanner onAddClick={() => setIsAddModalOpen(true)} />
      <FaqList onEdit={setEditingFaq} />
      {isAddModalOpen && <AddFaqModal onClose={() => setIsAddModalOpen(false)} />}
      {editingFaq && (
        <EditFaqModal faq={editingFaq} onClose={() => setEditingFaq(null)} />
      )}
    </div>
  );
}
