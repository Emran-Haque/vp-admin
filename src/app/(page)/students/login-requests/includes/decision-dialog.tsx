"use client";

import { useState } from "react";
import {
  useApproveDeviceRequestMutation,
  useRejectDeviceRequestMutation,
  type DeviceRequest,
} from "@/redux/api/deviceLockApi";
import { extractErrorMessage } from "@/lib/api-error";

export type Decision = "approve" | "reject";

/** Approve or reject one request, with an optional note the student can read. */
export default function DecisionDialog({
  request,
  decision,
  onClose,
  onDone,
}: {
  request: DeviceRequest;
  decision: Decision;
  onClose: () => void;
  onDone?: () => void;
}) {
  const [note, setNote] = useState("");
  const [approve, approveState] = useApproveDeviceRequestMutation();
  const [reject, rejectState] = useRejectDeviceRequestMutation();
  const isApprove = decision === "approve";
  const { isLoading, error } = isApprove ? approveState : rejectState;

  const submit = async () => {
    const decide = isApprove ? approve : reject;
    try {
      await decide({ id: request.id, admin_note: note.trim() }).unwrap();
      onDone?.();
      onClose();
    } catch {
      // Shown below.
    }
  };

  const oldDevice = request.locked_device_label || "আগের ডিভাইস";

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
          {isApprove ? "রিকোয়েস্ট অনুমোদন করবেন?" : "রিকোয়েস্ট বাতিল করবেন?"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {isApprove ? (
            <>
              <span className="font-semibold text-slate-200">{request.student.full_name}</span>-এর
              অ্যাকাউন্ট <span className="font-semibold text-slate-200">{oldDevice}</span> থেকে
              লগআউট হয়ে <span className="font-semibold text-slate-200">{request.label}</span>-এ চালু
              হবে। শিক্ষার্থীর অপেক্ষার পেজ নিজে থেকেই ড্যাশবোর্ডে চলে যাবে।
            </>
          ) : (
            <>
              শিক্ষার্থী আগের ডিভাইসেই (<span className="font-semibold text-slate-200">{oldDevice}</span>)
              ব্যবহার চালিয়ে যাবে। মন্তব্য লিখলে শিক্ষার্থী অপেক্ষার পেজে সেটি দেখতে পাবে।
            </>
          )}
        </p>
        <textarea
          className="mt-4 w-full resize-y rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
          onChange={(event) => setNote(event.target.value)}
          placeholder={isApprove ? "মন্তব্য (ঐচ্ছিক)" : "কারণ (ঐচ্ছিক) — শিক্ষার্থী দেখতে পাবে"}
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
            className={`rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50 ${
              isApprove ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
            }`}
            disabled={isLoading}
            onClick={submit}
            type="button"
          >
            {isLoading ? "হচ্ছে…" : isApprove ? "অনুমোদন করুন" : "বাতিল করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
