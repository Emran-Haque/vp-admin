"use client";

import { useState } from "react";
import OverviewBanner from "./includes/overview-banner";
import ExamList from "./includes/exam-list";
import EditExamModal from "./includes/edit-exam-modal";
import type { Exam } from "@/redux/api/examsApi";

export default function Page() {
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  return (
    <div className="flex flex-col gap-7">
      <OverviewBanner />
      <ExamList onEdit={setEditingExam} />
      {editingExam && <EditExamModal exam={editingExam} onClose={() => setEditingExam(null)} />}
    </div>
  );
}
