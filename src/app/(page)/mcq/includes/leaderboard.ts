import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { Exam, ExamAttempt } from "@/redux/api/examsApi";
import { getMediaUrl } from "@/redux/api/baseApi";

// Same approach as students/includes/export-pdf.ts: jsPDF cannot shape Bengali,
// so each page is laid out as HTML, rasterized by html2canvas (the browser
// shapes the text) and placed in the PDF as an image.
const FONT = "NotoSansBengaliExport";
const FONT_URL = "/fonts/NotoSansBengali-Regular.ttf";
const BRAND = "ভাইয়াদের পাঠশালা";
const LOGO = "/main_logo.png";

const PAGE_W = 760; // px, A4 portrait ratio
const PAGE_H = Math.round(PAGE_W * (841.89 / 595.28));
const FIRST_PAGE_ROWS = 12;
const ROWS_PER_PAGE = 31;

const MEDALS = [
  { label: "১ম", from: "#fbbf24", to: "#b45309", ring: "#f59e0b", soft: "#fffbeb" },
  { label: "২য়", from: "#cbd5e1", to: "#475569", ring: "#94a3b8", soft: "#f1f5f9" },
  { label: "৩য়", from: "#fb923c", to: "#9a3412", ring: "#ea580c", soft: "#fff7ed" },
];

let fontLoaded: Promise<void> | null = null;
export function loadLeaderboardFont(): Promise<void> {
  if (!fontLoaded) {
    fontLoaded = fetch(FONT_URL)
      .then((res) => res.arrayBuffer())
      .then(async (buffer) => {
        const face = new FontFace(FONT, buffer);
        await face.load();
        document.fonts.add(face);
      })
      .catch((err) => {
        fontLoaded = null;
        throw err;
      });
  }
  return fontLoaded;
}

export const bn = (value: number | string) => String(value).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
const num = (value: number) => bn(Number(value.toFixed(2)));

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function duration(seconds: number) {
  if (!seconds) return "—";
  return `${bn(Math.floor(seconds / 60))}মি ${bn(seconds % 60)}সে`;
}

/** Every ranked attempt of the exam (first attempts only — retakes carry no rank), best first. */
export function rankedOnly(attempts: ExamAttempt[]) {
  return attempts.filter((a) => Number(a.rank) > 0).sort((a, b) => a.rank - b.rank);
}

export function leaderboardStats(exam: Exam, ranked: ExamAttempt[]) {
  const marks = ranked.map((a) => Number(a.final_marks || 0));
  const total = Number(exam.total_marks || 0);
  return {
    participants: ranked.length,
    highest: marks.length ? Math.max(...marks) : 0,
    average: marks.length ? marks.reduce((s, m) => s + m, 0) / marks.length : 0,
    passed: ranked.filter((a) => a.is_passed).length,
    total,
  };
}

/** Photos as data URLs so html2canvas never trips over a cross-origin image. */
async function photoDataUrls(attempts: ExamAttempt[]) {
  const map = new Map<number, string>();
  await Promise.all(
    attempts.map(async (a) => {
      const url = getMediaUrl(a.student_image);
      if (!url) return;
      try {
        const blob = await (await fetch(url, { mode: "cors" })).blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        map.set(a.id, dataUrl);
      } catch {
        // No photo — the card falls back to the student's initial.
      }
    }),
  );
  return map;
}

/** Image URLs straight from the API, for showing the card on screen. */
export function livePhotoUrls(attempts: ExamAttempt[]) {
  const map = new Map<number, string>();
  attempts.forEach((a) => {
    const url = getMediaUrl(a.student_image);
    if (url) map.set(a.id, url);
  });
  return map;
}

function avatar(attempt: ExamAttempt, photos: Map<number, string>, size: number, ring: string) {
  const src = photos.get(attempt.id);
  const name = attempt.student_name || "?";
  const inner = src
    ? `<img src="${esc(src)}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
    : `<span style="font-size:${Math.round(size * 0.42)}px;font-weight:700;color:#fff;">${esc(name.trim().charAt(0) || "?")}</span>`;
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;border:4px solid ${ring};overflow:hidden;background:linear-gradient(135deg,#06b6d4,#3b82f6);display:flex;align-items:center;justify-content:center;margin:0 auto;box-shadow:0 6px 16px rgba(15,23,42,.18);">${inner}</div>`;
}

