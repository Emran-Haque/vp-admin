"use client";

import { useState } from "react";
import {
  X,
  Send,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Ban,
  CheckCircle2,
} from "lucide-react";
import {
  useCancelCampaignMutation,
  useGetSmsCampaignQuery,
  useGetSmsCampaignRecipientsQuery,
  useRetryFailedCampaignMutation,
  useSendCampaignMutation,
} from "@/redux/api/guardianSmsApi";

/**
 * The preview-and-approve screen.
 *
 * Everything an admin needs before spending money is on this one page: exactly
 * who is messaged, the exact Bangla they receive, how many SMS credits it costs,
 * and who cannot be reached at all. Sending is gated behind a typed
 * confirmation because it is irreversible and goes to real parents.
 */

const STATUS_STYLES: Record<string, string> = {
  pending: "border-slate-400/30 bg-slate-400/10 text-slate-300",
  sending: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  sent: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  failed: "border-red-400/30 bg-red-400/10 text-red-300",
  skipped: "border-amber-400/30 bg-amber-400/10 text-amber-300",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "অপেক্ষমাণ",
  sending: "পাঠানো হচ্ছে",
  sent: "পাঠানো হয়েছে",
  failed: "ব্যর্থ",
  skipped: "বাদ পড়েছে",
};

const CONFIRM_WORD = "PATHAO";

