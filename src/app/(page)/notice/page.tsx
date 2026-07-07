"use client";

import { useState } from "react";
import OverviewBanner from "./includes/overview-banner";
import NoticeList from "./includes/notice-list";
import AddNoticeModal from "./includes/add-notice-modal";

export default function Page() {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <OverviewBanner onAddClick={() => setModalOpen(true)} />
      <NoticeList />
      {isModalOpen && <AddNoticeModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
