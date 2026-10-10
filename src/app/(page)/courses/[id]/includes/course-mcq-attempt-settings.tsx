"use client";

import { useState } from "react";
import { Bell, ClipboardCheck, Save } from "lucide-react";
import { useUpdateCourseMcqAttemptLimitMutation } from "@/redux/api/coursesApi";
import { extractErrorMessage } from "@/lib/api-error";
import { usePermissions } from "@/hooks/use-permissions";

type Props = {
  courseId: number;
  defaultAttempts: number;
};

export default function CourseMcqAttemptSettings({
  courseId,
  defaultAttempts,
}: Props) {
  const [draftLimit, setDraftLimit] = useState<string | null>(null);
  const [applyToExisting, setApplyToExisting] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updateAttemptLimit, { isLoading }] =
    useUpdateCourseMcqAttemptLimitMutation();
  const { hasPermission } = usePermissions();

  const visibleLimit = draftLimit ?? String(defaultAttempts || 1);

  if (!hasPermission("can_edit_course")) return null;

  const handleSave = async () => {
    setError(null);
    setMessage(null);

    const maxAttempts = Number(visibleLimit);
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20) {
      setError("১ থেকে ২০-এর মধ্যে একটি পূর্ণ সংখ্যা দিন।");
      return;
    }

    if (
      applyToExisting &&
      !window.confirm(
        `এই কোর্সের বর্তমান সব Online MCQ/Model Test-এ সর্বোচ্চ ${maxAttempts} বার সুযোগ দেওয়া হবে। আপনি কি নিশ্চিত?`,
      )
    ) {
      return;
    }

    try {
      const result = await updateAttemptLimit({
        id: courseId,
        max_attempts: maxAttempts,
        apply_to_existing: applyToExisting,
      }).unwrap();
      setDraftLimit(String(result.default_mcq_attempts));
      setMessage(
        applyToExisting
          ? `${result.updated_exams}টি বর্তমান পরীক্ষায় নতুন সীমা প্রয়োগ হয়েছে${
              result.notified ? " এবং যোগ্য শিক্ষার্থীদের নোটিফিকেশন পাঠানো হয়েছে" : ""
            }। নতুন পরীক্ষাতেও এই সীমা থাকবে।`
          : "কোর্সের ডিফল্ট সুযোগ সংরক্ষণ হয়েছে। এটি শুধু নতুন Online MCQ/Model Test-এ ব্যবহার হবে।",
      );
    } catch (saveError) {
      setError(extractErrorMessage(saveError));
    }
  };

  return (
    <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-blue-100">
            <ClipboardCheck size={18} />
            <h2 className="text-sm font-bold sm:text-base">
              পুরো কোর্সের MCQ পরীক্ষার সুযোগ
            </h2>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-slate-400 sm:text-sm">
            এই সীমা নতুন Online MCQ/Model Test-এ স্বয়ংক্রিয়ভাবে বসবে। চাইলে
            কোর্সের বর্তমান সব Online MCQ/Model Test-এও একসঙ্গে প্রয়োগ করুন।
            Offline পরীক্ষায় এটি প্রযোজ্য নয় এবং শুধু প্রথম ফল Leaderboard-এ গণনা হবে।
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-[140px_minmax(260px,1fr)_auto] sm:items-end xl:w-auto">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-300">
              সর্বোচ্চ সুযোগ
            </span>
            <input
              aria-label="সর্বোচ্চ MCQ পরীক্ষার সুযোগ"
              className="h-11 w-full rounded-xl border border-slate-700 bg-gray-900 px-3 text-sm text-blue-50 outline-none focus:border-blue-500"
              inputMode="numeric"
              max="20"
              min="1"
              onChange={(event) => setDraftLimit(event.target.value)}
              step="1"
              type="number"
              value={visibleLimit}
            />
          </label>

          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-gray-900 px-3 py-2 text-xs font-semibold leading-5 text-slate-300">
            <input
              checked={applyToExisting}
              className="size-4 shrink-0 accent-blue-500"
              onChange={(event) => setApplyToExisting(event.target.checked)}
              type="checkbox"
            />
            বর্তমান সব Online MCQ/Model Test-এও প্রয়োগ করুন
          </label>

          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 text-xs font-bold text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
            onClick={handleSave}
            type="button"
          >
            <Save size={15} />
            {isLoading ? "সংরক্ষণ হচ্ছে…" : "সুযোগ সংরক্ষণ করুন"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-xs font-semibold text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          className="mt-3 inline-flex items-start gap-2 text-xs font-semibold leading-5 text-emerald-300"
          role="status"
        >
          <Bell className="mt-0.5 shrink-0" size={14} />
          {message}
        </p>
      ) : null}
    </section>
  );
}
