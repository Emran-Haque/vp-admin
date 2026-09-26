"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

const STUDENT_SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_STUDENT_SITE_URL ?? "https://www.vaiyaderpathshala.com"
).replace(/\/$/, "");

/**
 * The link an admin shares for one model test. It goes through the student
 * login page (same pattern as the course list's copy button): a logged-in
 * student is forwarded straight to the test, anyone else logs in first and
 * then lands on it.
 */
export function modelTestShareUrl(examId: number) {
  const next = encodeURIComponent(`/mcq-exams?exam=${examId}`);
  return `${STUDENT_SITE_ORIGIN}/auth/login?next=${next}`;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API unavailable (older browser / insecure context).
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

export default function CopyExamLinkButton({
  examId,
  isDraft,
}: {
  examId: number;
  isDraft: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const label = copied
    ? isDraft
      ? "লিংক কপি হয়েছে — খসড়া, প্রকাশ না করা পর্যন্ত শিক্ষার্থীরা খুলতে পারবে না"
      : "লিংক কপি হয়েছে"
    : "শিক্ষার্থীদের জন্য মডেল টেস্টের লিংক কপি করুন";

  const handleCopy = async () => {
    if (!(await copyText(modelTestShareUrl(examId)))) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  return (
    <span className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleCopy}
        title={label}
        aria-label={label}
        className={`flex size-8 items-center justify-center rounded-lg border transition-colors ${
          copied
            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
            : "border-slate-700 text-blue-50 hover:bg-white/5"
        }`}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      {copied && isDraft ? (
        <span className="text-[11px] font-semibold text-amber-300">খসড়া</span>
      ) : null}
    </span>
  );
}
