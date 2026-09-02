"use client";

import { AlertTriangle, X } from "lucide-react";

type ConfirmActionDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function ConfirmActionDialog({
  open,
  title,
  message,
  confirmLabel = "চালিয়ে যান",
  cancelLabel = "বাতিল",
  isLoading = false,
  onClose,
  onConfirm,
}: ConfirmActionDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-amber-500/25 bg-slate-950 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-300">
              <AlertTriangle size={20} />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-50">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">{message}</p>
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

        <div className="grid grid-cols-2 gap-3 p-5 max-[420px]:grid-cols-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-11 rounded-xl border border-white/10 px-4 text-sm font-bold text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-11 rounded-xl bg-amber-500 px-4 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "প্রসেস হচ্ছে..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
