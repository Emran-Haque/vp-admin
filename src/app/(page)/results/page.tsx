"use client";

import { useMemo, useState } from "react";
import OverviewHeader from "./includes/overview-header";
import Stats from "./includes/stats";
import Toolbar from "./includes/toolbar";
import ResultsTable from "./includes/results-table";
import Pagination from "./includes/pagination";
import { useGetExamAttemptsQuery, useGetExamsQuery } from "@/redux/api/examsApi";
import { useGetCoursesQuery } from "@/redux/api/coursesApi";
import { toResultRow } from "./includes/types";

export default function Page() {
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "passed" | "failed">("all");
  const [page, setPage] = useState(1);

  const { data: examsData } = useGetExamsQuery();
  const { data: coursesData } = useGetCoursesQuery();
  const {
    data: attemptsData,
    isLoading,
    isError,
    error,
  } = useGetExamAttemptsQuery({
    status: "submitted",
    course: courseFilter !== "all" ? courseFilter : undefined,
    search: search || undefined,
    page,
  });

  const courses = coursesData?.results ?? [];
  const examsById = useMemo(
    () => new Map((examsData?.results ?? []).map((e) => [e.id, e])),
    [examsData]
  );
  const coursesById = useMemo(
    () => new Map((coursesData?.results ?? []).map((c) => [c.id, c])),
    [coursesData]
  );

  const rows = useMemo(() => {
    const attempts = attemptsData?.results ?? [];
    return attempts
      .map((attempt) => toResultRow(attempt, examsById, coursesById))
      .filter((row) => {
        if (statusFilter === "passed" && !row.passed) return false;
        if (statusFilter === "failed" && row.passed) return false;
        return true;
      });
  }, [attemptsData, examsById, coursesById, statusFilter]);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-fuchsia-500" />

      <div className="flex flex-col gap-5 p-5">
        <OverviewHeader />
        <Stats />

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-gray-900 shadow-[0px_3px_14px_0px_rgba(0,0,0,0.30)]">
          <Toolbar
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            courses={courses}
            courseFilter={courseFilter}
            onCourseFilterChange={(value) => {
              setCourseFilter(value);
              setPage(1);
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
          <ResultsTable rows={rows} isLoading={isLoading} isError={isError} error={error} />
          <Pagination
            count={attemptsData?.count ?? 0}
            shown={rows.length}
            page={page}
            hasNext={!!attemptsData?.next}
            hasPrev={!!attemptsData?.previous}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
