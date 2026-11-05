"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import LinkCoursesModal from "@/components/link-courses-modal";
import type { LinkKind } from "@/redux/api/linkingApi";

type Props = {
  kind: LinkKind;
  itemId: number;
  itemTitle: string;
  sourceCourseId: number | null;
  linked: { course: number }[];
  className?: string;
  /** Shorter text for tight cards; the full wording stays in the tooltip. */
  label?: string;
};

const defaultClassName =
  "flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 text-sm font-bold text-cyan-100 transition-colors hover:bg-cyan-500/20";

/** Opens "অন্য কোর্সেও যোগ করুন" for an exam or a class. */
export default function LinkCoursesButton({
  kind,
  itemId,
  itemTitle,
  sourceCourseId,
  linked,
  className,
  label = "অন্য কোর্সেও যোগ করুন",
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? defaultClassName}
        title="অন্য কোর্সেও যোগ করুন — এডিট করলে সব কোর্সে একসাথে বদলাবে"
      >
        <Link2 size={15} />
        {label}
      </button>
      {open ? (
        <LinkCoursesModal
          kind={kind}
          itemId={itemId}
          itemTitle={itemTitle}
          sourceCourseId={sourceCourseId}
          linkedCourseIds={linked.map((row) => row.course)}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
