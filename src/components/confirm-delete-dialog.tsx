"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

type ConfirmDeleteDialogProps = {
  open: boolean;
  itemName: string;
  itemType: string;
  impact?: string;
  error?: string | null;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function ConfirmDeleteDialog({
  open,
  itemName,
  itemType,
  impact,
  error = null,
  isLoading = false,
  onClose,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  if (!open) return null;

  return (
    <ConfirmDeleteDialogContent
      key={`${itemType}-${itemName}`}
      itemName={itemName}
      itemType={itemType}
      impact={impact}
      error={error}
      isLoading={isLoading}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function ConfirmDeleteDialogContent({
  itemName,
  itemType,
  impact,
  error,
  isLoading,
  onClose,
  onConfirm,
}: Omit<ConfirmDeleteDialogProps, "open">) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-red-500/25 bg-slate-950 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-500/15 text-red-300">
              <AlertTriangle size={20} />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-50">{itemType} মুছে ফেলবেন?</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                <span className="font-bold text-slate-200">{itemName}</span> স্থায়ীভাবে মুছে যাবে।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="বন্ধ করুন"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm leading-6 text-slate-300">
            {impact || "এই কাজটি ফেরানো যাবে না। ভুল করে মুছে ফেলা আটকাতে আরেকবার নিশ্চিত করুন।"}
          </p>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm font-bold leading-6 text-red-200">
              {error}
            </div>
          ) : null}

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
              className="mt-1 size-4 accent-red-500"
            />
            <span>আমি নিশ্চিত, এটি মুছে ফেলতে চাই।</span>
          </label>

          <div className="mt-5 grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-11 rounded-xl border border-white/10 px-4 text-sm font-bold text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!checked || isLoading}
              className="h-11 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-600/40"
            >
              {isLoading ? "মুছে ফেলা হচ্ছে..." : "মুছে ফেলুন"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
