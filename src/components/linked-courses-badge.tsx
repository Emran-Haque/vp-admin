"use client";

import { useEffect, useRef, useState } from "react";
import { Link2, Unlink } from "lucide-react";
import ConfirmActionDialog from "@/components/confirm-action-dialog";
import { extractErrorMessage } from "@/lib/api-error";
import { useUnlinkFromCoursesMutation, type LinkKind } from "@/redux/api/linkingApi";

type Props = {
  kind: LinkKind;
  id: number;
  /** The other courses this exam/class is linked into. */
  linked: { course: number; course_title: string }[];
  canUnlink?: boolean;
  className?: string;
};

const POPOVER_WIDTH = 288;

/**
 * "🔗 আরও ২টি কোর্সে যুক্ত" — tells the admin an edit here changes every listed
 * course too, and offers to make this course's copy independent.
 *
 * The popover is `position: fixed` at the button's on-screen spot: the cards
 * it sits in clip overflow, which would otherwise cut it off.
 */
export default function LinkedCoursesBadge({ kind, id, linked, canUnlink = false, className = "" }: Props) {
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlink, { isLoading }] = useUnlinkFromCoursesMutation();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const open = anchor !== null;

  useEffect(() => {
    if (!open) return;
    const close = () => setAnchor(null);
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  if (linked.length === 0) return null;

  const names = linked.map((row) => row.course_title).join(", ");
  const noun = kind === "exam" ? "পরীক্ষা" : "ক্লাস";

  const toggle = () => {
    if (open) {
      setAnchor(null);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 8));
    setAnchor({ top: rect.bottom + 8, left });
  };

  return (
    <span className={`inline-flex ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        title={`এই ${noun} এই কোর্সগুলোতেও আছে: ${names}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20"
      >
        <Link2 size={13} />
        আরও {linked.length}টি কোর্সে যুক্ত
      </button>
      {anchor ? (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`যুক্ত কোর্স`}
          style={{ position: "fixed", top: anchor.top, left: anchor.left, width: POPOVER_WIDTH }}
          className="z-[60] rounded-2xl border border-slate-700 bg-slate-900 p-3.5 text-left shadow-[0px_20px_40px_-12px_rgba(0,0,0,0.7)]"
        >
          <p className="text-xs font-bold text-slate-300">এই {noun} এই কোর্সগুলোতেও আছে:</p>
          <div className="mt-2 flex max-h-48 flex-col gap-1 overflow-y-auto">
            {linked.map((row) => (
              <span key={row.course} className="truncate rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-blue-50">
                {row.course_title}
              </span>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] leading-5 text-slate-500">
            যেকোনো কোর্স থেকে এডিট করলে সবগুলোতে একসাথে বদলাবে। ফলাফল প্রতিটি কোর্সে আলাদা।
          </p>
          {error ? <p className="mt-2 text-[11px] text-red-400">{error}</p> : null}
          {canUnlink ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-500/20"
            >
              <Unlink size={12} /> এই কোর্সের কপি আলাদা করুন
            </button>
          ) : null}
        </div>
      ) : null}
      <ConfirmActionDialog
        open={confirming}
        title="লিংক বিচ্ছিন্ন করবেন?"
        message={`এই কোর্সের ${noun}টি আলাদা হয়ে যাবে। এরপর এখানে এডিট করলে অন্য কোর্সে বদলাবে না, অন্য কোর্সে এডিট করলেও এখানে বদলাবে না। কোনো প্রশ্ন বা ফলাফল মুছবে না।`}
        confirmLabel="আলাদা করুন"
        isLoading={isLoading}
        onClose={() => setConfirming(false)}
        onConfirm={async () => {
          setError(null);
          try {
            await unlink({ kind, id }).unwrap();
            setConfirming(false);
            setAnchor(null);
          } catch (err) {
            setError(extractErrorMessage(err));
            setConfirming(false);
          }
        }}
      />
    </span>
  );
}