/** The 2nd · 1st · 3rd podium, shared by the PDF and the top-3 card. */
function podium(top: ExamAttempt[], photos: Map<number, string>, totalMarks: number, scale = 1) {
  const order = [1, 0, 2];
  const heights = [118, 150, 96].map((h) => h * scale);
  const cards = order
    .map((i) => {
      const a = top[i];
      if (!a) return `<div style="flex:1;"></div>`;
      const m = MEDALS[i];
      const first = i === 0;
      const size = Math.round((first ? 104 : 84) * scale);
      const marks = Number(a.final_marks || 0);
      return `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;">
          ${first ? `<div style="font-size:${30 * scale}px;line-height:1;margin-bottom:${6 * scale}px;">👑</div>` : ""}
          ${avatar(a, photos, size, m.ring)}
          <div style="margin-top:${8 * scale}px;text-align:center;width:100%;padding:0 6px;box-sizing:border-box;">
            <div style="font-size:${(first ? 17 : 15) * scale}px;font-weight:700;color:#0f172a;line-height:1.3;max-height:2.6em;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;word-break:break-word;">${esc(a.student_name || `Student #${a.student}`)}</div>
            <div style="font-size:${11 * scale}px;color:#64748b;margin-top:2px;">আইডি #${bn(a.student)}</div>
          </div>
          <div style="margin-top:${8 * scale}px;width:92%;height:${heights[order.indexOf(i)]}px;border-radius:${16 * scale}px ${16 * scale}px 0 0;background:linear-gradient(180deg,${m.from},${m.to});display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:${12 * scale}px;box-sizing:border-box;box-shadow:inset 0 2px 0 rgba(255,255,255,.6);">
            <div style="font-size:${(first ? 30 : 24) * scale}px;font-weight:800;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.25);">${m.label}</div>
            <div style="margin-top:${4 * scale}px;background:rgba(255,255,255,.92);border-radius:999px;padding:${3 * scale}px ${12 * scale}px;font-size:${13 * scale}px;font-weight:700;color:#0f172a;">${num(marks)}${totalMarks ? ` / ${num(totalMarks)}` : ""}</div>
          </div>
        </div>`;
    })
    .join("");
  return `<div style="display:flex;align-items:flex-end;gap:${10 * scale}px;">${cards}</div>`;
}

function examMeta(exam: Exam) {
  return [exam.course_title ? `কোর্স: ${exam.course_title}` : "", exam.exam_date ? `তারিখ: ${exam.exam_date}` : ""]
    .filter(Boolean)
    .map(esc)
    .join(" &nbsp;•&nbsp; ");
}

/** A square, share-ready card of the top three (also shown in the admin modal). */
export function buildTopThreeHtml(exam: Exam, top: ExamAttempt[], photos: Map<number, string>) {
  const total = Number(exam.total_marks || 0);
  return `
    <div style="font-family:'${FONT}',sans-serif;width:720px;box-sizing:border-box;padding:32px 32px 0;background:radial-gradient(circle at 50% 0%,#e0f2fe 0%,#ffffff 55%),#ffffff;border-radius:24px;overflow:hidden;color:#0f172a;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="${LOGO}" style="height:40px;" />
          <span style="font-size:16px;font-weight:700;color:#1e3a8a;">${BRAND}</span>
        </div>
        <span style="background:#1e3a8a;color:#fff;border-radius:999px;padding:6px 14px;font-size:13px;font-weight:700;">মেধা তালিকা</span>
      </div>
      <div style="text-align:center;margin-top:22px;">
        <div style="font-size:15px;letter-spacing:.5px;color:#0369a1;font-weight:700;">🏆 সেরা ৩ জন 🏆</div>
        <div style="font-size:26px;font-weight:800;margin-top:6px;line-height:1.3;">${esc(exam.title)}</div>
        <div style="font-size:13px;color:#64748b;margin-top:6px;">${examMeta(exam)}</div>
      </div>
      <div style="margin-top:26px;">${podium(top, photos, total, 1.15)}</div>
      <div style="background:linear-gradient(90deg,#1e3a8a,#0891b2);color:#fff;text-align:center;padding:12px;font-size:14px;font-weight:600;margin:0 -32px;">
        অভিনন্দন! সবার জন্য শুভকামনা
      </div>
    </div>`;
}

function rowHtml(a: ExamAttempt, total: number, index: number) {
  const marks = Number(a.final_marks || 0);
  const pct = total ? (marks / total) * 100 : 0;
  const medal = a.rank <= 3 ? MEDALS[a.rank - 1] : null;
  const rankCell = medal
    ? `<span style="display:inline-block;min-width:30px;padding:2px 8px;border-radius:999px;background:linear-gradient(135deg,${medal.from},${medal.to});color:#fff;font-weight:800;">${bn(a.rank)}</span>`
    : `<span style="font-weight:700;color:#334155;">${bn(a.rank)}</span>`;
  const bg = medal ? medal.soft : index % 2 ? "#f8fafc" : "#ffffff";
  const td = "padding:0 8px;border-bottom:1px solid #e2e8f0;height:29px;box-sizing:border-box;";
  return `<tr style="background:${bg};">
    <td style="${td}text-align:center;">${rankCell}</td>
    <td style="${td}font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(a.student_name || `Student #${a.student}`)}</td>
    <td style="${td}color:#64748b;">#${bn(a.student)}</td>
    <td style="${td}text-align:center;color:#475569;">${bn(a.correct_count)} / ${bn(a.wrong_count)} / ${bn(a.unanswered_count)}</td>
    <td style="${td}text-align:center;font-weight:700;">${num(marks)}</td>
    <td style="${td}text-align:center;">${num(pct)}%</td>
    <td style="${td}text-align:center;color:#475569;">${duration(a.time_taken_seconds)}</td>
    <td style="${td}text-align:center;"><span style="font-weight:700;color:${a.is_passed ? "#059669" : "#dc2626"};">${a.is_passed ? "পাস" : "ফেল"}</span></td>
  </tr>`;
}

function tableHtml(rows: ExamAttempt[], total: number, offset: number) {
  const th = "padding:8px;font-weight:700;font-size:11px;";
  return `<table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:11.5px;">
    <thead><tr style="background:#1e3a8a;color:#fff;">
      <th style="${th}width:52px;">র‍্যাঙ্ক</th><th style="${th}text-align:left;">শিক্ষার্থী</th><th style="${th}text-align:left;width:70px;">আইডি</th>
      <th style="${th}width:96px;">সঠিক/ভুল/ফাঁকা</th><th style="${th}width:64px;">নম্বর</th><th style="${th}width:60px;">শতকরা</th>
      <th style="${th}width:70px;">সময়</th><th style="${th}width:52px;">ফলাফল</th>
    </tr></thead>
    <tbody>${rows.map((a, i) => rowHtml(a, total, offset + i)).join("")}</tbody>
  </table>`;
}

function pageHtml(body: string, pageNo: number, pages: number, exam: Exam) {
  const printed = new Date().toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });
  return `<div style="font-family:'${FONT}',sans-serif;width:${PAGE_W}px;height:${PAGE_H}px;box-sizing:border-box;padding:28px 30px;background:#fff;color:#0f172a;display:flex;flex-direction:column;">
    <div style="flex:1;overflow:hidden;">${body}</div>
    <div style="display:flex;justify-content:space-between;border-top:1px solid #e2e8f0;padding-top:8px;font-size:10px;color:#94a3b8;">
      <span>${BRAND} • ${esc(exam.title)}</span><span>ডাউনলোড: ${printed}</span><span>পৃষ্ঠা ${bn(pageNo)} / ${bn(pages)}</span>
    </div>
  </div>`;
}

function firstPageHead(exam: Exam, ranked: ExamAttempt[], photos: Map<number, string>) {
  const s = leaderboardStats(exam, ranked);
  const stat = (label: string, value: string, color: string) =>
    `<div style="flex:1;border:1px solid #e2e8f0;border-radius:14px;padding:10px 12px;background:#fff;">
       <div style="font-size:10.5px;color:#64748b;">${label}</div>
       <div style="font-size:18px;font-weight:800;color:${color};margin-top:2px;">${value}</div>
     </div>`;
  return `
    <div style="border-radius:18px;padding:18px 22px;background:linear-gradient(120deg,#1e3a8a,#0e7490);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:16px;">
      <div>
        <div style="font-size:12px;opacity:.85;">${BRAND}</div>
        <div style="font-size:24px;font-weight:800;margin-top:2px;">🏆 লিডারবোর্ড</div>
        <div style="font-size:15px;font-weight:600;margin-top:4px;">${esc(exam.title)}</div>
        <div style="font-size:11.5px;opacity:.85;margin-top:4px;">${examMeta(exam)}</div>
      </div>
      <div style="background:#fff;border-radius:14px;padding:8px 10px;"><img src="${LOGO}" style="height:46px;display:block;" /></div>
    </div>
    <div style="display:flex;gap:10px;margin-top:14px;">
      ${stat("অংশগ্রহণকারী", `${bn(s.participants)} জন`, "#1e3a8a")}
      ${stat("সর্বোচ্চ নম্বর", `${num(s.highest)}${s.total ? ` / ${num(s.total)}` : ""}`, "#d97706")}
      ${stat("গড় নম্বর", num(s.average), "#0e7490")}
      ${stat("পাস করেছে", `${bn(s.passed)} জন`, "#059669")}
    </div>
    <div style="margin-top:18px;padding:16px 10px 0;border-radius:18px;background:linear-gradient(180deg,#f0f9ff,#ffffff);border:1px solid #e0f2fe;">
      ${podium(ranked.slice(0, 3), photos, s.total, 0.8)}
    </div>
    <div style="margin:16px 0 8px;font-size:14px;font-weight:800;color:#1e3a8a;">সম্পূর্ণ মেধা তালিকা</div>`;
}

/** One HTML string per A4 page: header, stats and podium on page 1, then the ranked table. */
export function buildLeaderboardPages(exam: Exam, ranked: ExamAttempt[], photos: Map<number, string>) {
  const total = Number(exam.total_marks || 0);
  const chunks: ExamAttempt[][] = [ranked.slice(0, FIRST_PAGE_ROWS)];
  for (let i = FIRST_PAGE_ROWS; i < ranked.length; i += ROWS_PER_PAGE) chunks.push(ranked.slice(i, i + ROWS_PER_PAGE));
  let offset = 0;
  return chunks.map((rows, p) => {
    const head = p === 0 ? firstPageHead(exam, ranked, photos) : "";
    const body = head + (rows.length ? tableHtml(rows, total, offset) : "");
    offset += rows.length;
    return pageHtml(body, p + 1, chunks.length, exam);
  });
}

export function renderLeaderboardHtml(html: string, width: number, scale = 2) {
  return render(html, width, scale);
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

let fontDataUrl: Promise<string> | null = null;
function fontAsDataUrl() {
  if (!fontDataUrl) {
    fontDataUrl = fetch(FONT_URL)
      .then((res) => res.blob())
      .then((blob) => blobToDataUrl(new Blob([blob], { type: "font/ttf" })))
      .catch((err) => {
        fontDataUrl = null;
        throw err;
      });
  }
  return fontDataUrl;
}

/**
 * Let the browser itself paint the HTML (SVG foreignObject), so Bangla is
 * shaped and spaced exactly as on screen. html2canvas lays text out word by
 * word and misplaces spaces and punctuation in Bangla; it is only the
 * fallback for browsers that refuse to export a foreignObject canvas.
 */
async function renderNative(el: HTMLElement, scale: number) {
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  const font = await fontAsDataUrl();
  const xhtml = new XMLSerializer().serializeToString(el);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<foreignObject x="0" y="0" width="100%" height="100%">` +
    `<div xmlns="http://www.w3.org/1999/xhtml"><style>@font-face{font-family:'${FONT}';src:url(${font}) format('truetype');}</style>${xhtml}</div>` +
    `</foreignObject></svg>`;
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, width, height);
  canvas.toDataURL(); // throws if the browser tainted the canvas → fallback
  return canvas;
}

async function render(html: string, width: number, scale: number) {
  const box = document.createElement("div");
  box.style.cssText = `position:fixed;left:-20000px;top:0;width:${width}px;`;
  box.innerHTML = html;
  document.body.appendChild(box);
  try {
    // Inside an SVG image only data: URLs load, so inline every picture.
    await Promise.all(
      Array.from(box.querySelectorAll("img")).map(async (img) => {
        if (!img.src.startsWith("data:")) {
          try {
            img.src = await blobToDataUrl(await (await fetch(img.src, { mode: "cors" })).blob());
          } catch {
            // Leave it; html2canvas fallback may still manage it.
          }
        }
        if (!img.complete) await new Promise((r) => ((img.onload = r), (img.onerror = r)));
      }),
    );
    const el = box.firstElementChild as HTMLElement;
    try {
      return await renderNative(el, scale);
    } catch {
      return await html2canvas(el, { scale, backgroundColor: null, useCORS: true });
    }
  } finally {
    document.body.removeChild(box);
  }
}

const fileSafe = (title: string) => title.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "-").slice(0, 60);

export async function downloadLeaderboardPdf(exam: Exam, attempts: ExamAttempt[]) {
  await loadLeaderboardFont();
  const ranked = rankedOnly(attempts);
  const pages = buildLeaderboardPages(exam, ranked, await photoDataUrls(ranked.slice(0, 3)));

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  for (let p = 0; p < pages.length; p++) {
    const canvas = await renderLeaderboardHtml(pages[p], PAGE_W);
    if (p > 0) doc.addPage();
    doc.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageW, pageH);
  }
  doc.save(`leaderboard-${fileSafe(exam.title)}.pdf`);
}

export async function downloadTopThreePng(exam: Exam, attempts: ExamAttempt[]) {
  await loadLeaderboardFont();
  const top = rankedOnly(attempts).slice(0, 3);
  const photos = await photoDataUrls(top);
  const canvas = await renderLeaderboardHtml(buildTopThreeHtml(exam, top, photos), 720);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `top-3-${fileSafe(exam.title)}.png`;
  link.click();
}
