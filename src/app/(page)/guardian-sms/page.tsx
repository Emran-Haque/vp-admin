"use client";

import { useState } from "react";
import { MessageSquare, Eye, AlertTriangle } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useGetSmsCampaignsQuery } from "@/redux/api/guardianSmsApi";
import CampaignBuilder from "./includes/campaign-builder";
import CampaignDetailModal from "./includes/campaign-detail-modal";
import TemplateEditor from "./includes/template-editor";

/**
 * Guardian SMS — result and absence messages to parents.
 *
 * Kept on its own screen rather than bolted onto the exam list because it is the
 * one admin action that costs money per click and cannot be undone. Publishing a
 * result prepares a draft here; it never sends.
 */

const STATUS_STYLES: Record<string, string> = {
  draft: "border-slate-400/30 bg-slate-400/10 text-slate-300",
  queued: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  sending: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  cancelled: "border-red-400/30 bg-red-400/10 text-red-300",
};

export default function Page() {
  const { hasPermission } = usePermissions();
  const [tab, setTab] = useState<"campaigns" | "templates">("campaigns");
  const [openCampaignId, setOpenCampaignId] = useState<number | null>(null);

  // A run in progress updates in the background, so the list refreshes itself.
  const { data, isLoading, isError } = useGetSmsCampaignsQuery(undefined, {
    pollingInterval: 10000,
  });

  if (!hasPermission("can_send_guardian_sms")) {
    return (
      <div className="flex items-start gap-2 rounded-[10px] border border-amber-500/30 bg-amber-500/5 p-4">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
        <p className="text-xs text-amber-200">
          অভিভাবকদের SMS পাঠানোর অনুমতি আপনার নেই।
        </p>
      </div>
    );
  }

  const campaigns = data?.results ?? [];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500">
          <MessageSquare size={20} className="text-white" />
        </span>
        <div>
          <h1 className="text-lg font-bold text-slate-50">অভিভাবক SMS</h1>
          <p className="text-xs text-slate-400">
            রেজাল্ট ও অনুপস্থিতির খবর অভিভাবকের মোবাইলে পাঠান
          </p>
        </div>
      </header>

      <div className="flex gap-2">
        {(
          [
            ["campaigns", "ক্যাম্পেইন"],
            ["templates", "মেসেজ টেমপ্লেট"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`cursor-pointer rounded-[10px] border px-4 py-2 text-xs font-bold ${
              tab === value
                ? "border-blue-400/40 bg-blue-500/15 text-blue-200"
                : "border-white/10 bg-white/5 text-slate-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "templates" ? (
        <TemplateEditor />
      ) : (
        <>
          <CampaignBuilder onBuilt={(id) => setOpenCampaignId(id)} />

          {isError && (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-400">
                ক্যাম্পেইনের তালিকা আনা যায়নি। API সংযোগ যাচাই করুন।
              </p>
            </div>
          )}

          <section className="overflow-hidden rounded-[16px] border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">পরীক্ষা</th>
                  <th className="px-4 py-3 font-semibold">ধরন</th>
                  <th className="px-4 py-3 font-semibold">অবস্থা</th>
                  <th className="px-4 py-3 font-semibold">SMS যাবে</th>
                  <th className="px-4 py-3 font-semibold">পাঠানো</th>
                  <th className="px-4 py-3 font-semibold">ব্যর্থ</th>
                  <th className="px-4 py-3 font-semibold">খরচ</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-slate-200">
                      {campaign.exam_title}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {campaign.kind_display}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                          STATUS_STYLES[campaign.status]
                        }`}
                      >
                        {campaign.status_display}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {campaign.total_recipients - campaign.skipped_count}
                    </td>
                    <td className="px-4 py-3 text-emerald-300">
                      {campaign.sent_count}
                    </td>
                    <td className="px-4 py-3 text-red-300">
                      {campaign.failed_count || "—"}
                    </td>
                    <td className="px-4 py-3 text-blue-300">
                      {campaign.estimated_segments}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setOpenCampaignId(campaign.id)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-100"
                      >
                        <Eye size={13} />
                        দেখুন
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && campaigns.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      এখনো কোনো ক্যাম্পেইন নেই। উপরে পরীক্ষা বেছে “প্রস্তুত করুন” চাপুন।
                    </td>
                  </tr>
                )}
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      লোড হচ্ছে…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}

      {openCampaignId !== null && (
        <CampaignDetailModal
          campaignId={openCampaignId}
          onClose={() => setOpenCampaignId(null)}
        />
      )}
    </div>
  );
}
