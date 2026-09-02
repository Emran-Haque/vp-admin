"use client";

import { useEffect, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Save, X } from "lucide-react";

/** Shared field styling so every section modal looks like the same product. */
export const fieldClass =
  "h-11 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/10";

export const areaClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/10";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-400">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[11px] leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

/**
 * The one modal every view-management section opens.
 *
 * Everything that differs between sections is the body; the chrome — title,
 * close affordances, error and success banners, and the save button with its
 * pending state — is fixed so an admin learns it once. Escape and a backdrop
 * click both close, and the page behind is scroll-locked so a long form does
 * not scroll the dashboard underneath it.
 */
export default function ModalShell({
  title,
  subtitle,
  icon,
  error,
  success,
  isSaving = false,
  saveLabel = "সেভ করুন",
  onSave,
  onClose,
  size = "md",
  children,
  footerNote,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  error?: string | null;
  success?: string | null;
  isSaving?: boolean;
  saveLabel?: string;
  /** Omit to render a read/manage-only modal with just a close button. */
  onSave?: () => void;
  onClose: () => void;
  size?: "md" | "lg";
  children: ReactNode;
  footerNote?: string;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-modal="true"
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] ${
          size === "lg" ? "max-w-[860px]" : "max-w-[600px]"
        }`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-800 px-6 py-4">
          <div className="flex min-w-0 items-start gap-3">
            {icon ? (
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-sky-400/20 bg-sky-400/10 text-sky-300">
                {icon}
              </span>
            ) : null}
            <div className="min-w-0">
              <h2 className="truncate text-base font-black text-slate-50">{title}</h2>
              {subtitle ? (
                <p className="mt-0.5 text-xs leading-5 text-slate-400">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {error ? (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
              <p className="text-xs leading-5 text-red-300">{error}</p>
            </div>
          ) : null}
          {success ? (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" />
              <p className="text-xs leading-5 text-emerald-300">{success}</p>
            </div>
          ) : null}
          {children}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-800 px-6 py-4">
          <p className="min-w-0 flex-1 truncate text-[11px] text-slate-500">{footerNote ?? ""}</p>
          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
            >
              {onSave ? "ক্যানসেল" : "বন্ধ করুন"}
            </button>
            {onSave ? (
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={14} />
                {isSaving ? "সেভ হচ্ছে…" : saveLabel}
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  );
}
