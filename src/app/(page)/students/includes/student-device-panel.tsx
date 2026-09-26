"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, LogOut, Smartphone } from "lucide-react";
import {
  useGetStudentDeviceQuery,
  useLogoutAllStudentDevicesMutation,
} from "@/redux/api/deviceLockApi";
import { usePermissions } from "@/hooks/use-permissions";
import { extractErrorMessage } from "@/lib/api-error";
import { formatDateTime } from "@/lib/device-lock";
import DeviceHistory from "./device-history";

/**
 * The student's device under the one-device lock, the "log out of all
 * devices" button, and their full login history. Shown in the student popup.
 */
export default function StudentDevicePanel({ studentId }: { studentId: number }) {
  const { data, isLoading } = useGetStudentDeviceQuery(studentId);
  const { hasPermission } = usePermissions();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <section className="flex flex-col gap-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
        <Smartphone size={13} /> ডিভাইস
      </p>

      {isLoading ? <p className="text-xs text-slate-500">ডিভাইসের তথ্য লোড হচ্ছে…</p> : null}

      {data ? (
        <div className="flex flex-col gap-3 rounded-[10px] border border-white/10 bg-white/5 p-4">
          {!data.lock_enabled ? (
            <p className="rounded-lg bg-slate-500/10 px-3 py-2 text-xs text-slate-400">
              ডিভাইস লক এখন বন্ধ — শিক্ষার্থী যেকোনো ডিভাইসে ব্যবহার করতে পারছে।
            </p>
          ) : null}

          {data.locked_device ? (
            <div>
              <p className="text-sm font-semibold text-blue-50">{data.locked_device.label}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                যুক্ত হয়েছে: {formatDateTime(data.locked_device.bound_at)}
                {data.locked_device.last_seen_at
                  ? ` · শেষ ব্যবহার: ${formatDateTime(data.locked_device.last_seen_at)}`
                  : ""}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-300">
              কোনো ডিভাইস যুক্ত নেই। পরের লগইনের ডিভাইসটিই শিক্ষার্থীর ডিভাইস হবে।
            </p>
          )}

          <p className="text-xs text-slate-400">
            চালু সেশন: {data.live_sessions.toLocaleString("bn-BD")} · মোট রিকোয়েস্ট:{" "}
            {data.request_count.toLocaleString("bn-BD")} (শেষ ৩০ দিনে{" "}
            {data.recent_request_count.toLocaleString("bn-BD")})
          </p>

          {data.is_frequent ? (
            <p className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              প্রায়ই ডিভাইস পরিবর্তনের রিকোয়েস্ট — অ্যাকাউন্টটি শেয়ার হচ্ছে কিনা যাচাই করুন।
            </p>
          ) : null}

          {data.pending_request ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
              অপেক্ষমাণ রিকোয়েস্ট: {data.pending_request.label} ·{" "}
              {formatDateTime(data.pending_request.created_at)} —{" "}
              <Link className="font-bold underline" href="/students/login-requests">
                লগইন রিকোয়েস্টে দেখুন
              </Link>
            </p>
          ) : null}

          {done ? (
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
              সব ডিভাইস থেকে লগআউট করা হয়েছে।
            </p>
          ) : null}

          {hasPermission("can_manage_login_requests") ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex w-fit cursor-pointer items-center gap-1.5 rounded-[10px] border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20"
            >
              <LogOut size={14} />
              সব ডিভাইস থেকে লগআউট
            </button>
          ) : null}
        </div>
      ) : null}

      <DeviceHistory studentId={studentId} />

      {confirming && data ? (
        <LogoutAllDialog
          studentId={studentId}
          studentName={data.student.full_name}
          deviceLabel={data.locked_device?.label ?? ""}
          onClose={() => setConfirming(false)}
          onDone={() => {
            setConfirming(false);
            setDone(true);
          }}
        />
      ) : null}
    </section>
  );
}

function LogoutAllDialog({
  studentId,
  studentName,
  deviceLabel,
  onClose,
  onDone,
}: {
  studentId: number;
  studentName: string;
  deviceLabel: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [note, setNote] = useState("");
  const [logoutAll, { isLoading, error }] = useLogoutAllStudentDevicesMutation();

  const submit = async () => {
    try {
      await logoutAll({ studentId, note: note.trim() }).unwrap();
      onDone();
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
        <h2 className="text-lg font-bold text-blue-50">সব ডিভাইস থেকে লগআউট করবেন?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {studentName}-কে সব ডিভাইস থেকে লগআউট করা হবে
          {deviceLabel ? ` (বর্তমান ডিভাইস: ${deviceLabel})` : ""}। অ্যাকাউন্টটি কোনো
          ডিভাইসে আটকানো থাকবে না — শিক্ষার্থী পরের বার যে ডিভাইসে লগইন করবে, সেটিই তার
          ডিভাইস হবে। অপেক্ষমাণ রিকোয়েস্ট থাকলে সেটি বন্ধ হয়ে যাবে।
        </p>
        <textarea
          className="mt-4 w-full resize-y rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
          onChange={(event) => setNote(event.target.value)}
          placeholder="কারণ (ঐচ্ছিক) — যেমন: ফোন হারিয়েছে"
          maxLength={500}
          rows={3}
          value={note}
        />
        {error ? <p className="mt-2 text-xs text-red-400">{extractErrorMessage(error)}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300"
            onClick={onClose}
            type="button"
          >
            ফিরে যান
          </button>
          <button
            className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-bold text-red-300 disabled:opacity-50"
            disabled={isLoading}
            onClick={submit}
            type="button"
          >
            {isLoading ? "লগআউট হচ্ছে…" : "লগআউট করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
