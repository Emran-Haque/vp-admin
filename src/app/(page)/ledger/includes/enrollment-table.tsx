"use client";

import { AlertTriangle, CircleDashed, Eye, Lock, ShieldOff } from "lucide-react";
import type { LedgerRow } from "@/redux/api/ledgersApi";
import ErrorState from "@/components/error-state";
import { PageLoader } from "@/components/loaders";
import { bdt } from "./schedule-editor";

type Props = {
  rows: LedgerRow[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onOpen: (row: LedgerRow) => void;
};

/** How each derived state reads to an admin scanning the list. */
export const stateMeta: Record<
  LedgerRow["state"],
  { label: string; className: string; rowClass?: string }
> = {
  no_ledger: {
    label: "সেটআপ বাকি",
    className: "border-amber-800 bg-amber-950/40 text-amber-300",
    rowClass: "bg-amber-950/10",
  },
  suspended: {
    label: "কোর্স বন্ধ",
    className: "border-rose-800 bg-rose-950/40 text-rose-300",
    rowClass: "bg-rose-950/20",
  },
  overdue: {
    label: "ওভারডিউ",
    className: "border-orange-800 bg-orange-950/40 text-orange-300",
  },
  active: { label: "চলমান", className: "border-sky-800 bg-sky-950/40 text-sky-300" },
  completed: {
    label: "পরিশোধিত",
    className: "border-emerald-800 bg-emerald-950/40 text-emerald-300",
  },
};

export default function EnrollmentTable({ rows, isLoading, isError, error, onOpen }: Props) {
  if (isLoading) return <PageLoader label="লেজার লোড হচ্ছে…" />;
  if (isError) {
    return <ErrorState message="তালিকা আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।" error={error} />;
  }
  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-12 text-center text-sm text-slate-400">
        কোনো ভর্তি পাওয়া যায়নি।
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <table className="w-full min-w-[1040px] border-collapse text-left">
        <thead>
          <tr className="bg-gray-900/50 text-xs font-medium text-slate-400">
            <th className="px-4 py-3">শিক্ষার্থী</th>
            <th className="px-4 py-3">কোর্স</th>
            <th className="px-4 py-3 text-right">মোট ফি</th>
            <th className="px-4 py-3 text-right">পরিশোধিত</th>
            <th className="px-4 py-3 text-right">বকেয়া</th>
            <th className="px-4 py-3">পরবর্তী কিস্তি</th>
            <th className="px-4 py-3">অবস্থা</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="text-sm">
          {rows.map((row) => {
            const meta = stateMeta[row.state];
            return (
              <tr
                key={`${row.student}-${row.course}`}
                className={`border-t border-slate-800 ${meta.rowClass ?? ""}`}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-100">{row.student_name || "—"}</div>
                  <div className="text-xs text-slate-500">
                    #{row.student} · {row.student_phone || row.student_email}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300">{row.course_title}</td>
                <td className="px-4 py-3 text-right text-slate-300">{bdt(row.total_fee)}</td>
                <td className="px-4 py-3 text-right text-emerald-400">
                  {row.state === "no_ledger" ? (
                    <span className="text-slate-600">অজানা</span>
                  ) : (
                    bdt(row.paid_amount)
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-100">
                  {bdt(row.remaining_balance)}
                  {Number(row.overdue_amount) > 0 && (
                    <div className="text-xs text-rose-400">
                      ওভারডিউ {bdt(row.overdue_amount)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {row.next_due ? (
                    <>
                      <div>{bdt(row.next_due.amount)}</div>
                      <div className="text-xs text-slate-500">{row.next_due.due_date}</div>
                    </>
                  ) : row.plan && !row.has_schedule ? (
                    <span className="flex items-center gap-1 text-xs text-amber-400">
                      <CircleDashed className="size-3" /> কিস্তি সেট হয়নি
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${meta.className}`}>
                      {row.state === "suspended" && <Lock className="mr-1 inline size-3" />}
                      {row.state === "overdue" && (
                        <AlertTriangle className="mr-1 inline size-3" />
                      )}
                      {meta.label}
                    </span>
                    {row.state === "overdue" && !row.enforcement_enabled && (
                      // Overdue but not blocked: the admin should know why.
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <ShieldOff className="size-3" /> নিয়ম নিষ্ক্রিয়
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onOpen(row)}
                    className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                      row.plan
                        ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                        : "border-amber-700 bg-amber-950/40 text-amber-300 hover:bg-amber-900/40"
                    }`}
                  >
                    {row.plan ? <Eye className="size-4" /> : "সেটআপ"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
