import { Medal } from "lucide-react";
import type { ResultRow } from "./types";

const medalColor: Record<number, string> = {
  1: "text-amber-500",
  2: "text-cyan-400",
  3: "text-blue-400",
};

type Props = {
  rows: ResultRow[];
  isLoading: boolean;
  isError: boolean;
};

export default function ResultsTable({ rows, isLoading, isError }: Props) {
  if (isLoading) {
    return <p className="p-8 text-center text-sm text-slate-400">ফলাফলের তালিকা লোড হচ্ছে…</p>;
  }

  if (isError) {
    return (
      <p className="p-8 text-center text-sm text-red-500">
        ফলাফলের তালিকা আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।
      </p>
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
                  {row.rank <= 3 ? (
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
                <td className="px-4 py-3.5 text-sm text-slate-300">{row.exam}</td>

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
                    {row.passed ? "উত্তীর্ণ" : "অনুত্তীর্ণ"}
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
