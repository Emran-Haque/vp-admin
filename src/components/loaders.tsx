"use client";

import { useAppSelector } from "@/redux/hooks";

type RequestEntry = { status?: string } | undefined;

/** True whenever ANY RTK Query request (query or mutation) is in flight. Drives
 *  the global top loading bar so every page fetch and every action shows a
 *  visible "loading" signal without touching each page. */
function useAnyRequestPending(): boolean {
  return useAppSelector((state) => {
    const api = (state as { api?: { queries?: Record<string, RequestEntry>; mutations?: Record<string, RequestEntry> } }).api;
    const anyPending = (bucket?: Record<string, RequestEntry>) =>
      bucket ? Object.values(bucket).some((entry) => entry?.status === "pending") : false;
    return anyPending(api?.queries) || anyPending(api?.mutations);
  });
}

/** A slim animated bar pinned to the top of the screen while data loads. */
export function GlobalLoadingBar() {
  const pending = useAnyRequestPending();
  if (!pending) return null;
  return (
    <div
      className="fixed inset-x-0 top-0 z-[200] h-[3px] overflow-hidden bg-blue-500/10"
      role="progressbar"
      aria-label="লোড হচ্ছে"
    >
      <div className="vp-loading-bar h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-blue-400 to-blue-500" />
    </div>
  );
}

/** Small inline spinner — use inside buttons or beside text. */
export function Loader({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-5 shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-blue-400 ${className}`}
    />
  );
}

/** Centered spinner + label for a whole page/section that's still loading. */
export function PageLoader({ label = "লোড হচ্ছে..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
      <Loader className="size-7 border-[3px]" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}
