"use client";

import { Check, Copy, UserPlus } from "lucide-react";
import {
  useGetBatchJoinRequestsQuery,
  useUpdateJoinRequestMutation,
} from "@/redux/api/examsApi";
import ErrorState from "@/components/error-state";

const bn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

/** Facebook-group join requests: copy each student's FB name (right of the row);
 *  copying marks it added and turns the name green. */
export default function JoinRequestsPanel({ batchId }: { batchId: number }) {
  const { data, isFetching, isError, error } = useGetBatchJoinRequestsQuery(batchId);
  const [markAdded] = useUpdateJoinRequestMutation();

  const copyAndMark = async (id: number, name: string) => {
    try {
      await navigator.clipboard.writeText(name);
    } catch {
      // Clipboard may be blocked; still mark as added below.
    }
    await markAdded({ id, batchId, data: { is_added: true } }).unwrap().catch(() => {});
  };

  const pending = (data ?? []).filter((r) => !r.is_added).length;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-blue-50">
          <UserPlus size={18} className="text-cyan-400" />
          <h2 className="text-lg font-bold">Facebook গ্রুপ জয়েন রিকোয়েস্ট</h2>
        </div>
        {data && data.length > 0 ? (
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
            {bn(pending)} টি বাকি
          </span>
        ) : null}
      </div>

      <p className="mb-3 text-xs text-slate-400">
        নাম কপি করে Facebook গ্রুপে ম্যানুয়ালি অ্যাড করুন। একবার কপি করলে নামটি সবুজ হয়ে যাবে — বোঝা যাবে এই শিক্ষার্থী অ্যাড হয়েছে।
      </p>

      {isFetching ? (
        <p className="text-sm text-slate-400">লোড হচ্ছে...</p>
      ) : isError ? (
        <ErrorState message="জয়েন রিকোয়েস্ট আনতে সমস্যা হচ্ছে।" error={error} />
      ) : !data || data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-800 p-5 text-center text-sm text-slate-400">
          এখনো কোনো জয়েন রিকোয়েস্ট আসেনি।
        </p>
      ) : (
        <div className="grid gap-2">
          {data.map((req) => (
            <div key={req.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <div className="min-w-0">
                <p className={`truncate text-sm font-bold ${req.is_added ? "text-emerald-400" : "text-slate-100"}`}>
                  {req.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {req.student_name || req.student_email}
                  {req.student_name && req.student_email ? ` · ${req.student_email}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyAndMark(req.id, req.name)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition ${
                  req.is_added
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-white/5"
                }`}
              >
                {req.is_added ? <Check size={14} /> : <Copy size={14} />}
                {req.is_added ? "অ্যাড হয়েছে" : "নাম কপি করুন"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
