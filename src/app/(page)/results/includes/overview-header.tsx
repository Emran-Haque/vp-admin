import { Download } from "lucide-react";

export default function OverviewHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-blue-50">ফলাফল</h1>
        <p className="mt-1 text-sm text-slate-400">শিক্ষার্থীদের সকল পরীক্ষার ফলাফল দেখুন ও পরিচালনা করুন।</p>
      </div>

      <button
        type="button"
        className="flex items-center gap-1.5 rounded-2xl border border-slate-800 bg-gray-900 px-3 py-2 text-xs font-medium text-blue-50"
      >
        <Download size={14} />
        এক্সপোর্ট
      </button>
    </div>
  );
}
