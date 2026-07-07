import { Medal, Eye, Trash2 } from "lucide-react";
import { results } from "./types";

const medalColor: Record<number, string> = {
  1: "text-amber-500",
  2: "text-cyan-400",
  3: "text-blue-400",
};

export default function ResultsTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse text-left">
        <thead>
          <tr className="bg-gray-900/50 text-xs font-medium text-slate-400">
            <th className="px-4 py-2.5">র‍্যাঙ্ক</th>
            <th className="px-4 py-2.5">শিক্ষার্থী</th>
            <th className="px-4 py-2.5">কোর্স</th>
            <th className="px-4 py-2.5">পরীক্ষা</th>
            <th className="px-4 py-2.5">স্কোর</th>
            <th className="px-4 py-2.5">স্ট্যাটাস</th>
            <th className="px-4 py-2.5">তারিখ</th>
            <th className="px-4 py-2.5 text-right">অ্যাকশন</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => {
            const percent = Math.round((result.score / result.maxScore) * 100);
            const passed = result.status === "passed";
            return (
              <tr key={result.id} className="border-t border-slate-800">
                <td className="px-4 py-3.5">
                  {result.rank <= 3 ? (
                    <Medal size={16} className={medalColor[result.rank]} />
                  ) : (
                    <span className="text-sm text-slate-400">{result.rank}</span>
                  )}
                </td>

                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-blue-500 text-sm font-semibold text-white">
                      {result.studentName[0]}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-blue-50">{result.studentName}</p>
                      <p className="text-xs text-slate-400">{result.studentId}</p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3.5 text-sm text-slate-300">{result.course}</td>
                <td className="px-4 py-3.5 text-sm text-slate-300">{result.exam}</td>

                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-800">
                      <div
                        className={`h-full rounded-full ${passed ? "bg-emerald-500" : "bg-red-500"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-blue-50">
                      {result.score}/{result.maxScore}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3.5">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      passed ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {passed ? "উত্তীর্ণ" : "অনুত্তীর্ণ"}
                  </span>
                </td>

                <td className="px-4 py-3.5 text-sm text-slate-400">{result.date}</td>

                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center rounded-lg border border-slate-800 text-blue-50"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center rounded-lg border border-red-600/40 bg-red-600/10 text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
