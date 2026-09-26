"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, Check, Eye, Search, X } from "lucide-react";
import {
  useGetDeviceRequestsQuery,
  type DeviceRequest,
  type DeviceRequestStatus,
} from "@/redux/api/deviceLockApi";
import { usePermissions } from "@/hooks/use-permissions";
import ErrorState from "@/components/error-state";
import { PageLoader } from "@/components/loaders";
import { getApiErrorStatus } from "@/lib/api-error";
import { formatDateTime, localPhone, requestStatusStyles } from "@/lib/device-lock";
import Pagination from "../../includes/pagination";
import DecisionDialog, { type Decision } from "./decision-dialog";
import RequestDetailModal from "./request-detail-modal";

type Tab = DeviceRequestStatus | "all";

const TABS: { value: Tab; label: string }[] = [
  { value: "pending", label: "অপেক্ষমাণ" },
  { value: "approved", label: "অনুমোদিত" },
  { value: "rejected", label: "বাতিল" },
  { value: "all", label: "সকল" },
];

const PAGE_SIZE = 20;

export default function RequestQueue() {
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [deciding, setDeciding] = useState<{ request: DeviceRequest; decision: Decision } | null>(null);
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("can_manage_login_requests");

  const { data, isLoading, isFetching, isError, error } = useGetDeviceRequestsQuery({
    status: tab === "all" ? undefined : tab,
    search: search.trim() || undefined,
    page,
  });
  const requests = data?.results ?? [];

  // Deciding the only request on the last page leaves that page past the end,
  // and the API answers 404. Step back instead of erroring (as /students does).
  if (page > 1 && isError && getApiErrorStatus(error) === 404) {
    setPage(page - 1);
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)] sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-800 bg-gray-900/60 p-1" role="tablist">
          {TABS.map((item) => (
            <button
              aria-selected={tab === item.value}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                tab === item.value ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-slate-200"
              }`}
              key={item.value}
              onClick={() => {
                setTab(item.value);
                setPage(1);
              }}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
          <input
            aria-label="শিক্ষার্থী খুঁজুন"
            className="w-full rounded-xl border border-slate-800 bg-gray-800 py-2.5 pl-9 pr-3 text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="নাম, ফোন বা স্টুডেন্ট আইডি"
            value={search}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {isLoading ? <PageLoader /> : null}
        {isError ? <ErrorState message="লগইন রিকোয়েস্ট লোড করা যায়নি।" error={error} /> : null}

        {!isLoading && !isError && requests.length === 0 ? (
          <p className="py-14 text-center text-sm text-slate-500">
            {tab === "pending" ? "অপেক্ষমাণ কোনো লগইন রিকোয়েস্ট নেই।" : "এই তালিকায় কোনো রিকোয়েস্ট নেই।"}
          </p>
        ) : null}

        {requests.map((request) => (
          <RequestCard
            canManage={canManage}
            key={request.id}
            onApprove={() => setDeciding({ request, decision: "approve" })}
            onReject={() => setDeciding({ request, decision: "reject" })}
            onView={() => setViewingId(request.id)}
            request={request}
          />
        ))}
      </div>

      {!isError && (data?.count ?? 0) > PAGE_SIZE ? (
        <div className="mt-5">
          <Pagination
            count={data?.count ?? 0}
            page={page}
            pageSize={PAGE_SIZE}
            disabled={isFetching}
            onPageChange={setPage}
          />
        </div>
      ) : null}

      {viewingId !== null ? (
        <RequestDetailModal requestId={viewingId} onClose={() => setViewingId(null)} />
      ) : null}
      {deciding ? (
        <DecisionDialog
          decision={deciding.decision}
          onClose={() => setDeciding(null)}
          request={deciding.request}
        />
      ) : null}
    </section>
  );
}

function RequestCard({
  request,
  canManage,
  onView,
  onApprove,
  onReject,
}: {
  request: DeviceRequest;
  canManage: boolean;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const status = requestStatusStyles[request.status];

  return (
    <article className="min-w-0 rounded-2xl border border-slate-800 bg-gray-800 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 truncate text-sm font-bold text-blue-50">{request.student.full_name}</span>
        <span className="text-xs text-slate-400">
          {localPhone(request.student.phone)}
          {request.student.student_id ? ` · ID ${request.student.student_id}` : ""}
        </span>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${status.className}`}>
          {status.label}
        </span>
        {request.is_frequent ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-bold text-red-300">
            <AlertTriangle size={11} />
            প্রায়ই রিকোয়েস্ট · ৩০ দিনে {request.recent_request_count.toLocaleString("bn-BD")}টি
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-lg bg-white/5 px-2.5 py-1 text-slate-300">
          {request.locked_device_label || "কোনো ডিভাইস নেই"}
        </span>
        <ArrowRight size={14} className="text-slate-500" />
        <span className="rounded-lg bg-cyan-500/10 px-2.5 py-1 font-semibold text-cyan-300">{request.label}</span>
      </div>

      <p className="mt-2.5 text-sm text-slate-300">
        <span className="font-semibold text-slate-200">কারণ:</span> {request.reason_label}
        {request.note ? <span className="text-slate-400"> — “{request.note}”</span> : null}
      </p>

      <footer className="mt-3 flex flex-col gap-2.5 border-t border-slate-700/60 pt-3 sm:flex-row sm:items-center sm:gap-3">
        <p className="min-w-0 text-xs text-slate-400">
          {formatDateTime(request.created_at)}
          {request.ip_address ? ` · IP ${request.ip_address}` : ""}
          {request.reviewed_by
            ? ` · ${status.label}: ${request.reviewed_by.full_name}, ${formatDateTime(request.reviewed_at)}`
            : ""}
          {request.admin_note ? ` · “${request.admin_note}”` : ""}
        </p>

        <div className="flex items-center justify-end gap-1.5 sm:ml-auto">
          <button
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:bg-white/10"
            onClick={onView}
            type="button"
          >
            <Eye size={14} />
            বিস্তারিত
          </button>
          {canManage && request.status === "pending" ? (
            <>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/25"
                onClick={onApprove}
                type="button"
              >
                <Check size={14} />
                অনুমোদন
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20"
                onClick={onReject}
                type="button"
              >
                <X size={14} />
                বাতিল
              </button>
            </>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
