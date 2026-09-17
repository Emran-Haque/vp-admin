"use client";

import { useRef, useState } from "react";
import OverviewBanner from "./includes/overview-banner";
import Stats from "./includes/stats";
import Toolbar, { type StatusFilter, NOT_ENROLLED_VALUE } from "./includes/toolbar";
import StudentList from "./includes/student-list";
import Pagination from "./includes/pagination";
import AddStudentModal from "./includes/add-student-modal";
import { useGetCoursesQuery, coursesApi, type Enrollment } from "@/redux/api/coursesApi";
import { studentsApi, useGetStudentsQuery, type Student, type StudentListParams } from "@/redux/api/studentsApi";
import { useAppDispatch } from "@/redux/hooks";
import { usePermissions } from "@/hooks/use-permissions";
import { getApiErrorStatus } from "@/lib/api-error";
import { STATUS_PARAMS } from "./includes/status-params";
import { exportStudentsPdf } from "./includes/export-pdf";

const PAGE_SIZE = 50;
/** Largest page the API serves; keeps the export to as few requests as possible. */
const EXPORT_PAGE_SIZE = 100;

function courseParam(course: string): StudentListParams["course"] {
  if (!course) return undefined;
  return course === NOT_ENROLLED_VALUE ? "none" : Number(course);
}

export default function Page() {
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isExporting, setExporting] = useState(false);
  const listTopRef = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();
  const { hasPermission } = usePermissions();

  const filters: StudentListParams = {
    search: search || undefined,
    course: courseParam(course),
    ...(status ? STATUS_PARAMS[status] : {}),
  };

  const { data, isLoading, isFetching, isError, error } = useGetStudentsQuery({
    ...filters,
    page,
    page_size: PAGE_SIZE,
  });

  // Deleting or deactivating the only student on the last page leaves that
  // page past the end, and the API answers 404. Step back instead of erroring.
  if (page > 1 && isError && getApiErrorStatus(error) === 404) {
    setPage(page - 1);
  }

  const { data: courses } = useGetCoursesQuery();
  const courseOptions = [
    { value: NOT_ENROLLED_VALUE, label: "কোনো কোর্সে ভর্তি হয়নি" },
    ...(courses?.results ?? []).map((c) => ({
      value: String(c.id),
      label: c.title,
    })),
  ];

  const changePage = (next: number) => {
    setPage(next);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const fetchAllStudents = async (): Promise<Student[]> => {
    const students: Student[] = [];
    let page = 1;
    while (true) {
      const result = await dispatch(
        studentsApi.endpoints.getStudents.initiate(
          { ...filters, page, page_size: EXPORT_PAGE_SIZE },
          { subscribe: false }
        )
      ).unwrap();
      students.push(...result.results);
      if (!result.next) break;
      page += 1;
    }
    return students;
  };

  const fetchAllCourseEnrollments = async (courseId: number): Promise<Enrollment[]> => {
    const enrollments: Enrollment[] = [];
    let page = 1;
    while (true) {
      const result = await dispatch(
        coursesApi.endpoints.getCourseEnrollments.initiate({ id: courseId, page }, { subscribe: false })
      ).unwrap();
      enrollments.push(...result.results);
      if (!result.next) break;
      page += 1;
    }
    return enrollments;
  };

  const handleExport = async () => {
    if (!course) return;

    setExporting(true);
    try {
      if (course === NOT_ENROLLED_VALUE) {
        await exportStudentsPdf({
          students: await fetchAllStudents(),
          enrollmentByStudent: new Map(),
          courseName: "কোনো কোর্সে ভর্তি হয়নি",
          showEnrollmentDate: false,
        });
        return;
      }

      const courseId = Number(course);
      const courseName = courses?.results.find((c) => c.id === courseId)?.title ?? "";

      // Students come pre-filtered to the course; enrollments only supply the dates.
      const [enrollments, students] = await Promise.all([fetchAllCourseEnrollments(courseId), fetchAllStudents()]);
      const enrollmentByStudent = new Map(enrollments.map((e) => [e.student, e]));

      await exportStudentsPdf({ students, enrollmentByStudent, courseName });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-7">
      <OverviewBanner onAddClick={() => setModalOpen(true)} />
      <Stats />
      <Toolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        course={course}
        onCourseChange={(value) => {
          setCourse(value);
          setPage(1);
        }}
        courseOptions={courseOptions}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        canExport={hasPermission("can_view_students")}
        onExport={handleExport}
        isExporting={isExporting}
      />
      {/* scroll-mt clears the sticky header when paging scrolls back up. */}
      <div ref={listTopRef} className="scroll-mt-24">
        <StudentList
          students={data?.results ?? []}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          error={error}
        />
      </div>
      {!isError && (
        <Pagination count={data?.count ?? 0} page={page} pageSize={PAGE_SIZE} disabled={isFetching} onPageChange={changePage} />
      )}
      {isModalOpen && <AddStudentModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
