import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Student } from "@/redux/api/studentsApi";
import type { Enrollment } from "@/redux/api/coursesApi";

const BENGALI_FONT_URL = "/fonts/NotoSansBengali-Regular.ttf";
const BENGALI_FONT_NAME = "NotoSansBengali";

let fontBase64Promise: Promise<string> | null = null;

function loadBengaliFontBase64(): Promise<string> {
  if (!fontBase64Promise) {
    fontBase64Promise = fetch(BENGALI_FONT_URL)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }
        return btoa(binary);
      });
  }
  return fontBase64Promise;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });
}

export async function exportStudentsPdf({
  students,
  enrollmentByStudent,
  courseName,
}: {
  students: Student[];
  enrollmentByStudent: Map<number, Enrollment>;
  courseName: string;
}) {
  const fontBase64 = await loadBengaliFontBase64();

  const doc = new jsPDF();
  doc.addFileToVFS(`${BENGALI_FONT_NAME}.ttf`, fontBase64);
  doc.addFont(`${BENGALI_FONT_NAME}.ttf`, BENGALI_FONT_NAME, "normal");
  doc.setFont(BENGALI_FONT_NAME);

  doc.setFontSize(14);
  doc.text(`শিক্ষার্থী তালিকা — ${courseName}`, 14, 15);

  const rows = students.map((student) => {
    const enrollment = enrollmentByStudent.get(student.id);
    return [
      student.full_name,
      student.phone || "-",
      student.email,
      enrollment ? formatDate(enrollment.enrolled_at) : "-",
      formatDate(student.created_at),
    ];
  });

  autoTable(doc, {
    startY: 22,
    head: [["নাম", "ফোন", "ইমেইল", "কোর্সে ভর্তির তারিখ", "প্ল্যাটফর্মে যোগদানের তারিখ"]],
    body: rows,
    styles: { font: BENGALI_FONT_NAME, fontSize: 9, cellPadding: 3 },
    headStyles: { font: BENGALI_FONT_NAME, fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  const datePart = new Date().toISOString().slice(0, 10);
  doc.save(`students-${courseName.replace(/\s+/g, "-")}-${datePart}.pdf`);
}
