"use client";

import { useState } from "react";
import {
  Award, BookOpen, Check, ClipboardList, GraduationCap, Package,
  Search, Star, Trash2, X,
} from "lucide-react";
import {
  useApproveReviewMutation,
  useDeleteReviewMutation,
  useGetReviewsQuery,
  useRejectReviewMutation,
  useUpdateReviewMutation,
  type Review,
  type ReviewStatus,
  type ReviewTarget,
} from "@/redux/api/contentApi";
import { usePermissions } from "@/hooks/use-permissions";
import ErrorState from "@/components/error-state";
import { PageLoader } from "@/components/loaders";

/**
 * The moderation queue. Nothing a student writes reaches the public site until
 * it is approved here. The tabs let admins jump between every moderation state
 * without changing pages.
 */

type ReviewTab = ReviewStatus | "all";

const TABS: { value: ReviewTab; label: string }[] = [
  { value: "all", label: "সকল" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Published" },
  { value: "rejected", label: "বাতিল" },
];

/** Each product gets its own colour so the queue is scannable at a glance. */
const TARGETS: Record<ReviewTarget, { label: string; className: string; Icon: typeof BookOpen }> = {
  course: {
    label: "কোর্স",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    Icon: GraduationCap,
  },
  book: {
    label: "বই",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    Icon: BookOpen,
  },
  exam_batch: {
    label: "ব্যাচ",
    className: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    Icon: ClipboardList,
  },
};

export default function ReviewQueue() {
  const [status, setStatus] = useState<ReviewTab>("all");
  const [search, setSearch] = useState("");
  const [rejecting, setRejecting] = useState<Review | null>(null);

  const { data, isLoading, isError, error } = useGetReviewsQuery({
    status,
    search: search.trim() || undefined,
  });
  const [approve, { isLoading: isApproving }] = useApproveReviewMutation();
  const [updateReview] = useUpdateReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();
  const { hasPermission } = usePermissions();

  const canModerate = hasPermission("can_manage_reviews");
  const reviews = data?.results ?? [];

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)] sm:p-7">
      {/* Tabs + search — stacks on mobile, sits inline from sm up */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-800 bg-gray-900/60 p-1"
          role="tablist"
        >
          {TABS.map((tab) => (
            <button
              aria-selected={status === tab.value}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                status === tab.value
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
          <input
            aria-label="রিভিউ খুঁজুন"
            className="w-full rounded-xl border border-slate-800 bg-gray-800 py-2.5 pl-9 pr-3 text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="নাম বা মন্তব্য"
            value={search}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {isLoading ? <PageLoader /> : null}
        {isError ? <ErrorState message="রিভিউ লোড করা যায়নি।" error={error} /> : null}

        {!isLoading && !isError && reviews.length === 0 ? (
          <p className="py-14 text-center text-sm text-slate-500">
            {status === "pending"
              ? "অপেক্ষমাণ কোনো রিভিউ নেই। সব দেখা হয়ে গেছে।"
              : "এই তালিকায় কোনো রিভিউ নেই।"}
          </p>
        ) : null}

        {reviews.map((review) => (
          <ReviewCard
            canModerate={canModerate}
            isBusy={isApproving}
            key={review.id}
            onApprove={() => approve(review.id)}
            onDelete={() => deleteReview(review.id)}
            onReject={() => setRejecting(review)}
            onToggleFeatured={() =>
              updateReview({ id: review.id, data: { is_featured: !review.is_featured } })
            }
            review={review}
          />
        ))}
      </div>

      {rejecting ? (
        <RejectDialog review={rejecting} onClose={() => setRejecting(null)} />
      ) : null}
    </section>
  );
}

/** Exported so the card can be reused wherever a review needs rendering. */
export function ReviewCard({
  review,
  canModerate,
  isBusy,
  onApprove,
  onReject,
  onDelete,
  onToggleFeatured,
}: {
  review: Review;
  canModerate: boolean;
  isBusy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  onToggleFeatured: () => void;
}) {
  const target = TARGETS[review.target_type] ?? TARGETS.course;
  const { Icon } = target;

  return (
    // `min-w-0`: without it the card is a flex item with min-width:auto, so a
    // long title makes the whole card wider than the screen instead of truncating.
    <article className="min-w-0 rounded-2xl border border-slate-800 bg-gray-800 p-4">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${target.className}`}
        >
          <Icon size={12} />
          {target.label}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-blue-50">
          {review.target_title || "—"}
        </span>
        <Stars value={review.rating} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        {review.comment || <span className="text-slate-500">কোনো মন্তব্য লেখা হয়নি — শুধু রেটিং।</span>}
      </p>

      {review.aspect_labels?.length ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {review.aspect_labels.map((label) => (
            <span
              className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300"
              key={label}
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}

      {review.delivery_rating ? (
        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
          <Package size={13} />
          ডেলিভারি রেটিং {review.delivery_rating}/৫
          <span className="text-slate-600">— বইয়ের স্কোরে যোগ হয় না</span>
        </p>
      ) : null}

      <footer className="mt-4 flex flex-col gap-2.5 border-t border-slate-700/60 pt-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="min-w-0 truncate text-xs text-slate-400">
            {review.student_name || "—"}
            {review.institution ? ` · ${review.institution}` : ""}
          </span>
          {review.status === "rejected" && review.moderation_note ? (
            <span className="rounded-lg bg-red-500/10 px-2 py-1 text-[11px] text-red-300">
              {review.moderation_note}
            </span>
          ) : null}
        </div>

        {canModerate ? (
          <div className="flex items-center justify-end gap-1.5 sm:ml-auto">
            <IconButton
              active={review.is_featured}
              label={review.is_featured ? "ফিচার্ড থেকে সরান" : "ফিচার্ড করুন"}
              onClick={onToggleFeatured}
              tone="amber"
            >
              <Award size={14} />
            </IconButton>

            {review.status !== "approved" ? (
              <button
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:opacity-40"
                disabled={isBusy}
                onClick={onApprove}
                type="button"
              >
                <Check size={14} />
                প্রকাশ করুন
              </button>
            ) : null}

            {review.status !== "rejected" ? (
              <IconButton label="বাতিল করুন" onClick={onReject} tone="red">
                <X size={14} />
              </IconButton>
            ) : null}

            <IconButton label="মুছে ফেলুন" onClick={onDelete} tone="red">
              <Trash2 size={14} />
            </IconButton>
          </div>
        ) : null}
      </footer>
    </article>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`${value} স্টার`} className="flex shrink-0 items-center gap-px sm:gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          className={star <= value ? "fill-amber-400 text-amber-400" : "text-slate-600"}
          key={star}
          size={13}
        />
      ))}
    </span>
  );
}

function IconButton({
  children,
  label,
  onClick,
  tone,
  active = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  tone: "amber" | "red";
  active?: boolean;
}) {
  const tones = {
    amber: active
      ? "bg-amber-500/25 text-amber-300"
      : "text-slate-400 hover:bg-amber-500/15 hover:text-amber-300",
    red: "text-slate-400 hover:bg-red-500/15 hover:text-red-300",
  };
  return (
    <button
      aria-label={label}
      className={`flex size-8 items-center justify-center rounded-lg transition-colors ${tones[tone]}`}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function RejectDialog({ review, onClose }: { review: Review; onClose: () => void }) {
  const [note, setNote] = useState("");
  const [reject, { isLoading }] = useRejectReviewMutation();

  const submit = async () => {
    await reject({ id: review.id, note: note.trim() }).unwrap().catch(() => undefined);
    onClose();
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-blue-50">রিভিউটি বাতিল করবেন?</h2>
        <p className="mt-1 text-sm text-slate-400">
          এটি ওয়েবসাইটে দেখা যাবে না। কারণ লিখলে শিক্ষার্থী সেটি দেখতে পাবেন।
        </p>
        <textarea
          className="mt-4 w-full resize-y rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
          onChange={(event) => setNote(event.target.value)}
          placeholder="কারণ (ঐচ্ছিক)"
          rows={3}
          value={note}
        />
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
            {isLoading ? "বাতিল হচ্ছে…" : "বাতিল করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
