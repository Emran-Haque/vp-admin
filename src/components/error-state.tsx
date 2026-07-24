import { extractErrorMessage } from "@/lib/api-error";

export default function ErrorState({
  message,
  error,
  className = "",
}: {
  message: string;
  error?: unknown;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-center text-sm text-red-500 ${className}`}
    >
      <p>{message}</p>
      {error !== undefined && <p className="mt-1.5 text-xs text-red-500/70">{extractErrorMessage(error)}</p>}
    </div>
  );
}
