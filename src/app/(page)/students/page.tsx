"use client";

import { useState } from "react";
import OverviewBanner from "./includes/overview-banner";
import Stats from "./includes/stats";
import Toolbar, { type StatusFilter, NOT_ENROLLED_VALUE } from "./includes/toolbar";
import StudentList from "./includes/student-list";
import AddStudentModal from "./includes/add-student-modal";
import { useGetCoursesQuery, coursesApi, type Enrollment } from "@/redux/api/coursesApi";
import { studentsApi, type Student } from "@/redux/api/studentsApi";
import { useAppDispatch } from "@/redux/hooks";
import { usePermissions } from "@/hooks/use-permissions";
import { STATUS_PARAMS } from "./includes/status-params";
import { exportStudentsPdf } from "./includes/export-pdf";

export default function Page() {
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [isExporting, setExporting] = useState(false);

  const dispatch = useAppDispatch();
  const { hasPermission } = usePermissions();

  const { data: courses } = useGetCoursesQuery();
  const courseOptions = [
    { value: NOT_ENROLLED_VALUE, label: "কোনো কোর্সে ভর্তি হয়নি" },
    ...(courses?.results ?? []).map((c) => ({
      value: String(c.id),
      label: c.title,
    })),
  ];

  const fetchAllStudents = async (): Promise<Student[]> => {
    const students: Student[] = [];
    let page = 1;
    while (true) {
      const result = await dispatch(
        studentsApi.endpoints.getStudents.initiate({
          search: search || undefined,
          page,
          ...(status ? STATUS_PARAMS[status] : {}),
        })
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
        coursesApi.endpoints.getCourseEnrollments.initiate({ id: courseId, page })
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
        const enrolledIds = new Set<number>();
        for (const c of courses?.results ?? []) {
          (await fetchAllCourseEnrollments(c.id)).forEach((e) => enrolledIds.add(e.student));
        }
        const students = await fetchAllStudents();
        const notEnrolledStudents = students.filter((s) => !enrolledIds.has(s.id));

        await exportStudentsPdf({
          students: notEnrolledStudents,
          enrollmentByStudent: new Map(),
          courseName: "কোনো কোর্সে ভর্তি হয়নি",
          showEnrollmentDate: false,
        });
        return;
      }

      const courseId = Number(course);
      const courseName = courses?.results.find((c) => c.id === courseId)?.title ?? "";

      const [enrollments, students] = await Promise.all([fetchAllCourseEnrollments(courseId), fetchAllStudents()]);
      const enrollmentByStudent = new Map(enrollments.map((e) => [e.student, e]));
      const enrolledStudents = students.filter((s) => enrollmentByStudent.has(s.id));

      await exportStudentsPdf({ students: enrolledStudents, enrollmentByStudent, courseName });
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
        onSearchChange={setSearch}
        course={course}
        onCourseChange={setCourse}
        courseOptions={courseOptions}
        status={status}
        onStatusChange={setStatus}
        canExport={hasPermission("can_view_students")}
        onExport={handleExport}
        isExporting={isExporting}
      />
      <StudentList search={search} course={course} status={status} />
      {isModalOpen && <AddStudentModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
