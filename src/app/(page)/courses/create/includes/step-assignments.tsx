"use client";

import { ClipboardList } from "lucide-react";
import AssignmentsPanel from "../../includes/assignments-panel";

type Props = {
  courseId?: number;
};

export default function StepAssignments({ courseId }: Props) {
  if (!courseId) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center">
          <ClipboardList size={32} className="mx-auto text-slate-500" />
          <p className="mt-3 text-base font-semibold text-blue-50">Save the course draft first</p>
          <p className="mt-2 text-sm text-slate-400">
            Assignments are connected to a saved course and class. Click next from the previous step or use Save Draft,
            then add assignments here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <AssignmentsPanel courseId={courseId} compact />
    </section>
  );
}
