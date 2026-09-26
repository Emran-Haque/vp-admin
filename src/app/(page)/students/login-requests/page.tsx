"use client";

import StudentsTabs from "../includes/students-tabs";
import LoginRequestsOverview from "./includes/overview";
import RequestQueue from "./includes/request-queue";

export default function Page() {
  return (
    <div className="flex flex-col gap-7">
      <StudentsTabs />
      <LoginRequestsOverview />
      <RequestQueue />
    </div>
  );
}
