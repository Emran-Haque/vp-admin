"use client";

import { useState } from "react";
import { FileText, Loader2, AlertTriangle } from "lucide-react";
import { useGetExamsQuery } from "@/redux/api/examsApi";
import {
  useBuildCampaignMutation,
  type SmsCampaignKind,
} from "@/redux/api/guardianSmsApi";

/**
 * "Prepare the guardian SMS for this exam."
 *
 * Preparing is free and repeatable: it only works out who would be messaged and
 * what it would cost. Nothing leaves the building until someone opens the draft
 * and confirms the send.
 */

const KINDS: { value: SmsCampaignKind; label: string; hint: string }[] = [
  {
    value: "result",
    label: "রেজাল্ট",
    hint: "যারা পরীক্ষা দিয়েছে, তাদের অভিভাবককে নম্বর জানানো হবে",
  },
  {
    value: "absent",
    label: "অনুপস্থিত",
    hint: "যারা পরীক্ষা দেয়নি, তাদের অভিভাবককে জানানো হবে",
  },
];

export default function CampaignBuilder({
  onBuilt,
}: {
  onBuilt: (campaignId: number) => void;
}) {
  const [examId, setExamId] = useState<number | "">("");
  const [kind, setKind] = useState<SmsCampaignKind>("result");
  const [error, setError] = useState("");

  const { data: examsData, isLoading: examsLoading } = useGetExamsQuery({
    page_size: 100,
  });
  const [buildCampaign, { isLoading: isBuilding }] = useBuildCampaignMutation();

  const exams = examsData?.results ?? [];

  const handleBuild = async () => {
    setError("");
    if (examId === "") {
      setError("আগে একটি পরীক্ষা নির্বাচন করুন।");
      return;
    }
    try {
      const campaign = await buildCampaign({ exam: examId, kind }).unwrap();
      onBuilt(campaign.id);
    } catch (buildError) {
      const detail = (buildError as { data?: { detail?: string } })?.data?.detail;
      setError(detail || "ক্যাম্পেইন তৈরি করা যায়নি।");
    }
  };

  return (
    <section className="rounded-[16px] border border-white/10 bg-white/5 p-5">
      <h2 className="text-sm font-bold text-slate-50">নতুন SMS প্রস্তুত করুন</h2>
      <p className="pt-1 text-xs text-slate-400">
        প্রস্তুত করলে শুধু তালিকা ও খরচ দেখা যাবে — কোনো SMS যাবে না।
      </p>

      <div className="grid grid-cols-1 gap-3.5 pt-4 md:grid-cols-[2fr_1fr_auto]">
        <div>
          <label className="block pb-1.5 text-xs font-semibold text-slate-400">
            পরীক্ষা
          </label>
          <select
            value={examId}
            onChange={(e) => setExamId(e.target.value ? Number(e.target.value) : "")}
            disabled={examsLoading}
            className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none disabled:opacity-60"
          >
            <option value="">
              {examsLoading ? "লোড হচ্ছে…" : "পরীক্ষা নির্বাচন করুন"}
            </option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block pb-1.5 text-xs font-semibold text-slate-400">
            ধরন
          </label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as SmsCampaignKind)}
            className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
          >
            {KINDS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleBuild}
            disabled={isBuilding}
            className="flex h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
          >
            {isBuilding ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileText size={14} />
            )}
            {isBuilding ? "প্রস্তুত হচ্ছে…" : "প্রস্তুত করুন"}
          </button>
        </div>
      </div>

      <p className="pt-2 text-xs text-slate-500">
        {KINDS.find((option) => option.value === kind)?.hint}
      </p>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </section>
  );
}
