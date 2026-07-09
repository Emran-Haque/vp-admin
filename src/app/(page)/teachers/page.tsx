"use client";

import { useState } from "react";
import OverviewBanner from "./includes/overview-banner";
import TeacherList from "./includes/teacher-list";
import AddTeacherModal from "./includes/add-teacher-modal";
import EditTeacherModal from "./includes/edit-teacher-modal";
import type { Teacher } from "@/redux/api/contentApi";

export default function Page() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  return (
    <div className="flex flex-col gap-7">
      <OverviewBanner onAddClick={() => setModalOpen(true)} />
      <TeacherList onEdit={setEditingTeacher} />
      {isModalOpen && <AddTeacherModal onClose={() => setModalOpen(false)} />}
      {editingTeacher && (
        <EditTeacherModal teacher={editingTeacher} onClose={() => setEditingTeacher(null)} />
      )}
    </div>
  );
}
