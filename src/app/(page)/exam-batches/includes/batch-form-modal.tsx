"use client";

import { useState } from "react";
import { AlertTriangle, ImagePlus, Save, X } from "lucide-react";
import {
  useCreateExamBatchMutation,
  useUpdateExamBatchMutation,
  type ExamBatch,
} from "@/redux/api/examsApi";
import { extractErrorMessage } from "@/lib/api-error";

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

type BatchForm = {
  title: string;
  short_description: string;
  description: string;
  promo_video_url: string;
  price: string;
  old_price: string;
  discount: string;
  start_date: string;
  end_date: string;
  is_published: boolean;
};

const emptyForm: BatchForm = {
  title: "",
  short_description: "",
  description: "",
  promo_video_url: "",
  price: "0.00",
  old_price: "",
  discount: "0.00",
  start_date: "",
  end_date: "",
  is_published: false,
};

function formFromBatch(batch: ExamBatch): BatchForm {
  return {
    title: batch.title,
    short_description: batch.short_description || "",
    description: batch.description || "",
    promo_video_url: batch.promo_video_url || "",
    price: batch.price || "0.00",
    old_price: batch.old_price || "",
    discount: batch.discount || "0.00",
    start_date: batch.start_date || "",
    end_date: batch.end_date || "",
    is_published: batch.is_published,
  };
}

const fieldClass =
  "w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40";

/** Create / edit an exam batch in a popup. `batch` null → create mode. */
export default function BatchFormModal({
  batch,
  onClose,
  onSaved,
}: {
  batch: ExamBatch | null;
  onClose: () => void;
  onSaved: (saved: ExamBatch) => void;
}) {
  const [form, setForm] = useState<BatchForm>(batch ? formFromBatch(batch) : emptyForm);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createBatch, { isLoading: isCreating }] = useCreateExamBatchMutation();
  const [updateBatch, { isLoading: isUpdating }] = useUpdateExamBatchMutation();
  const isBusy = isCreating || isUpdating;

  const previewUrl = thumbnail
    ? URL.createObjectURL(thumbnail)
    : resolveMediaUrl(batch?.thumbnail ?? null);

  const set = <K extends keyof BatchForm>(key: K, value: BatchForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (!form.title.trim()) return;
    setError(null);
    try {
      let saved: ExamBatch;
      if (thumbnail) {
        // Multipart when a new thumbnail is picked.
        const fd = new FormData();
        fd.append("title", form.title);
        fd.append("short_description", form.short_description);
        fd.append("description", form.description);
        fd.append("promo_video_url", form.promo_video_url);
        fd.append("price", form.price || "0");
        fd.append("discount", form.discount || "0");
        fd.append("is_published", String(form.is_published));
        if (form.old_price) fd.append("old_price", form.old_price);
        if (form.start_date) fd.append("start_date", form.start_date);
        if (form.end_date) fd.append("end_date", form.end_date);
        fd.append("thumbnail", thumbnail);
        saved = batch
          ? await updateBatch({ id: batch.id, data: fd }).unwrap()
          : await createBatch(fd).unwrap();
      } else {
        const payload = {
          ...form,
          old_price: form.old_price || null,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
        };
        saved = batch
          ? await updateBatch({ id: batch.id, data: payload }).unwrap()
          : await createBatch(payload).unwrap();
      }
      onSaved(saved);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-[620px] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_20px_60px_-15px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="text-lg font-bold text-blue-50">
            {batch ? "ব্যাচ সম্পাদনা করুন" : "নতুন ব্যাচ তৈরি করুন"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-6">
          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          ) : null}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">কভার ছবি</label>
            <label className="group relative flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-700 bg-gray-800/50 hover:border-cyan-500/50">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="থাম্বনেইল" className="absolute inset-0 h-full w-full object-cover" />
              ) : null}
              <div className={`relative z-10 flex flex-col items-center gap-1.5 rounded-xl px-4 py-2 text-center ${previewUrl ? "bg-black/50 text-white" : "text-slate-400"}`}>
                <ImagePlus size={22} />
                <span className="text-xs font-bold">{previewUrl ? "ছবি পরিবর্তন করুন" : "কভার ছবি আপলোড করুন"}</span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">ব্যাচের নাম *</label>
            <input className={fieldClass} placeholder="যেমন: ভর্তি ফাইনাল মডেল টেস্ট ব্যাচ" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">সংক্ষিপ্ত বিবরণ</label>
            <input className={fieldClass} placeholder="এক লাইনের বিবরণ" value={form.short_description} onChange={(e) => set("short_description", e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">বিস্তারিত বিবরণ</label>
            <textarea className={`${fieldClass} min-h-24`} placeholder="ব্যাচ সম্পর্কে বিস্তারিত" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">প্রমো ভিডিও URL</label>
            <input className={fieldClass} placeholder="YouTube / Facebook / Drive / Vimeo link" value={form.promo_video_url} onChange={(e) => set("promo_video_url", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2 max-[520px]:grid-cols-1">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">মূল্য (৳)</label>
              <input className={fieldClass} placeholder="0.00" value={form.price} onChange={(e) => set("price", e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">পুরোনো মূল্য</label>
              <input className={fieldClass} placeholder="—" value={form.old_price} onChange={(e) => set("old_price", e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">ছাড় (%)</label>
              <input className={fieldClass} placeholder="0" value={form.discount} onChange={(e) => set("discount", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 max-[520px]:grid-cols-1">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">শুরুর তারিখ</label>
              <input className={fieldClass} type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">শেষ তারিখ</label>
              <input className={fieldClass} type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-gray-800/50 px-4 py-3 text-sm font-semibold text-slate-200">
            <input type="checkbox" checked={form.is_published} onChange={(e) => set("is_published", e.target.checked)} />
            শিক্ষার্থীদের জন্য প্রকাশ করুন (তালিকা ও ক্রয় অপশনে দেখাবে)
          </label>
        </div>

        <div className="flex justify-end gap-2.5 border-t border-slate-800 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isBusy || !form.title.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            <Save size={16} />
            {isBusy ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
