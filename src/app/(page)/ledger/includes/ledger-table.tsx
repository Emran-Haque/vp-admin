"use client";

import { Eye, Lock, ShieldOff } from "lucide-react";
import type { Ledger } from "@/redux/api/ledgersApi";
import ErrorState from "@/components/error-state";
import { PageLoader } from "@/components/loaders";
import { bdt } from "./schedule-editor";

type Props = {
  ledgers: Ledger[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onView: (ledger: Ledger) => void;
};

const statusBadge: Record<string, string> = {
  active: "bg-sky-950 text-sky-300 border-sky-800",
  completed: "bg-emerald-950 text-emerald-300 border-emerald-800",
  cancelled: "bg-slate-800 text-slate-400 border-slate-700",
};

const statusLabel: Record<string, string> = {
  active: "চলমান",
  completed: "পরিশোধিত",
  cancelled: "বাতিল",
};

const sourceLabel: Record<string, string> = {
  checkout: "চেকআউট",
  imported: "ইমপোর্ট",
  admin: "অ্যাডমিন",
};

export default function LedgerTable({ ledgers, isLoading, isError, error, onView }: Props) {
  if (isLoading) return <PageLoader label="লেজার লোড হচ্ছে…" />;
  if (isError) {
    return <ErrorState message="লেজার আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।" error={error} />;
  }
  if (!ledgers.length) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-12 text-center text-sm text-slate-400">
        কোনো লেজার পাওয়া যায়নি।
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
            <th className="px-4 py-3">মোট ফি</th>
            <th className="px-4 py-3">পরিশোধিত</th>
            <th className="px-4 py-3">বকেয়া</th>
            <th className="px-4 py-3">পরবর্তী কিস্তি</th>
            <th className="px-4 py-3">অবস্থা</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="text-sm">
          {ledgers.map((ledger) => (
            <tr
              key={ledger.id}
              className={`border-t border-slate-800 ${
                ledger.is_suspended ? "bg-rose-950/20" : ""
              }`}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-slate-100">{ledger.student_name || "—"}</div>
                <div className="text-xs text-slate-500">
                  {ledger.student_phone || ledger.student_email}
                </div>
              </td>
              <td className="px-4 py-3 text-slate-300">{ledger.course_title}</td>
              <td className="px-4 py-3 text-slate-300">{bdt(ledger.total_fee)}</td>
              <td className="px-4 py-3 text-emerald-400">{bdt(ledger.paid_amount)}</td>
              <td className="px-4 py-3 font-medium text-slate-100">
                {bdt(ledger.remaining_balance)}
                {Number(ledger.overdue_amount) > 0 && (
                  <div className="text-xs text-rose-400">
                    ওভারডিউ {bdt(ledger.overdue_amount)}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-slate-300">
                {ledger.next_due ? (
                  <>
                    <div>{bdt(ledger.next_due.amount)}</div>
                    <div className="text-xs text-slate-500">{ledger.next_due.due_date}</div>
                  </>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col items-start gap-1">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${statusBadge[ledger.status]}`}
                  >
                    {statusLabel[ledger.status]}
                  </span>
                  {ledger.is_suspended ? (
                    <span className="flex items-center gap-1 text-xs text-rose-400">
                      <Lock className="size-3" /> কোর্স বন্ধ
                    </span>
                  ) : (
                    !ledger.enforcement_enabled && (
                      // Made visible on purpose: an imported ledger cannot block
                      // anyone until someone has checked its numbers.
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <ShieldOff className="size-3" /> নিয়ম নিষ্ক্রিয়
                      </span>
                    )
                  )}
                  <span className="text-[11px] text-slate-600">
                    {sourceLabel[ledger.source]}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onView(ledger)}
                  className="rounded-xl border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"
                  aria-label="বিস্তারিত দেখুন"
                >
                  <Eye className="size-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
