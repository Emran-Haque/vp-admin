/**
 * Short share links to the student site. Each one is a real 307 there (see
 * the student site's src/shortLinks.ts) to the login page, which forwards a
 * logged-in student straight on and shows WhatsApp/Messenger a link preview.
 *
 *   course:              /c/12        → my course 12
 *   model test/free MCQ: /t/12/45     → exam 45 (12 = its course, for the preview image)
 *   exam batch:          /b/7         → batch 7 (a free batch is joined on arrival)
 */
const STUDENT_SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_STUDENT_SITE_URL ?? "https://www.vaiyaderpathshala.com"
).replace(/\/$/, "");

export const courseShareUrl = (courseId: number) => `${STUDENT_SITE_ORIGIN}/c/${courseId}`;

export const examShareUrl = (examId: number, courseId: number) =>
  `${STUDENT_SITE_ORIGIN}/t/${courseId}/${examId}`;

export const batchShareUrl = (batchId: number) => `${STUDENT_SITE_ORIGIN}/b/${batchId}`;

/** Copy to the clipboard, falling back for older browsers / insecure contexts. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}
