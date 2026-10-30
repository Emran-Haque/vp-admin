import { Medal } from "lucide-react";
import type { EndedBy, ResultRow } from "./types";
import ErrorState from "@/components/error-state";

const medalColor: Record<number, string> = {
  1: "text-amber-500",
  2: "text-cyan-400",
  3: "text-blue-400",
};

const endedByLabel: Record<Exclude<EndedBy, null>, { text: string; title: string; className: string }> = {
  time: {
    text: "সময় শেষ",
    title: "সময় শেষ হওয়ায় পরীক্ষাটি নিজে থেকে জমা হয়েছে",
    className: "bg-amber-500/10 text-amber-400",
  },
  left_screen: {
    text: "ট্যাব পরিবর্তন",
    title: "পরীক্ষার স্ক্রিন ছেড়ে অন্য ট্যাব/অ্যাপে যাওয়ায় পরীক্ষাটি নিজে থেকে জমা হয়েছে",
    className: "bg-orange-500/10 text-orange-400",
  },
  offline: {
    text: "অফলাইন",
    title: "অফলাইন (কাগজের) পরীক্ষা — নম্বর অ্যাডমিন দিয়েছেন",
    className: "bg-cyan-500/10 text-cyan-400",
  },
};

const bnDigits = (value: number) => String(value).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

/** ১ম, ২য়, ৩য়, ৪র্থ, ৫ম, ৬ষ্ঠ, ৭ম … */
function bnOrdinal(n: number) {
  const suffix: Record<number, string> = { 1: "ম", 2: "য়", 3: "য়", 4: "র্থ", 6: "ষ্ঠ" };
  return `${bnDigits(n)}${suffix[n] ?? (n <= 10 ? "ম" : "তম")}`;
}

type Props = {
  rows: ResultRow[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
};

export default function ResultsTable({ rows, isLoading, isError, error }: Props) {
  if (isLoading) {
    return <p className="p-8 text-center text-sm text-slate-400">ফলাফলের তালিকা লোড হচ্ছে…</p>;
  }

  if (isError) {
    return (
      <ErrorState message="ফলাফলের তালিকা আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।" error={error} />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse text-left">
        <thead>
          <tr className="bg-gray-900/50 text-xs font-medium text-slate-400">
            <th className="px-4 py-2.5">র‍্যাঙ্ক</th>
            <th className="px-4 py-2.5">শিক্ষার্থী</th>
            <th className="px-4 py-2.5">কোর্স</th>
            <th className="px-4 py-2.5">পরীক্ষা</th>
            <th className="px-4 py-2.5">স্কোর</th>
            <th className="px-4 py-2.5">স্ট্যাটাস</th>
            <th className="px-4 py-2.5">তারিখ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const percent = row.maxScore > 0 ? Math.round((row.score / row.maxScore) * 100) : 0;
            return (
              <tr key={row.id} className="border-t border-slate-800">
                <td className="px-4 py-3.5">
                  {row.rank == null ? (
                    <span
                      className="text-sm text-slate-600"
                      title="র‍্যাঙ্ক শুধু প্রথম চেষ্টার ফলের হয়; পরের চেষ্টার কোনো র‍্যাঙ্ক নেই"
                    >
                      —
                    </span>
                  ) : row.rank <= 3 ? (
                    <Medal size={16} className={medalColor[row.rank]} />
                  ) : (
                    <span className="text-sm text-slate-400">{row.rank}</span>
                  )}
                </td>

                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-blue-500 text-sm font-semibold text-white">
                      {row.studentName[0]}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-blue-50">{row.studentName}</p>
                      <p className="text-xs text-slate-400">{row.studentId}</p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3.5 text-sm text-slate-300">{row.course}</td>
                <td className="px-4 py-3.5 text-sm text-slate-300">
                  <p>{row.exam}</p>
                  {(row.attemptNumber > 1 || row.endedBy) && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {row.attemptNumber > 1 && (
                        <span
                          className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[11px] font-semibold text-slate-300"
                          title="আবার দেওয়া পরীক্ষা — লিডারবোর্ডে শুধু প্রথম চেষ্টা গণনা হয়"
                        >
                          {bnOrdinal(row.attemptNumber)} চেষ্টা
                        </span>
                      )}
                      {row.endedBy && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${endedByLabel[row.endedBy].className}`}
                          title={endedByLabel[row.endedBy].title}
                        >
                          {endedByLabel[row.endedBy].text}
                        </span>
                      )}
                    </div>
                  )}
                </td>

                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-800">
                      <div
                        className={`h-full rounded-full ${row.passed ? "bg-emerald-500" : "bg-red-500"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-blue-50">
                      {row.score}/{row.maxScore}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3.5">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      row.passed ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {row.passed ? "পাস" : "ফেল"}
                  </span>
                </td>

                <td className="px-4 py-3.5 text-sm text-slate-400">{row.date}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {rows.length === 0 && (
        <p className="p-8 text-center text-sm text-slate-400">কোনো ফলাফল পাওয়া যায়নি।</p>
      )}
    </div>
  );
}
