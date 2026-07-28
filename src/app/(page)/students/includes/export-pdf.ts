import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { Student } from "@/redux/api/studentsApi";
import type { Enrollment } from "@/redux/api/coursesApi";

// jsPDF's own font embedding (addFont) — and even doc.html()'s "text" mode,
// which still routes glyphs through that same engine — does not shape
// complex scripts, so Bengali conjuncts/matras render corrupted or blank.
// We rasterize the DOM with html2canvas ourselves (using the browser's own,
// correct text shaping) and place the result as plain images via
// doc.addImage(), never touching jsPDF's text engine.
const BENGALI_FONT_FAMILY = "NotoSansBengaliExport";
const BENGALI_FONT_URL = "/fonts/NotoSansBengali-Regular.ttf";
const CONTAINER_WIDTH = 760;

const PAGE_WIDTH_PT = 595.28; // A4 portrait
const PAGE_HEIGHT_PT = 841.89;
const MARGIN_PT = 24;
const USABLE_WIDTH_PT = PAGE_WIDTH_PT - MARGIN_PT * 2;
const USABLE_HEIGHT_PT = PAGE_HEIGHT_PT - MARGIN_PT * 2;

let bengaliFontLoaded: Promise<void> | null = null;

function loadBengaliFont(): Promise<void> {
  if (!bengaliFontLoaded) {
    bengaliFontLoaded = fetch(BENGALI_FONT_URL)
      .then((res) => res.arrayBuffer())
      .then(async (buffer) => {
        const fontFace = new FontFace(BENGALI_FONT_FAMILY, buffer);
        await fontFace.load();
        document.fonts.add(fontFace);
      });
  }
  return bengaliFontLoaded;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });
}

function buildReportHtml({
  students,
  enrollmentByStudent,
  courseName,
}: {
  students: Student[];
  enrollmentByStudent: Map<number, Enrollment>;
  courseName: string;
}) {
  const rowsHtml = students
    .map((student, index) => {
      const enrollment = enrollmentByStudent.get(student.id);
      const cells = [
        student.full_name,
        student.phone || "-",
        student.email,
        enrollment ? formatDate(enrollment.enrolled_at) : "-",
        formatDate(student.created_at),
      ];
      const rowBg = index % 2 === 1 ? "#f5f7fa" : "#ffffff";
      return `<tr style="background:${rowBg};">${cells
        .map((cell) => `<td style="border:1px solid #cbd5e1;padding:6px 8px;">${escapeHtml(cell)}</td>`)
        .join("")}</tr>`;
    })
    .join("");

  return `
    <div style="font-family:'${BENGALI_FONT_FAMILY}', sans-serif; color:#0f172a; background:#ffffff; padding:16px; width:${CONTAINER_WIDTH - 32}px;">
      <h2 style="margin:0 0 12px; font-size:16px;">শিক্ষার্থী তালিকা — ${escapeHtml(courseName)}</h2>
      <table style="width:100%; border-collapse:collapse; font-size:11px;">
        <thead>
          <tr style="background:#1e293b; color:#ffffff;">
            <th style="padding:6px 8px; text-align:left;">নাম</th>
            <th style="padding:6px 8px; text-align:left;">ফোন</th>
            <th style="padding:6px 8px; text-align:left;">ইমেইল</th>
            <th style="padding:6px 8px; text-align:left;">কোর্সে ভর্তির তারিখ</th>
            <th style="padding:6px 8px; text-align:left;">প্ল্যাটফর্মে যোগদানের তারিখ</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;
}

export async function exportStudentsPdf(params: {
  students: Student[];
  enrollmentByStudent: Map<number, Enrollment>;
  courseName: string;
}) {
  await loadBengaliFont();

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = `${CONTAINER_WIDTH}px`;
  container.innerHTML = buildReportHtml(params);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff" });

    const ptPerPx = USABLE_WIDTH_PT / canvas.width;
    const pageHeightPx = USABLE_HEIGHT_PT / ptPerPx;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let renderedPx = 0;
    let isFirstPage = true;

    while (renderedPx < canvas.height) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;
      const ctx = sliceCanvas.getContext("2d")!;
      ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

      if (!isFirstPage) doc.addPage();
      doc.addImage(
        sliceCanvas.toDataURL("image/png"),
        "PNG",
        MARGIN_PT,
        MARGIN_PT,
        USABLE_WIDTH_PT,
        sliceHeightPx * ptPerPx
      );

      renderedPx += sliceHeightPx;
      isFirstPage = false;
    }

    const datePart = new Date().toISOString().slice(0, 10);
    const safeCourseName = params.courseName.replace(/\s+/g, "-");
    doc.save(`students-${safeCourseName}-${datePart}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
