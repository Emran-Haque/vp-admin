import { extractErrorMessage, getApiErrorStatus } from "@/lib/api-error";

export default function ErrorState({
  message,
  error,
  className = "",
}: {
  message: string;
  error?: unknown;
  className?: string;
}) {
  const isRateLimited = getApiErrorStatus(error) === 429;
  const detail = error === undefined ? null : extractErrorMessage(error);

  return (
    <div
      className={`rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-center text-sm text-red-500 ${className}`}
    >
      <p>{isRateLimited ? detail : message}</p>
      {!isRateLimited && detail ? (
        <p className="mt-1.5 text-xs text-red-500/70">{detail}</p>
      ) : null}
    </div>
  );
}
