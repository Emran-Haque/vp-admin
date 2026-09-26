"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { useGetStudentDeviceHistoryQuery, type DeviceEvent } from "@/redux/api/deviceLockApi";
import { actorLabel, eventStyles, formatDateTime } from "@/lib/device-lock";
import ErrorState from "@/components/error-state";

/**
 * A student's login history, newest first: every device lock, blocked sign-in,
 * request and decision, with who made it. Nothing is ever deleted from it.
 * Pages load one after another under a "আরও দেখুন" button.
 */
export default function DeviceHistory({ studentId }: { studentId: number }) {
  const [pages, setPages] = useState(1);

  return (
    <section>
      <p className="flex items-center gap-1.5 pb-2 text-xs font-semibold text-slate-400">
        <History size={13} /> লগইন ইতিহাস
      </p>
      <ol className="flex flex-col gap-2">
        {Array.from({ length: pages }, (_, index) => (
          <HistoryPage
            key={index}
            studentId={studentId}
            page={index + 1}
            isLast={index + 1 === pages}
            onMore={() => setPages((count) => count + 1)}
          />
        ))}
      </ol>
    </section>
  );
}

function HistoryPage({
  studentId,
  page,
  isLast,
  onMore,
}: {
  studentId: number;
  page: number;
  isLast: boolean;
  onMore: () => void;
}) {
  const { data, isLoading, isError, error } = useGetStudentDeviceHistoryQuery({ studentId, page });

  if (isLoading) {
    return <li className="py-3 text-center text-xs text-slate-500">ইতিহাস লোড হচ্ছে…</li>;
  }
  if (isError) {
    return (
      <li>
        <ErrorState message="লগইন ইতিহাস আনা যায়নি।" error={error} />
      </li>
    );
  }
  const events = data?.results ?? [];
  if (page === 1 && events.length === 0) {
    return (
      <li className="rounded-[10px] border border-dashed border-slate-800 p-4 text-center text-xs text-slate-400">
        এখনো কোনো লগইন ইতিহাস নেই।
      </li>
    );
  }

  return (
    <>
      {events.map((event) => (
        <HistoryRow key={event.id} event={event} />
      ))}
      {isLast && data?.next ? (
        <li>
          <button
            type="button"
            onClick={onMore}
            className="w-full rounded-[10px] border border-white/10 bg-white/5 py-2 text-xs font-bold text-slate-300 transition-colors hover:bg-white/10"
          >
            আরও দেখুন
          </button>
        </li>
      ) : null}
    </>
  );
}

function HistoryRow({ event }: { event: DeviceEvent }) {
  const style = eventStyles[event.kind] ?? { label: event.kind_label, dot: "bg-slate-400" };

  let device = event.device_label;
  if (event.kind === "request_approved") {
    device = `${event.previous_device_label || "—"} → ${event.device_label}`;
  } else if (event.kind === "logout_all") {
    device = event.previous_device_label ? `যে ডিভাইসে ছিল: ${event.previous_device_label}` : "";
  } else if (event.kind === "login_blocked" && event.previous_device_label) {
    device = `${event.device_label} (অ্যাকাউন্ট চালু ছিল ${event.previous_device_label}-এ)`;
  }

  return (
    <li className="flex gap-3 rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5">
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="text-sm font-semibold text-slate-200">{style.label}</p>
          <p className="text-[11px] text-slate-500">{formatDateTime(event.created_at)}</p>
        </div>
        {device ? <p className="mt-0.5 text-xs text-slate-300">{device}</p> : null}
        {event.note ? (
          <p className="mt-1 rounded-md bg-white/5 px-2 py-1 text-xs text-slate-300">“{event.note}”</p>
        ) : null}
        <p className="mt-1 text-[11px] text-slate-500">
          {actorLabel(event)}
          {event.ip_address ? ` · IP ${event.ip_address}` : ""}
        </p>
      </div>
    </li>
  );
}
