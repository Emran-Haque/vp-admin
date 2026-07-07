"use client";

import { useState } from "react";
import OverviewBanner from "./includes/overview-banner";
import Stats from "./includes/stats";
import Toolbar from "./includes/toolbar";
import StudentList from "./includes/student-list";

export default function Page() {
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col gap-7">
      <OverviewBanner />
      <Stats />
      <Toolbar search={search} onSearchChange={setSearch} />
      <StudentList search={search} />
    </div>
  );
}
