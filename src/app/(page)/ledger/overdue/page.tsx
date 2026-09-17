"use client";

import { useState } from "react";
import { AlertTriangle, Lock, Phone, ShieldOff } from "lucide-react";
import { useGetOverdueQuery } from "@/redux/api/ledgersApi";
import ErrorState from "@/components/error-state";
import { PageLoader } from "@/components/loaders";
import LedgerTabs from "../includes/ledger-tabs";
import { bdt } from "../includes/schedule-editor";

export default function Page() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useGetOverdueQuery({ page });
  const rows = data?.results ?? [];
  const totalOverdue = rows.reduce((sum, row) => sum + Number(row.overdue_amount), 0);
  const blocked = rows.filter((row) => row.is_suspended).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-7">
        <div className="flex items-center gap-2 text-slate-100">
          <AlertTriangle className="size-5" />
          <h1 className="text-xl font-semibold">ওভারডিউ শিক্ষার্থী</h1>
        </div>
        <p className="mt-1.5 max-w-3xl text-sm text-slate-400">
          যাদের কিস্তির তারিখ পেরিয়ে গেছে অথচ পরিশোধ হয়নি। সবচেয়ে পুরোনো বকেয়া উপরে।
        </p>
      </div>

      <LedgerTabs />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 px-5 py-4">
          <div className="text-xs text-slate-500">ওভারডিউ শিক্ষার্থী</div>
          <div className="mt-1 text-2xl font-semibold text-slate-100">{data?.count ?? 0}</div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 px-5 py-4">
          <div className="text-xs text-slate-500">এই পাতার ওভারডিউ</div>
          <div className="mt-1 text-2xl font-semibold text-rose-400">{bdt(totalOverdue)}</div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 px-5 py-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Lock className="size-3" /> কোর্স বন্ধ
          </div>
          <div className="mt-1 text-2xl font-semibold text-rose-400">{blocked}</div>
        </div>
      </div>

      {isLoading ? (
        <PageLoader label="ওভারডিউ তালিকা লোড হচ্ছে…" />
      ) : isError ? (
        <ErrorState message="তালিকা আনতে সমস্যা হয়েছে।" error={error} />
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-emerald-800 bg-emerald-950/30 px-6 py-12 text-center text-sm text-emerald-300">
          কারও কিস্তি বকেয়া নেই। ✓
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="bg-gray-900/50 text-xs font-medium text-slate-400">
                <th className="px-4 py-3">শিক্ষার্থী</th>
                <th className="px-4 py-3">কোর্স</th>
                <th className="px-4 py-3 text-right">ওভারডিউ</th>
                <th className="px-4 py-3 text-right">মোট বকেয়া</th>
                <th className="px-4 py-3">পুরোনো তারিখ</th>
                <th className="px-4 py-3 text-right">কত দিন</th>
                <th className="px-4 py-3">অবস্থা</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {rows.map((row) => (
                <tr key={row.plan} className="border-t border-slate-800 bg-rose-950/10">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-100">{row.student_name}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Phone className="size-3" />
                      {row.student_phone || row.student_email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{row.course_title}</td>
                  <td className="px-4 py-3 text-right font-semibold text-rose-400">
                    {bdt(row.overdue_amount)}
                    <div className="text-xs font-normal text-slate-500">
                      {row.installments_overdue}টি কিস্তি
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {bdt(row.remaining_balance)}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{row.oldest_due_date}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-100">
                    {row.days_overdue} দিন
                  </td>
                  <td className="px-4 py-3">
                    {row.is_suspended ? (
                      <span className="flex items-center gap-1 rounded-full border border-rose-800 bg-rose-950/40 px-2 py-0.5 text-xs text-rose-300">
                        <Lock className="size-3" /> কোর্স বন্ধ
                      </span>
                    ) : (
                      // Overdue but the blocking rule was never switched on.
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <ShieldOff className="size-3" /> নিয়ম নিষ্ক্রিয়
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
