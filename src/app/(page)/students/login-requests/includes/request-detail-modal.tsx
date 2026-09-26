"use client";

import { useState } from "react";
import { AlertTriangle, Check, Smartphone, X } from "lucide-react";
import { useGetDeviceRequestQuery } from "@/redux/api/deviceLockApi";
import { usePermissions } from "@/hooks/use-permissions";
import ErrorState from "@/components/error-state";
import { formatDateTime, localPhone, requestStatusStyles } from "@/lib/device-lock";
import DeviceHistory from "../../includes/device-history";
import DecisionDialog, { type Decision } from "./decision-dialog";

/** One request in full: both devices, the reason, earlier requests and history. */
export default function RequestDetailModal({
  requestId,
  onClose,
}: {
  requestId: number;
  onClose: () => void;
}) {
  const { data: request, isLoading, isError, error } = useGetDeviceRequestQuery(requestId);
  const { hasPermission } = usePermissions();
  const [decision, setDecision] = useState<Decision | null>(null);
  const canDecide = hasPermission("can_manage_login_requests") && request?.status === "pending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="flex max-h-[88vh] w-full max-w-[680px] flex-col rounded-[20px] border border-white/5 bg-gray-900/95 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-base font-bold text-slate-50">লগইন রিকোয়েস্টের বিস্তারিত</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          {isLoading ? <p className="text-center text-sm text-slate-400">তথ্য লোড হচ্ছে…</p> : null}
          {isError ? <ErrorState message="রিকোয়েস্টটি আনা যায়নি।" error={error} /> : null}

          {request ? (
            <>
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-lg font-semibold text-blue-50">{request.student.full_name}</p>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${requestStatusStyles[request.status].className}`}
                >
                  {requestStatusStyles[request.status].label}
                </span>
              </div>
              <p className="-mt-2 text-xs text-slate-400">
                {localPhone(request.student.phone)}
                {request.student.student_id ? ` · স্টুডেন্ট আইডি ${request.student.student_id}` : ""}
                {request.student.email ? ` · ${request.student.email}` : ""}
              </p>

              {request.is_frequent ? (
                <p className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-xs text-red-300">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  শেষ ৩০ দিনে {request.recent_request_count.toLocaleString("bn-BD")}টি রিকোয়েস্ট — অ্যাকাউন্টটি
                  শেয়ার হচ্ছে কিনা যাচাই করুন।
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[12px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold text-slate-400">বর্তমান ডিভাইস</p>
                  {request.locked_device ? (
                    <>
                      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-200">
                        <Smartphone size={14} className="text-slate-400" />
                        {request.locked_device.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        যুক্ত: {formatDateTime(request.locked_device.bound_at)}
                      </p>
                      <p className="text-xs text-slate-400">
                        শেষ ব্যবহার: {formatDateTime(request.locked_device.last_seen_at)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1.5 text-sm text-slate-400">কোনো ডিভাইস যুক্ত নেই</p>
                  )}
                </div>
                <div className="rounded-[12px] border border-cyan-500/30 bg-cyan-500/5 p-4">
                  <p className="text-xs font-semibold text-cyan-300">রিকোয়েস্ট করা ডিভাইস</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-100">
                    <Smartphone size={14} className="text-cyan-300" />
                    {request.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">রিকোয়েস্ট: {formatDateTime(request.created_at)}</p>
                  {request.ip_address ? <p className="text-xs text-slate-400">IP {request.ip_address}</p> : null}
                  {request.user_agent ? (
                    <p className="mt-1 break-all text-[10px] leading-snug text-slate-500">{request.user_agent}</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[12px] border border-white/10 bg-white/5 p-4 text-sm">
                <p className="text-slate-200">
                  <span className="font-semibold">কারণ:</span> {request.reason_label}
                </p>
                {request.note ? <p className="mt-1 text-slate-300">“{request.note}”</p> : null}
                {request.reviewed_by ? (
                  <p className="mt-2 text-xs text-slate-400">
                    {requestStatusStyles[request.status].label}: {request.reviewed_by.full_name},{" "}
                    {formatDateTime(request.reviewed_at)}
                    {request.admin_note ? ` — “${request.admin_note}”` : ""}
                  </p>
                ) : null}
              </div>

              <div>
                <p className="pb-2 text-xs font-semibold text-slate-400">
                  এই শিক্ষার্থীর আগের রিকোয়েস্ট ({request.previous_requests.length.toLocaleString("bn-BD")})
                </p>
                {request.previous_requests.length === 0 ? (
                  <p className="rounded-[10px] border border-dashed border-slate-800 p-3 text-center text-xs text-slate-400">
                    এটিই প্রথম রিকোয়েস্ট।
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {request.previous_requests.map((previous) => (
                      <li
                        key={previous.id}
                        className="flex flex-wrap items-center gap-2 rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2 text-xs"
                      >
                        <span
                          className={`rounded-full border px-2 py-0.5 font-bold ${requestStatusStyles[previous.status].className}`}
                        >
                          {requestStatusStyles[previous.status].label}
                        </span>
                        <span className="text-slate-200">{previous.label}</span>
                        <span className="text-slate-500">{formatDateTime(previous.created_at)}</span>
                        <span className="text-slate-400">· {previous.reason_label}</span>
                        {previous.admin_note ? (
                          <span className="text-slate-400">· “{previous.admin_note}”</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <DeviceHistory studentId={request.student.id} />
            </>
          ) : null}
        </div>

        <div className="flex justify-end gap-2.5 p-6 pt-0">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-[10px] border border-slate-400/20 bg-slate-400/5 px-4 py-2 text-xs font-bold text-slate-400"
          >
            বন্ধ করুন
          </button>
          {canDecide ? (
            <>
              <button
                type="button"
                onClick={() => setDecision("reject")}
                className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-red-500/15 px-4 py-2 text-xs font-bold text-red-300"
              >
                <X size={14} />
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={() => setDecision("approve")}
                className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300"
              >
                <Check size={14} />
                অনুমোদন করুন
              </button>
            </>
          ) : null}
        </div>
      </div>

      {decision && request ? (
        <DecisionDialog decision={decision} onClose={() => setDecision(null)} request={request} />
      ) : null}
    </div>
  );
}
