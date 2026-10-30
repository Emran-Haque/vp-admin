"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePermissions } from "@/hooks/use-permissions";
import StudentDetailModal from "@/app/(page)/students/includes/student-detail-modal";

type Props = {
  /** The student's user id. Without one the name is shown as plain text. */
  studentId: number | null | undefined;
  children: ReactNode;
  className?: string;
};

/**
 * A student's name that opens the Students → details popup on click.
 *
 * Plain text for staff who cannot view students, so they never get a popup
 * that only says "error". The click does not reach the surrounding row, so a
 * clickable row (e.g. the Results answer sheet) does not open as well.
 */
export default function StudentNameLink({ studentId, children, className = "" }: Props) {
  const { hasPermission } = usePermissions();
  const [open, setOpen] = useState(false);

  if (!studentId || !hasPermission("can_view_students")) {
    return <span className={className}>{children}</span>;
  }

  return (
    <>
      <button
        type="button"
        title="শিক্ষার্থীর বিস্তারিত তথ্য দেখুন"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className={`cursor-pointer text-left underline-offset-2 hover:text-cyan-300 hover:underline ${className}`}
      >
        {children}
      </button>
      {open &&
        createPortal(
          // React events still bubble through a portal to the name's parents;
          // stop them here so clicks inside the popup stay inside it.
          // The z-index keeps it above a popup the name was clicked inside.
          <div className="relative z-[60]" onClick={(event) => event.stopPropagation()}>
            <StudentDetailModal studentId={studentId} onClose={() => setOpen(false)} />
          </div>,
          document.body
        )}
    </>
  );
}
