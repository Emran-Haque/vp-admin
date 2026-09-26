"use client";

import { useState } from "react";
import { Clock, Lock, LockOpen, ShieldCheck } from "lucide-react";
import {
  useGetDeviceLockSettingsQuery,
  useGetDeviceRequestSummaryQuery,
  useUpdateDeviceLockSettingsMutation,
} from "@/redux/api/deviceLockApi";
import { usePermissions } from "@/hooks/use-permissions";
import { extractErrorMessage } from "@/lib/api-error";
import { formatDateTime } from "@/lib/device-lock";

export default function LoginRequestsOverview() {
  const { data: summary } = useGetDeviceRequestSummaryQuery();

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0px_4px_20px_0px_rgba(6,182,212,0.30)]">
          <ShieldCheck size={28} className="text-white" />
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-8 text-blue-50">লগইন রিকোয়েস্ট</h1>
          <p className="mt-1 text-sm text-slate-400">
            প্রতিটি শিক্ষার্থী একটি ডিভাইসে ব্যবহার করতে পারে। অন্য ডিভাইসে ব্যবহারের অনুমতি
            চাইলে রিকোয়েস্ট এখানে আসে।
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-center text-amber-400">
          <div className="flex items-center justify-center gap-1">
            <Clock size={12} />
            <p className="text-[11px] font-medium">অপেক্ষমাণ</p>
          </div>
          <p className="mt-0.5 text-xl font-bold">{(summary?.pending ?? 0).toLocaleString("bn-BD")}</p>
        </div>
        <LockSwitch />
      </div>
    </section>
  );
}

/** The on/off switch. Everyone who sees this page sees its state; only admins flip it. */
function LockSwitch() {
  const { data } = useGetDeviceLockSettingsQuery();
  const { isAdmin } = usePermissions();
  const [confirming, setConfirming] = useState(false);

  const isOn = Boolean(data?.is_enabled);

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
        isOn ? "border-emerald-500/30 bg-emerald-500/10" : "border-slate-700 bg-gray-900/60"
      }`}
    >
      {isOn ? (
        <Lock size={20} className="shrink-0 text-emerald-400" />
      ) : (
        <LockOpen size={20} className="shrink-0 text-slate-400" />
      )}
      <div className="min-w-0">
        <p className={`text-sm font-bold ${isOn ? "text-emerald-300" : "text-slate-300"}`}>
          ডিভাইস লক: {isOn ? "চালু" : "বন্ধ"}
        </p>
        <p className="text-[11px] text-slate-500">
          {data?.updated_by
            ? `${data.updated_by.full_name} · ${formatDateTime(data.updated_at)}`
            : isAdmin
              ? "শুধু অ্যাডমিন চালু/বন্ধ করতে পারেন"
              : "অ্যাডমিন চালু/বন্ধ করেন"}
        </p>
      </div>
      {isAdmin && data ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={`ml-auto shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
            isOn
              ? "bg-red-500/15 text-red-300 hover:bg-red-500/25"
              : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
          }`}
        >
          {isOn ? "বন্ধ করুন" : "চালু করুন"}
        </button>
      ) : null}

      {confirming ? <LockConfirmDialog turnOn={!isOn} onClose={() => setConfirming(false)} /> : null}
    </div>
  );
}

function LockConfirmDialog({ turnOn, onClose }: { turnOn: boolean; onClose: () => void }) {
  const [update, { isLoading, error }] = useUpdateDeviceLockSettingsMutation();

  const submit = async () => {
    try {
      await update({ is_enabled: turnOn }).unwrap();
      onClose();
    } catch {
      // Shown below.
    }
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-blue-50">
          {turnOn ? "ডিভাইস লক চালু করবেন?" : "ডিভাইস লক বন্ধ করবেন?"}
        </h2>
        {turnOn ? (
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-400">
            <li>প্রতিটি শিক্ষার্থী শুধু একটি ডিভাইসে ব্যবহার করতে পারবে।</li>
            <li>
              এই মুহূর্তে শিক্ষার্থী যে ডিভাইসে ব্যবহার করছে, সেটিই তার ডিভাইস হয়ে যাবে। অন্য
              ডিভাইসগুলোকে লগইন রিকোয়েস্ট পাঠাতে হবে।
            </li>
            <li>লগআউট করলেও ডিভাইস বদলায় না — নতুন ডিভাইসের জন্য অ্যাডমিনের অনুমোদন লাগবে।</li>
            <li>অ্যাডমিন ও মডারেটরদের জন্য কোনো সীমা নেই।</li>
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            বন্ধ থাকলে শিক্ষার্থীরা যেকোনো সংখ্যক ডিভাইসে ব্যবহার করতে পারবে, আর অপেক্ষায় থাকা
            ডিভাইসগুলো সঙ্গে সঙ্গে ঢুকতে পারবে। লগইন ইতিহাস মুছবে না।
          </p>
        )}
        {error ? <p className="mt-3 text-xs text-red-400">{extractErrorMessage(error)}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300"
            onClick={onClose}
            type="button"
          >
            ফিরে যান
          </button>
          <button
            className={`rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50 ${
              turnOn ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
            }`}
            disabled={isLoading}
            onClick={submit}
            type="button"
          >
            {isLoading ? "হচ্ছে…" : turnOn ? "চালু করুন" : "বন্ধ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
