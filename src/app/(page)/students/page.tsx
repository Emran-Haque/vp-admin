"use client";

import { useState } from "react";
import OverviewBanner from "./includes/overview-banner";
import Stats from "./includes/stats";
import Toolbar, { type StatusFilter } from "./includes/toolbar";
import StudentList from "./includes/student-list";
import AddStudentModal from "./includes/add-student-modal";
import { useGetStudentsQuery } from "@/redux/api/studentsApi";

export default function Page() {
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [isModalOpen, setModalOpen] = useState(false);

  const { data: allStudents } = useGetStudentsQuery();
  const batchOptions = Array.from(
    new Set(
      (allStudents?.results ?? [])
        .map((s) => s.student_profile?.batch)
        .filter((b): b is string => Boolean(b))
    )
  );

  return (
    <div className="flex flex-col gap-7">
      <OverviewBanner onAddClick={() => setModalOpen(true)} />
      <Stats />
      <Toolbar
        search={search}
        onSearchChange={setSearch}
        batch={batch}
        onBatchChange={setBatch}
        batchOptions={batchOptions}
        status={status}
        onStatusChange={setStatus}
      />
      <StudentList search={search} batch={batch} status={status} />
      {isModalOpen && <AddStudentModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
