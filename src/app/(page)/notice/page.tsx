"use client";

import { useState } from "react";
import OverviewBanner from "./includes/overview-banner";
import NoticeList from "./includes/notice-list";
import AddNoticeModal from "./includes/add-notice-modal";
import EditNoticeModal from "./includes/edit-notice-modal";
import type { Notice } from "@/redux/api/noticesApi";

export default function Page() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <OverviewBanner onAddClick={() => setModalOpen(true)} />
      <NoticeList onEdit={setEditingNotice} />
      {isModalOpen && <AddNoticeModal onClose={() => setModalOpen(false)} />}
      {editingNotice && (
        <EditNoticeModal notice={editingNotice} onClose={() => setEditingNotice(null)} />
      )}
    </div>
  );
}
