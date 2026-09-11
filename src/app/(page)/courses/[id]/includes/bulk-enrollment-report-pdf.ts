import Papa from "papaparse";

import type { BulkEnrollmentJob } from "@/redux/api/coursesApi";

type ReportRow = {
  rowNumber: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  existingUser: boolean;
  details: string;
  messageStatus: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function displayValue(value: unknown) {
  const text = String(value ?? "").trim();
  return /^'[=+\-@]/.test(text) ? text.slice(1) : text;
}

function parseReport(csv: string): ReportRow[] {
  const result = Papa.parse<Record<string, string>>(csv.replace(/^\ufeff/, ""), {
    header: true,
    skipEmptyLines: "greedy",
  });
  if (result.errors.length && !result.data.length) {
    throw new Error("রিপোর্টের তথ্য পড়া যায়নি।");
  }

  return result.data
    .filter((row) => displayValue(row.row_number))
    .map((row) => ({
      rowNumber: displayValue(row.row_number),
      fullName: displayValue(row.full_name) || "-",
      email: displayValue(row.email) || "-",
      phone: displayValue(row.phone) || "-",
      status: displayValue(row.status),
      existingUser: displayValue(row.existing_user).toLowerCase() === "yes",
      details: displayValue(row.details) || "-",
      messageStatus: displayValue(row.message_status),
    }));
}

function enrollmentStatus(status: string) {
  return (
    {
      ready_new: "নতুন অ্যাকাউন্ট প্রস্তুত",
      ready_existing: "আগের অ্যাকাউন্ট প্রস্তুত",
      processing: "প্রক্রিয়াধীন",
      message_pending: "ভর্তি সম্পন্ন",
      message_sending: "ভর্তি সম্পন্ন",
      completed: "ভর্তি সম্পন্ন",
      already_enrolled: "আগেই ভর্তি",
      invalid: "তথ্য ভুল",
      conflict: "তথ্য মিলছে না",
      failed: "ভর্তি ব্যর্থ",
      message_failed: "ভর্তি সম্পন্ন",
    }[status] ?? status
  );
}

function messageStatus(status: string) {
  return (
    {
      sent: ["মেসেজ গেছে", "success"],
      failed: ["মেসেজ ব্যর্থ", "failure"],
      pending: ["অপেক্ষমাণ", "pending"],
      not_required: ["প্রযোজ্য নয়", "neutral"],
    }[status] ?? [status || "-", "neutral"]
  );
}

function reportRowHtml(row: ReportRow) {
  const [smsLabel, smsClass] = messageStatus(row.messageStatus);
  const existingClass = row.existingUser ? "success" : "failure";

  return `
    <tr>
      <td class="center muted">${escapeHtml(row.rowNumber)}</td>
      <td>
        <strong>${escapeHtml(row.fullName)}</strong>
        <span class="secondary">${escapeHtml(row.email)}</span>
      </td>
      <td class="phone">${escapeHtml(row.phone)}</td>
      <td class="center ${existingClass}">
        <strong>${row.existingUser ? "✓ হ্যাঁ" : "✕ না"}</strong>
      </td>
      <td>${escapeHtml(enrollmentStatus(row.status))}</td>
      <td class="center ${smsClass}"><strong>${escapeHtml(smsLabel)}</strong></td>
      <td>${escapeHtml(row.details)}</td>
    </tr>`;
}

function summaryHtml(job: BulkEnrollmentJob) {
  const problemCount =
    job.summary.invalid +
    job.summary.conflict +
    job.summary.failed +
    job.summary.message_failed;
  const items = [
    ["মোট সারি", job.total_rows],
    ["নতুন অ্যাকাউন্ট", job.summary.new_accounts],
    [
      "আগের ব্যবহারকারী",
      job.summary.existing_accounts + job.summary.already_enrolled,
    ],
    ["SMS গেছে", job.summary.messages_sent],
    ["সমস্যা", problemCount],
  ];

  return `<dl class="summary">${items
    .map(
      ([label, value]) =>
        `<div><dt>${label}</dt><dd>${value}</dd></div>`,
    )
    .join("")}</dl>`;
}

function buildReportDocument(rows: ReportRow[], job: BulkEnrollmentJob) {
  const generatedAt = new Date().toLocaleString("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const origin = window.location.origin;
  const fontUrl = escapeHtml(`${origin}/fonts/NotoSansBengali-Regular.ttf`);
  const logoUrl = escapeHtml(`${origin}/main_logo.png`);
  const safeCourse = job.course_title
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
  const title = `bulk-enrollment-${safeCourse || job.course}-${job.id}`;

  return `<!doctype html>
<html lang="bn">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      @font-face {
        font-family: "Noto Sans Bengali Report";
        src: url("${fontUrl}") format("truetype");
        font-style: normal;
        font-weight: 100 900;
        font-display: block;
      }

      @page {
        size: A4 landscape;
        margin: 10mm;
      }

      * { box-sizing: border-box; }

      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #111827;
        font-family: "Noto Sans Bengali Report", Arial, sans-serif;
        font-size: 9pt;
        line-height: 1.35;
        letter-spacing: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .report-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8mm;
        padding-bottom: 3mm;
        border-bottom: 0.7mm solid #0f766e;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 3mm;
        min-width: 0;
      }

      .brand img {
        width: 12mm;
        height: 12mm;
        object-fit: contain;
      }

      .brand-name {
        margin: 0;
        font-size: 15pt;
        font-weight: 800;
      }

      .report-name, .meta, .secondary, .muted { color: #475569; }

      .meta {
        flex: none;
        text-align: right;
        font-size: 8.5pt;
      }

      .meta strong { color: #111827; }

      .course {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8mm;
        margin: 3mm 0;
      }

      .course h1 {
        margin: 0 0 0.5mm;
        font-size: 12pt;
        line-height: 1.3;
      }

      .course p {
        margin: 0;
        color: #475569;
        overflow-wrap: anywhere;
      }

      .complete {
        flex: none;
        color: #047857;
        font-weight: 700;
      }

      .summary {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        margin: 0 0 3mm;
        border: 0.25mm solid #94a3b8;
      }

      .summary div {
        padding: 2mm 2.5mm;
        border-right: 0.25mm solid #cbd5e1;
      }

      .summary div:last-child { border-right: 0; }
      .summary dt { color: #475569; font-size: 8pt; }

      .summary dd {
        margin: 0.5mm 0 0;
        font-size: 13pt;
        font-weight: 800;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        border: 0.25mm solid #64748b;
      }

      thead { display: table-header-group; }

      tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      th, td {
        border: 0.25mm solid #94a3b8;
        padding: 1.8mm 2mm;
        vertical-align: top;
        text-align: left;
        overflow-wrap: anywhere;
        word-break: normal;
      }

      th {
        background: #e2e8f0;
        color: #111827;
        font-size: 8.5pt;
        font-weight: 700;
        vertical-align: middle;
      }

      tbody tr:nth-child(even) { background: #f8fafc; }
      td strong, td span { display: block; }

      .secondary {
        margin-top: 0.6mm;
        font-size: 8pt;
      }

      .center {
        text-align: center;
        vertical-align: middle;
      }

      .phone {
        font-variant-numeric: tabular-nums;
        overflow-wrap: anywhere;
      }
      .success { color: #047857; }
      .failure { color: #b91c1c; }
      .pending { color: #a16207; }
      .neutral { color: #475569; }

      .report-note {
        margin: 2.5mm 0 0;
        color: #64748b;
        font-size: 8pt;
        text-align: right;
      }
    </style>
  </head>
  <body>
    <header class="report-header">
      <div class="brand">
        <img src="${logoUrl}" alt="" />
        <div>
          <p class="brand-name">ভাইয়াদের পাঠশালা</p>
          <div class="report-name">Bulk Enrollment Report</div>
        </div>
      </div>
      <div class="meta">
        <div><strong>Job #${job.id}</strong></div>
        <div>${escapeHtml(generatedAt)}</div>
      </div>
    </header>

    <section class="course">
      <div>
        <h1>${escapeHtml(job.course_title)}</h1>
        <p>ফাইল: ${escapeHtml(job.original_filename)}</p>
      </div>
      <div class="complete">স্ট্যাটাস: সম্পন্ন</div>
    </section>

    ${summaryHtml(job)}

    <table>
      <colgroup>
        <col style="width: 4%" />
        <col style="width: 22%" />
        <col style="width: 12%" />
        <col style="width: 11%" />
        <col style="width: 14%" />
        <col style="width: 12%" />
        <col style="width: 25%" />
      </colgroup>
      <thead>
        <tr>
          <th class="center">#</th>
          <th>শিক্ষার্থী</th>
          <th>মোবাইল</th>
          <th class="center">আগের ব্যবহারকারী</th>
          <th>ভর্তি</th>
          <th class="center">SMS</th>
          <th>বিস্তারিত</th>
        </tr>
      </thead>
      <tbody>${rows.map(reportRowHtml).join("")}</tbody>
    </table>

    <p class="report-note">ভাইয়াদের পাঠশালা অ্যাডমিন থেকে তৈরি</p>
  </body>
</html>`;
}

async function waitForReportAssets(documentToPrint: Document) {
  await documentToPrint.fonts.ready;
  await Promise.all(
    Array.from(documentToPrint.images).map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
    }),
  );
}

export async function exportBulkEnrollmentReportPdf(
  csv: string,
  job: BulkEnrollmentJob,
) {
  const rows = parseReport(csv);
  if (!rows.length) {
    throw new Error("রিপোর্টে কোনো শিক্ষার্থীর তথ্য নেই।");
  }

  const iframe = document.createElement("iframe");
  iframe.title = "A4 PDF report";
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "1px",
    height: "1px",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });
  document.body.appendChild(iframe);

  try {
    const printDocument = iframe.contentDocument;
    const printWindow = iframe.contentWindow;
    if (!printDocument || !printWindow) {
      throw new Error("PDF রিপোর্ট খোলা যায়নি। আবার চেষ্টা করুন।");
    }

    printDocument.open();
    printDocument.write(buildReportDocument(rows, job));
    printDocument.close();
    await waitForReportAssets(printDocument);

    const cleanup = () => iframe.remove();
    printWindow.addEventListener("afterprint", cleanup, { once: true });
    printWindow.focus();
    printWindow.print();
    window.setTimeout(cleanup, 300_000);
  } catch (error) {
    iframe.remove();
    throw error;
  }
}