export default function CampaignDetailModal({
  campaignId,
  onClose,
}: {
  campaignId: number;
  onClose: () => void;
}) {
  const [rowFilter, setRowFilter] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");

  // While a run is in flight the worker updates rows in the background, so the
  // numbers are re-pulled on a timer rather than leaving a stale page up.
  const { data: campaign, isLoading } = useGetSmsCampaignQuery(campaignId, {
    pollingInterval: 5000,
  });
  // Polled too, so the per-row statuses tick over while a run is in flight
  // rather than the table sitting frozen under a moving progress count.
  const { data: recipients } = useGetSmsCampaignRecipientsQuery(
    { id: campaignId, status: rowFilter || undefined, page_size: 50 },
    { pollingInterval: 5000 },
  );

  const [sendCampaign, { isLoading: isSending }] = useSendCampaignMutation();
  const [cancelCampaign] = useCancelCampaignMutation();
  const [retryFailed, { isLoading: isRetrying }] = useRetryFailedCampaignMutation();

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setError("");
    try {
      await action();
    } catch (actionError) {
      const detail = (actionError as { data?: { detail?: string } })?.data?.detail;
      setError(detail || fallback);
    }
  };

  const handleSend = async () => {
    if (confirmText.trim().toUpperCase() !== CONFIRM_WORD) {
      setError(`নিশ্চিত করতে "${CONFIRM_WORD}" লিখুন।`);
      return;
    }
    await run(() => sendCampaign(campaignId).unwrap(), "SMS পাঠানো শুরু করা যায়নি।");
    setIsConfirming(false);
    setConfirmText("");
  };

  const reachable = campaign
    ? campaign.total_recipients - campaign.skipped_count
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="flex max-h-[88vh] w-full max-w-[900px] flex-col rounded-[20px] border border-white/5 bg-gray-900/90 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-start justify-between p-6 pb-0">
          <div>
            <h2 className="text-base font-bold text-slate-50">
              {campaign?.exam_title ?? "ক্যাম্পেইন"}
            </h2>
            <p className="pt-1 text-xs text-slate-400">
              {campaign?.kind_display} · {campaign?.status_display}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          {isLoading && (
            <p className="text-center text-sm text-slate-400">তথ্য লোড হচ্ছে…</p>
          )}

          {campaign && (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat label="মোট শিক্ষার্থী" value={campaign.total_recipients} />
                <Stat label="SMS যাবে" value={reachable} tone="emerald" />
                <Stat
                  label="নম্বর নেই"
                  value={campaign.skipped_count}
                  tone={campaign.skipped_count ? "amber" : undefined}
                />
                <Stat
                  label="মোট SMS খরচ"
                  value={campaign.estimated_segments}
                  tone="blue"
                />
              </div>

              {campaign.estimated_segments > reachable && reachable > 0 && (
                <div className="flex items-start gap-2 rounded-[10px] border border-blue-500/30 bg-blue-500/5 p-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-blue-400" />
                  <p className="text-xs text-blue-200">
                    বাংলা SMS প্রতি মেসেজে ৭০ অক্ষর পর্যন্ত ১টি করে ধরা হয়, তাই{" "}
                    {reachable} জনের জন্য {campaign.estimated_segments}টি SMS খরচ হবে।
                    মেসেজ ছোট করলে খরচ কমবে।
                  </p>
                </div>
              )}

              {campaign.skipped_count > 0 && (
                <div className="flex items-start gap-2 rounded-[10px] border border-amber-500/30 bg-amber-500/5 p-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
                  <p className="text-xs text-amber-200">
                    {campaign.skipped_count} জন শিক্ষার্থীর অভিভাবকের ফোন নম্বর নেই — তাদের
                    অভিভাবক কোনো SMS পাবেন না। প্রোফাইল ঠিক করে আবার “প্রস্তুত করুন”
                    চাপলে তারা তালিকায় যুক্ত হবে।
                  </p>
                </div>
              )}

              {(campaign.sent_count > 0 || campaign.failed_count > 0) && (
                <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-white/10 bg-white/5 p-3 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 size={13} /> পাঠানো: {campaign.sent_count}
                  </span>
                  <span className="text-red-300">ব্যর্থ: {campaign.failed_count}</span>
                  <span className="text-slate-400">
                    বাকি: {campaign.pending_count}
                  </span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">ফিল্টার:</span>
                {["", "pending", "sent", "failed", "skipped"].map((value) => (
                  <button
                    key={value || "all"}
                    type="button"
                    onClick={() => setRowFilter(value)}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold ${
                      rowFilter === value
                        ? "border-blue-400/40 bg-blue-500/15 text-blue-200"
                        : "border-white/10 bg-white/5 text-slate-400"
                    }`}
                  >
                    {value ? STATUS_LABELS[value] : "সব"}
                  </button>
                ))}
              </div>

              <div className="overflow-hidden rounded-[10px] border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-3 py-2 font-semibold">শিক্ষার্থী</th>
                      <th className="px-3 py-2 font-semibold">অভিভাবকের নম্বর</th>
                      <th className="px-3 py-2 font-semibold">মেসেজ</th>
                      <th className="px-3 py-2 font-semibold">SMS</th>
                      <th className="px-3 py-2 font-semibold">অবস্থা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recipients?.results ?? []).map((row) => (
                      <tr key={row.id} className="border-t border-white/5">
                        <td className="px-3 py-2 text-slate-200">
                          {row.student_name}
                          {row.student_code && (
                            <span className="block text-[11px] text-slate-500">
                              {row.student_code}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          {row.phone || "—"}
                        </td>
                        <td className="max-w-[280px] px-3 py-2 text-slate-300">
                          <span className="line-clamp-2">{row.message}</span>
                          {row.detail && (
                            <span className="block pt-0.5 text-[11px] text-amber-400/80">
                              {row.detail}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-400">{row.segments}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                              STATUS_STYLES[row.status]
                            }`}
                          >
                            {STATUS_LABELS[row.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {recipients && recipients.results.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-6 text-center text-slate-500"
                        >
                          এই ফিল্টারে কেউ নেই।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {recipients && recipients.count > recipients.results.length && (
                <p className="text-center text-xs text-slate-500">
                  মোট {recipients.count} জনের মধ্যে প্রথম {recipients.results.length}{" "}
                  জন দেখানো হচ্ছে।
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-white/5 p-6">
          {campaign?.failed_count ? (
            <button
              type="button"
              onClick={() =>
                run(
                  () => retryFailed(campaignId).unwrap(),
                  "আবার চেষ্টা করা যায়নি।",
                )
              }
              disabled={isRetrying}
              className="flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-bold text-amber-200 disabled:opacity-60"
            >
              <RefreshCw size={14} />
              ব্যর্থগুলো আবার পাঠান ({campaign.failed_count})
            </button>
          ) : null}

          {campaign &&
            (campaign.status === "queued" || campaign.status === "sending") && (
              <button
                type="button"
                onClick={() =>
                  run(
                    () => cancelCampaign(campaignId).unwrap(),
                    "বাতিল করা যায়নি।",
                  )
                }
                className="flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-red-400/30 bg-red-400/10 px-4 py-2 text-xs font-bold text-red-200"
              >
                <Ban size={14} />
                বাকিগুলো বাতিল করুন
              </button>
            )}

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-[10px] border border-slate-400/20 bg-slate-400/5 px-4 py-2 text-xs font-bold text-slate-400"
          >
            বন্ধ করুন
          </button>

          {campaign?.can_send &&
            (isConfirming ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={confirmText}
                  onChange={(event) => setConfirmText(event.target.value)}
                  placeholder={CONFIRM_WORD}
                  className="w-[130px] rounded-[10px] border border-red-400/40 bg-red-500/5 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-red-500 to-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {isSending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  {reachable} জনকে পাঠান
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setIsConfirming(true);
                }}
                className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white"
              >
                <Send size={14} />
                SMS পাঠান ({campaign.estimated_segments}টি SMS)
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "emerald" | "amber" | "blue";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-300"
      : tone === "amber"
        ? "text-amber-300"
        : tone === "blue"
          ? "text-blue-300"
          : "text-slate-200";
  return (
    <div className="rounded-[10px] border border-white/10 bg-white/5 p-3">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className={`pt-1 text-lg font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
