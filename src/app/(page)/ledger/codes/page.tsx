"use client";

import { useState } from "react";
import { Ban, Copy, KeyRound, Search } from "lucide-react";
import {
  useCancelChangeCodeMutation,
  useGetChangeCodesQuery,
  type ChangeCode,
} from "@/redux/api/ledgersApi";
import ErrorState from "@/components/error-state";
import { PageLoader } from "@/components/loaders";
import LedgerTabs from "../includes/ledger-tabs";
import { bdt } from "../includes/schedule-editor";

const statusMeta: Record<ChangeCode["effective_status"], { label: string; className: string }> = {
  issued: { label: "সক্রিয়", className: "border-sky-800 bg-sky-950/40 text-sky-300" },
  applied: { label: "ব্যবহৃত", className: "border-emerald-800 bg-emerald-950/40 text-emerald-300" },
  expired: { label: "মেয়াদোত্তীর্ণ", className: "border-slate-700 bg-slate-800 text-slate-400" },
  cancelled: { label: "বাতিল", className: "border-slate-700 bg-slate-800 text-slate-400" },
  outdated: { label: "অচল (ব্যালেন্স বদলেছে)", className: "border-amber-800 bg-amber-950/40 text-amber-300" },
};

export default function Page() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useGetChangeCodesQuery({
    search: search || undefined,
    status: status || undefined,
    page,
  });
  const [cancelCode, { isLoading: cancelling }] = useCancelChangeCodeMutation();
  const rows = data?.results ?? [];

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard is blocked in some browsers; the code is on screen anyway.
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-7">
        <div className="flex items-center gap-2 text-slate-100">
          <KeyRound className="size-5" />
          <h1 className="text-xl font-semibold">ইনস্টলমেন্ট কোড হিস্ট্রি</h1>
        </div>
        <p className="mt-1.5 max-w-3xl text-sm text-slate-400">
          যত কোড তৈরি হয়েছে — কে বানিয়েছে, কার জন্য, কী কারণে এবং শিক্ষার্থী ব্যবহার করেছে
          কি না। ব্যবহারের আগে যেকোনো কোড বাতিল করা যায়।
        </p>
      </div>

      <LedgerTabs />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="কোড, শিক্ষার্থীর নাম বা ফোন"
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-slate-600"
          />
        </div>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-slate-600"
        >
          <option value="">সব অবস্থা</option>
          <option value="issued">সক্রিয়</option>
          <option value="applied">ব্যবহৃত</option>
          <option value="cancelled">বাতিল</option>
        </select>
      </div>

      {isLoading ? (
        <PageLoader label="কোড তালিকা লোড হচ্ছে…" />
      ) : isError ? (
        <ErrorState message="কোড তালিকা আনতে সমস্যা হয়েছে।" error={error} />
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-12 text-center text-sm text-slate-400">
          এখনো কোনো কোড তৈরি হয়নি। একটি লেজার খুলে “কোড তৈরি করুন” চাপুন।
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => {
            const meta = statusMeta[row.effective_status];
            return (
              <div
                key={row.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-sky-300">
                        {row.code}
                      </code>
                      <button
                        type="button"
                        onClick={() => copy(row.code)}
                        className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800"
                        aria-label="কোড কপি করুন"
                      >
                        <Copy className="size-3.5" />
                      </button>
                      {copied === row.code && (
                        <span className="text-xs text-emerald-400">কপি হয়েছে</span>
                      )}
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${meta.className}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-200">
                      {row.student_name}{" "}
                      <span className="text-slate-500">· {row.course_title}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.student_phone} · তৈরি {row.created_at.slice(0, 10)}
                      {row.created_by_name && ` · ${row.created_by_name}`}
                    </p>
                  </div>

                  {row.effective_status === "issued" && (
                    <button
                      type="button"
                      disabled={cancelling}
                      onClick={() => cancelCode(row.id)}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-800 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-950/40 disabled:opacity-40"
                    >
                      <Ban className="size-3.5" /> বাতিল করুন
                    </button>
                  )}
                </div>

                {row.effective_status === "outdated" && (
                  <p className="mt-2.5 rounded-xl border border-amber-800 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
                    কোডটি {bdt(row.balance_snapshot)} বকেয়ার উপর তৈরি, এখন বকেয়া{" "}
                    {bdt(row.current_balance)}। শিক্ষার্থী এটি আর ব্যবহার করতে পারবেন না — নতুন
                    কোড তৈরি করুন।
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {row.proposed_rows.map((item, index) => (
                    <span
                      key={index}
                      className="rounded-lg border border-slate-700 px-2 py-0.5 text-xs text-slate-300"
                    >
                      {bdt(item.amount)} · {item.due_date}
                    </span>
                  ))}
                  <span className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-0.5 text-xs font-medium text-slate-200">
                    মোট {bdt(row.proposed_total)}
                  </span>
                </div>

                {(row.reason || row.discussion_note) && (
                  <p className="mt-2 text-xs text-slate-500">
                    {row.reason && <>কারণ: {row.reason} </>}
                    {row.discussion_note && <>· নোট: {row.discussion_note}</>}
                  </p>
                )}

                <p className="mt-2 text-xs text-slate-600">
                  {row.applied_at
                    ? `শিক্ষার্থী নিশ্চিত করেছেন ${row.applied_at.slice(0, 16).replace("T", " ")}`
                    : `মেয়াদ ${row.expires_at.slice(0, 16).replace("T", " ")} পর্যন্ত`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {(data?.next || data?.previous) && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={!data?.previous}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-30"
          >
            আগের
          </button>
          <span className="text-sm text-slate-500">পাতা {page}</span>
          <button
            type="button"
            disabled={!data?.next}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-30"
          >
            পরের
          </button>
        </div>
      )}
    </div>
  );
}
