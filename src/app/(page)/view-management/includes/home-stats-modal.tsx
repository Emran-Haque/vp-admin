"use client";

import { useState } from "react";
import { AlertTriangle, BarChart3, RotateCcw } from "lucide-react";
import { extractErrorMessage } from "@/lib/api-error";
import {
  type HomeStat,
  useGetHomeStatsQuery,
  useSaveHomeStatsMutation,
} from "@/redux/api/contentApi";
import ModalShell, { fieldClass } from "./modal-shell";

type Draft = { label: string; boost: string };

const bn = (n: number) => n.toLocaleString("bn-BD");

/**
 * The four counters on the homepage.
 *
 * The admin's number is ADDED to the live count, never substituted for it. That
 * is what lets a new site present a credible figure and still have it move: 100
 * extra students on a real count of 1 shows 101, and becomes 102 the moment a
 * real student signs up. Replacing the value would have frozen the counter at
 * whatever was typed, which is the opposite of what a growth number is for.
 */
export default function HomeStatsModal({ onClose }: { onClose: () => void }) {
  const { data, isLoading, isError, error: loadError } = useGetHomeStatsQuery();
  const [saveStats, { isLoading: isSaving }] = useSaveHomeStatsMutation();

  const [drafts, setDrafts] = useState<Record<string, Draft> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const stats: HomeStat[] = data ?? [];

  const draftFor = (stat: HomeStat): Draft =>
    drafts?.[stat.key] ?? { label: stat.label, boost: String(stat.boost_value) };

  const set = (stat: HomeStat, patch: Partial<Draft>) => {
    const base = Object.fromEntries(stats.map((s) => [s.key, draftFor(s)]));
    setDrafts({ ...base, [stat.key]: { ...draftFor(stat), ...patch } });
  };

  const boostOf = (stat: HomeStat) => {
    const parsed = Number(draftFor(stat).boost.trim());
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 0;
  };

  const save = async () => {
    setError(null);
    setSuccess(null);
    try {
      await saveStats(
        stats.map((stat, index) => ({
          key: stat.key,
          label: draftFor(stat).label.trim(),
          boost_value: boostOf(stat),
          ordering: index,
        })),
      ).unwrap();
      setDrafts(null);
      setSuccess("সেভ হয়ে গেছে।");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  // The endpoint is new; against an older backend it 404s, and an empty modal
  // would look like a bug rather than a missing deploy.
  const loadFailed = isError || (!isLoading && stats.length === 0);

  return (
    <ModalShell
      error={error}
      footerNote="হোমপেজের উপরের চারটি সংখ্যা"
      icon={<BarChart3 size={17} />}
      isSaving={isSaving}
      onClose={onClose}
      onSave={loadFailed ? undefined : save}
      size="lg"
      subtitle="আসল সংখ্যার সাথে আপনার দেওয়া সংখ্যা যোগ হবে"
      success={success}
      title="সাইট পরিসংখ্যান"
    >
      {isLoading ? (
        <p className="py-10 text-center text-sm text-slate-400">লোড হচ্ছে…</p>
      ) : loadFailed ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <div className="text-xs leading-6 text-amber-200">
            <p className="font-bold">পরিসংখ্যান লোড করা যায়নি।</p>
            <p className="mt-1 text-amber-200/80">
              এই ফিচারটি নতুন — সার্ভারে সর্বশেষ ব্যাকএন্ড কোড deploy করা আছে এবং migration
              run করা হয়েছে কিনা দেখুন।
            </p>
            {loadError ? (
              <p className="mt-1.5 font-mono text-[11px] text-amber-200/70">
                {extractErrorMessage(loadError)}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="rounded-lg border border-sky-400/25 bg-sky-400/5 px-3.5 py-2.5 text-[11px] leading-5 text-sky-200">
            আপনার দেওয়া সংখ্যাটি আসল সংখ্যার সাথে <b>যোগ</b> হবে — বদলে যাবে না। যেমন আসল
            শিক্ষার্থী ১ জন, আপনি ১০০ দিলে সাইটে দেখাবে ১০১। এরপর নতুন ১ জন ভর্তি হলে
            নিজে থেকেই ১০২ হয়ে যাবে। ০ দিলে শুধু আসল সংখ্যাটাই দেখাবে।
          </p>

          {stats.map((stat) => {
            const draft = draftFor(stat);
            const boost = boostOf(stat);
            const total = stat.computed_value + boost;
            return (
              <div
                className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5"
                key={stat.key}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5">
                  <span className="text-[11px] font-bold text-slate-400">
                    আসল সংখ্যা: <span className="text-slate-200">{bn(stat.computed_value)}</span>
                    {boost > 0 ? (
                      <>
                        <span className="mx-1.5 text-slate-600">+</span>
                        <span className="text-amber-300">{bn(boost)}</span>
                        <span className="mx-1.5 text-slate-600">=</span>
                        <span className="text-emerald-300">{bn(total)}</span>
                        <span className="ml-1 text-slate-500">সাইটে দেখাবে</span>
                      </>
                    ) : (
                      <span className="ml-1.5 text-slate-500">— সাইটে এটিই দেখাবে</span>
                    )}
                  </span>
                  {boost > 0 ? (
                    <button
                      className="flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[10px] font-bold text-amber-200 hover:bg-amber-400/20"
                      onClick={() => set(stat, { boost: "0" })}
                      title="বাড়তি সংখ্যা সরিয়ে দিন"
                      type="button"
                    >
                      <RotateCcw size={11} />
                      রিসেট
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-2.5 sm:grid-cols-[1fr_160px]">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-bold text-slate-500">
                      লেখা
                    </span>
                    <input
                      className={fieldClass}
                      onChange={(e) => set(stat, { label: e.target.value })}
                      placeholder={stat.default_label}
                      value={draft.label}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-bold text-slate-500">
                      বাড়তি যোগ করুন
                    </span>
                    <input
                      className={`${fieldClass} text-center font-bold ${
                        boost > 0 ? "border-amber-400/50" : ""
                      }`}
                      inputMode="numeric"
                      min="0"
                      onChange={(e) => set(stat, { boost: e.target.value })}
                      placeholder="0"
                      step="1"
                      type="number"
                      value={draft.boost}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ModalShell>
  );
}
