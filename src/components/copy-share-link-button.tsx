"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyText } from "@/lib/share-links";

type Props = {
  url: string;
  /** Tooltip / accessible name before copying. */
  label: string;
  /** Not yet visible to students: say so after copying. */
  isDraft?: boolean;
  /** Show a text label next to the icon (wide rows); icon-only otherwise. */
  text?: string;
  className?: string;
};

/** Copies a short student-site link (see lib/share-links.ts). */
export default function CopyShareLinkButton({ url, label, isDraft = false, text, className }: Props) {
  const [copied, setCopied] = useState(false);
  const tooltip = copied
    ? isDraft
      ? "লিংক কপি হয়েছে — খসড়া, প্রকাশ না করা পর্যন্ত শিক্ষার্থীরা খুলতে পারবে না"
      : `লিংক কপি হয়েছে: ${url}`
    : label;

  const handleCopy = async () => {
    if (!(await copyText(url))) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  const tone = copied
    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
    : "border-slate-700 text-blue-50 hover:bg-white/5";

  return (
    <span className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleCopy}
        title={tooltip}
        aria-label={tooltip}
        className={
          className ??
          `flex items-center justify-center gap-1.5 rounded-lg border transition-colors ${tone} ${
            text ? "h-10 px-3.5 text-sm font-bold" : "size-8"
          }`
        }
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {text ? <span>{copied ? "কপি হয়েছে" : text}</span> : null}
      </button>
      {copied && isDraft ? <span className="text-[11px] font-semibold text-amber-300">খসড়া</span> : null}
    </span>
  );
}
