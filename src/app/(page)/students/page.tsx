"use client";

import { useState } from "react";
import OverviewBanner from "./includes/overview-banner";
import Stats from "./includes/stats";
import Toolbar from "./includes/toolbar";
import StudentList from "./includes/student-list";
import AddStudentModal from "./includes/add-student-modal";

export default function Page() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-7">
      <OverviewBanner onAddClick={() => setModalOpen(true)} />
      <Stats />
      <Toolbar search={search} onSearchChange={setSearch} />
      <StudentList search={search} />
      {isModalOpen && <AddStudentModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
