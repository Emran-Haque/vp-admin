"use client";

import { CalendarClock, ClipboardCheck, Pencil, Settings2, Users } from "lucide-react";
import type { ExamBatch } from "@/redux/api/examsApi";

const bn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

const API_ORIGIN = "https://api.vaiyaderpathshala.com";

function resolveMediaUrl(value: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  try {
    return new URL(value.startsWith("/") ? value : `/${value}`, API_ORIGIN).toString();
  } catch {
    return value;
  }
}

function priceLabel(batch: ExamBatch) {
  const price = Number(batch.price);
  if (!Number.isFinite(price) || price <= 0) return "ফ্রি";
  return `৳${price.toLocaleString("bn-BD")}`;
}

/** A batch card styled like the course cards. Click → manage; pencil → edit popup. */
export default function BatchCard({
  batch,
  onManage,
  onEdit,
}: {
  batch: ExamBatch;
  onManage: () => void;
  onEdit: () => void;
}) {
  const imageUrl = resolveMediaUrl(batch.thumbnail);
  return (
    <article
      onClick={onManage}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_18px_44px_-16px_rgba(0,0,0,0.58)] transition duration-200 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-[0px_26px_70px_-22px_rgba(6,182,212,0.5)]"
    >
      <div className="relative min-h-[180px] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.32),transparent_36%),linear-gradient(135deg,#0f172a,#111827_55%,#0e2a3a)]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={batch.title} className="absolute inset-0 h-full w-full object-cover opacity-85 transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-20 items-center justify-center rounded-[26px] border border-white/10 bg-white/10 text-cyan-100">
              <ClipboardCheck size={40} strokeWidth={1.8} />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/10" />
        <div className="absolute left-5 right-5 top-5 flex items-start justify-between gap-3">
          <span className={`rounded-full px-3.5 py-1.5 text-xs font-black backdrop-blur ${batch.is_published ? "bg-emerald-500/20 text-emerald-200 outline outline-1 outline-emerald-400/40" : "bg-amber-500/15 text-amber-300 outline outline-1 outline-amber-400/40"}`}>
            {batch.is_published ? "প্রকাশিত" : "ড্রাফট"}
          </span>
          <span className="rounded-full border border-white/15 bg-black/30 px-3.5 py-1.5 text-xs font-black text-white backdrop-blur">
            {priceLabel(batch)}
          </span>
        </div>
        <div className="absolute bottom-5 left-5 right-5">
          <h2 className="line-clamp-2 text-xl font-black leading-tight text-white">{batch.title}</h2>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-2 min-h-[40px] text-sm leading-6 text-slate-300">
          {batch.short_description || "সংক্ষিপ্ত বিবরণ যোগ করা হয়নি।"}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-gray-900/60 px-3 py-1.5">
            <CalendarClock size={13} /> {batch.start_date || "শুরু নেই"} – {batch.end_date || "শেষ নেই"}
          </span>
          <span className="rounded-full border border-slate-800 bg-gray-900/60 px-3 py-1.5">{bn(batch.exam_count)} পরীক্ষা</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-gray-900/60 px-3 py-1.5">
            <Users size={13} /> {bn(batch.enrolled_count)}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onManage();
            }}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white hover:bg-cyan-500"
          >
            <Settings2 size={16} /> রুটিন ম্যানেজ
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="grid size-10 place-items-center rounded-xl border border-slate-800 text-blue-50 hover:bg-white/5"
          >
            <Pencil size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
