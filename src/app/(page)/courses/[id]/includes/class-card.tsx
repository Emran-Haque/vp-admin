"use client";

import Image from "next/image";
import { Pencil, Play, Radio, Trash2 } from "lucide-react";
import { getMediaUrl } from "@/redux/api/baseApi";
import type { CourseClass } from "@/redux/api/classesApi";

/**
 * A lecture or live class, laid out the way the student sees it.
 *
 * Mirrors `ClassRecordingCard` on the student site — a 16:9 poster with a play
 * button, then subject, title and meta — so an admin previewing a course is
 * looking at the same thing a student will. The card stacks below 860px for the
 * same reason the student one does: most people are on a phone.
 *
 * The only additions are the edit and delete controls.
 */
export default function ClassCard({
  item,
  variant,
  subjectLabel,
  onEdit,
  onDelete,
}: {
  item: CourseClass;
  variant: "lecture" | "live";
  subjectLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isLive = variant === "live";
  const firstVideo = item.videos[0];
  // The lecture form uploads a thumbnail against the video; the live-class form
  // uploads one against the class. Take whichever this card actually has.
  const poster = getMediaUrl(firstVideo?.thumbnail ?? null) ?? getMediaUrl(item.thumbnail);
  const playUrl = firstVideo?.video_url || item.live_url;

  const tone = isLive
    ? {
        line: "from-emerald-500 via-emerald-400 to-teal-400",
        badge: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
      }
    : {
        line: "from-blue-500 via-sky-400 to-cyan-400",
        badge: "border-blue-400/30 bg-blue-500/10 text-blue-300",
      };

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/30 p-3">
      <span
        className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${tone.line}`}
      />

      <div className="flex items-stretch gap-4 max-[860px]:flex-col max-[860px]:gap-3">
        <div className="relative aspect-video w-[176px] shrink-0 overflow-hidden rounded-[12px] bg-black max-[860px]:w-full">
          {poster ? (
            <Image
              className="absolute inset-0 h-full w-full object-cover opacity-90"
              src={poster}
              alt=""
              width={440}
              height={275}
              unoptimized
            />
          ) : null}
          <div className="absolute inset-0 bg-black/30" />
          {playUrl ? (
            <a
              aria-label={`${item.title} — ভিডিও খুলুন`}
              className="absolute inset-0 grid place-items-center"
              href={playUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="grid size-12 place-items-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-sm transition hover:scale-105 hover:bg-white/25">
                {isLive ? <Radio size={22} /> : <Play size={22} fill="currentColor" />}
              </span>
            </a>
          ) : (
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-12 place-items-center rounded-full border border-white/20 bg-white/10 text-white/50">
                {isLive ? <Radio size={22} /> : <Play size={22} fill="currentColor" />}
              </span>
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-[8px] border px-2.5 py-1 text-[11px] font-black ${tone.badge}`}>
              {subjectLabel}
            </span>
            {isLive && item.is_live ? (
              <span className="rounded-[8px] border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-black text-red-400">
                লাইভ
              </span>
            ) : null}
          </div>

          <h3 className="m-0 mt-2 truncate text-[16px] font-black leading-snug text-blue-50 max-[860px]:text-[15px]">
            {item.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-slate-400">
            {item.class_date ? (
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true">📅</span>
                {item.class_date}
              </span>
            ) : null}
            {item.start_time ? (
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true">🕐</span>
                {item.start_time.slice(0, 5)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true">🎬</span>
              {item.videos.length}টি ভিডিও
            </span>
            {item.class_materials.length > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true">📎</span>
                {item.class_materials.length}টি ম্যাটেরিয়াল
              </span>
            ) : null}
          </div>

          {firstVideo?.title ? (
            <p className="mt-2 truncate text-[12px] text-slate-500">
              ভিডিও: {firstVideo.title}
              {firstVideo.duration ? ` · ${firstVideo.duration}` : ""}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 max-[860px]:flex-col max-[860px]:items-stretch">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[12px] border border-slate-700 bg-white/[0.03] px-4 text-[13px] font-bold text-blue-50 hover:bg-white/[0.07]"
          >
            <Pencil size={14} />
            এডিট
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[12px] border border-red-600/40 bg-red-600/10 px-3.5 text-[13px] font-bold text-red-500 hover:bg-red-600/20"
            aria-label={`${item.title} মুছুন`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
