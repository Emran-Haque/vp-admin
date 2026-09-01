"use client";

import Image from "next/image";
import { useRef } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";
import { getMediaUrl } from "@/redux/api/baseApi";
import ImageSizeHint from "@/components/image-size-hint";
import type { ClassVideo } from "@/redux/api/classesApi";

/**
 * One video as the form holds it.
 *
 * `id` is what separates a video that already exists on the server from one the
 * admin has just added, and it is the only thing the save routine needs in
 * order to decide between PATCH and POST. There is deliberately no "new video"
 * section beside an "existing videos" list: the video — old or new — is one
 * editable block, pre-filled with whatever it already had.
 */
export type VideoRow = {
  /** Stable React key. Survives id assignment after a save. */
  key: string;
  /** Server id, or null for a video the admin just added. */
  id: number | null;
  title: string;
  video_url: string;
  duration: string;
  /** Thumbnail already stored on the server, if any. */
  thumbnail: string | null;
  /** Newly picked file, replacing `thumbnail` on save. */
  thumbnailFile: File | null;
};

let rowSeq = 0;
function nextKey() {
  rowSeq += 1;
  return `row-${rowSeq}`;
}

export function blankVideoRow(): VideoRow {
  return {
    key: nextKey(),
    id: null,
    title: "",
    video_url: "",
    duration: "",
    thumbnail: null,
    thumbnailFile: null,
  };
}

/**
 * Load a lecture's videos into editable rows, always yielding at least one.
 *
 * A lecture holds one video by design — more videos means more lectures. The
 * array shape is kept only because lectures created before that rule may still
 * carry extras, and silently hiding them would strand content that students can
 * already see.
 */
export function toVideoRows(videos: ClassVideo[] | undefined): VideoRow[] {
  const rows = (videos ?? []).map((video) => ({
    key: nextKey(),
    id: video.id,
    title: video.title ?? "",
    video_url: video.video_url ?? "",
    duration: video.duration ?? "",
    thumbnail: video.thumbnail ?? null,
    thumbnailFile: null,
  }));
  return rows.length > 0 ? rows : [blankVideoRow()];
}

/** A row is worth saving once it has both a title and a link. */
export function isCompleteRow(row: VideoRow) {
  return row.title.trim() !== "" && row.video_url.trim() !== "";
}

export default function LectureVideoEditor({
  rows,
  onChange,
  onRemovePersisted,
}: {
  rows: VideoRow[];
  onChange: (rows: VideoRow[]) => void;
  /** Called with the server id of a video the admin deleted, so the parent can
   *  delete it on save rather than immediately — nothing is lost on cancel. */
  onRemovePersisted: (id: number) => void;
}) {
  const patch = (key: string, changes: Partial<VideoRow>) =>
    onChange(rows.map((row) => (row.key === key ? { ...row, ...changes } : row)));

  const remove = (row: VideoRow) => {
    if (row.id !== null) onRemovePersisted(row.id);
    const next = rows.filter((item) => item.key !== row.key);
    // Never leave the form with nothing to type into: clearing the only video
    // should hand back an empty block, not an empty page.
    onChange(next.length > 0 ? next : [blankVideoRow()]);
  };

  const hasExtras = rows.length > 1;

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-semibold text-slate-400">ভিডিও</label>

      {hasExtras ? (
        <p className="rounded-[10px] border border-amber-500/30 bg-amber-500/5 px-3.5 py-2 text-[11px] leading-5 text-amber-200">
          এই লেকচারে {rows.length}টি ভিডিও আছে। একটি লেকচারে একটি ভিডিও রাখাই নিয়ম — বাড়তি
          ভিডিওগুলো মুছে দিতে পারেন, অথবা আলাদা লেকচার হিসেবে যোগ করুন।
        </p>
      ) : null}

      {rows.map((row, index) => (
        <div
          key={row.key}
          className="rounded-[12px] border border-white/10 bg-white/[0.03] p-3.5"
        >
          <div className="flex items-center justify-between pb-2.5">
            <span className="text-[11px] font-bold text-slate-400">
              {hasExtras ? `ভিডিও ${index + 1}` : "ভিডিওর তথ্য"}
            </span>
            {row.id !== null || row.title || row.video_url ? (
              <button
                type="button"
                onClick={() => remove(row)}
                className="flex items-center gap-1 rounded-lg border border-red-600/40 bg-red-600/10 px-2.5 py-1.5 text-[11px] font-bold text-red-500 hover:bg-red-600/20"
              >
                <Trash2 size={12} />
                সরান
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-2.5">
            <input
              type="text"
              value={row.title}
              onChange={(e) => patch(row.key, { title: e.target.value })}
              placeholder="ভিডিওর শিরোনাম"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
            <input
              type="text"
              value={row.video_url}
              onChange={(e) => patch(row.key, { video_url: e.target.value })}
              placeholder="ভিডিও লিংক (YouTube / Drive)"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
            <input
              type="text"
              value={row.duration}
              onChange={(e) => patch(row.key, { duration: e.target.value })}
              placeholder="দৈর্ঘ্য (যেমন: 45:00)"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />

            <div>
              <div className="flex items-center gap-2.5">
                <ThumbnailPicker
                  row={row}
                  onPick={(file) => patch(row.key, { thumbnailFile: file })}
                  onClear={() => patch(row.key, { thumbnailFile: null, thumbnail: null })}
                />
                <span className="text-xs text-slate-400">ভিডিও থাম্বনেইল (ঐচ্ছিক)</span>
              </div>
              <ImageSizeHint kind="classVideoThumbnail" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Thumbnail control: shows the current poster, or an upload prompt. */
function ThumbnailPicker({
  row,
  onPick,
  onClear,
}: {
  row: VideoRow;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // A freshly picked file wins over whatever is stored, so the admin sees the
  // image they just chose rather than the one it will replace.
  const preview = row.thumbnailFile
    ? URL.createObjectURL(row.thumbnailFile)
    : getMediaUrl(row.thumbnail);

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title="ভিডিও থাম্বনেইল"
        className="relative flex h-[46px] w-[82px] items-center justify-center overflow-hidden rounded-[10px] border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
      >
        {preview ? (
          <Image src={preview} alt="থাম্বনেইল" fill className="object-cover" unoptimized />
        ) : (
          <ImagePlus size={16} />
        )}
      </button>
      {preview ? (
        <button
          type="button"
          onClick={onClear}
          className="flex size-6 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-400 hover:text-red-400"
          aria-label="থাম্বনেইল সরান"
        >
          <X size={12} />
        </button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
