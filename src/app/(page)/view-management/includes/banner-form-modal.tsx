"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ImagePlus, Link2, Save, UploadCloud, X } from "lucide-react";
import ImageSizeHint from "@/components/image-size-hint";
import { extractErrorMessage } from "@/lib/api-error";
import { getMediaUrl } from "@/redux/api/baseApi";
import {
  type HeroContent,
  type HeroPageKey,
  useCreateHeroSlideMutation,
  useUpdateHeroSlideMutation,
} from "@/redux/api/contentApi";
import { getBannerImageSpec } from "./banner-image-spec";

const fieldClass =
  "h-11 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/10";

type ImageInfo = { width: number; height: number };

export default function BannerFormModal({
  pageKey,
  slide,
  suggestedOrder,
  onClose,
  onSaved,
}: {
  pageKey: HeroPageKey;
  slide: HeroContent | null;
  suggestedOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(slide?.title ?? "");
  const [subtitle, setSubtitle] = useState(slide?.subtitle ?? "");
  const [buttonText, setButtonText] = useState(slide?.button_text ?? "");
  const [targetUrl, setTargetUrl] = useState(slide?.target_url ?? "");
  const [ordering, setOrdering] = useState(String(slide?.ordering ?? suggestedOrder));
  const [isActive, setIsActive] = useState(slide?.is_active ?? true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(getMediaUrl(slide?.image));
  const [imageWarning, setImageWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createSlide, { isLoading: creating }] = useCreateHeroSlideMutation();
  const [updateSlide, { isLoading: updating }] = useUpdateHeroSlideMutation();
  const isBusy = creating || updating;
  const imageSpec = getBannerImageSpec(pageKey);

  useEffect(() => {
    if (!imageFile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUrl(getMediaUrl(slide?.image));
      return;
    }
    const nextUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [imageFile, slide?.image]);

  const chooseImage = async (file: File | null) => {
    setError(null);
    setImageWarning(null);
    setImageInfo(null);
    if (!file) {
      setImageFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("শুধু JPG, PNG, WebP বা অন্য ছবি ফাইল নির্বাচন করুন।");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("ছবির সাইজ ৫ MB-এর বেশি হতে পারবে না।");
      return;
    }

    try {
      const info = await inspectImage(file);
      const ratio = info.width / info.height;
      if (Math.abs(ratio - imageSpec.ratio) > 0.025) {
        setError(`ছবিটি ${imageSpec.ratioLabel} নয় (${info.width} × ${info.height})। ${imageSpec.recommendedWidth} × ${imageSpec.recommendedHeight} বা অন্য ${imageSpec.ratioLabel} ছবি দিন।`);
        return;
      }
      if (info.width < imageSpec.minimumWidth || info.height < imageSpec.minimumHeight) {
        setImageWarning(`ছবিটি ব্যবহার করা যাবে, তবে বড় স্ক্রিনে ঝাপসা হতে পারে। অন্তত ${imageSpec.minimumWidth} × ${imageSpec.minimumHeight} ব্যবহার করুন।`);
      }
      setImageFile(file);
      setImageInfo(info);
    } catch {
      setError("ছবিটি পড়া যায়নি। অন্য একটি ছবি নির্বাচন করুন।");
    }
  };

  const save = async () => {
    const cleanTitle = title.trim();
    const cleanButton = buttonText.trim();
    const cleanUrl = targetUrl.trim();
    if (!cleanTitle) {
      setError("ব্যানারটি চিনতে একটি নাম লিখুন।");
      return;
    }
    if (!slide && !imageFile) {
      setError("ব্যানারের ছবি নির্বাচন করুন।");
      return;
    }
    if (cleanButton && !cleanUrl) {
      setError("বাটনের লেখা দিলে বাটনটি কোথায় যাবে সেই লিংকও দিন।");
      return;
    }
    if (cleanUrl && !isValidTarget(cleanUrl)) {
      setError("লিংকটি /course-এর মতো ওয়েবসাইট পথ অথবা সম্পূর্ণ https:// লিংক হতে হবে।");
      return;
    }

    const formData = new FormData();
    formData.append("page_key", pageKey);
    formData.append("title", cleanTitle);
    formData.append("subtitle", subtitle.trim());
    formData.append("button_text", cleanButton);
    formData.append("target_url", cleanUrl);
    formData.append("ordering", String(Math.max(0, Number(ordering) || 0)));
    formData.append("is_active", String(isActive));
    if (imageFile) formData.append("image", imageFile);

    setError(null);
    try {
      if (slide) {
        await updateSlide({ id: slide.id, data: formData }).unwrap();
      } else {
        await createSlide(formData).unwrap();
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="flex max-h-[94vh] w-full max-w-[820px] flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-[0_24px_90px_rgba(0,0,0,0.55)]" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="text-base font-black text-slate-50">{slide ? "ব্যানার সম্পাদনা" : "নতুন ব্যানার যোগ করুন"}</h2>
            <p className="mt-0.5 text-xs text-slate-500">ছবি ও দেখানোর নিয়ম এক জায়গা থেকে ঠিক করুন।</p>
          </div>
          <button type="button" onClick={onClose} disabled={isBusy} className="grid size-9 place-items-center rounded-lg border border-slate-700 text-slate-400 hover:bg-white/5" aria-label="বন্ধ করুন">
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {error ? (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-xs leading-5 text-red-300">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
            <div className="min-w-0">
              <label className="mb-2 block text-xs font-bold text-slate-300">ব্যানারের ছবি *</label>
              <label className={`group relative block cursor-pointer overflow-hidden rounded-lg border border-dashed border-slate-600 bg-slate-950 hover:border-sky-400/60 ${imageSpec.previewClass}`}>
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="ব্যানার প্রিভিউ" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center text-slate-600"><ImagePlus size={32} /></span>
                )}
                <span className="absolute inset-x-3 bottom-3 mx-auto flex w-fit items-center gap-2 rounded-lg bg-slate-950/85 px-3 py-2 text-xs font-black text-white backdrop-blur">
                  <UploadCloud size={15} />
                  {previewUrl ? "ছবি পরিবর্তন করুন" : "ডিভাইস থেকে ছবি নিন"}
                </span>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => chooseImage(event.target.files?.[0] ?? null)} />
              </label>
              <ImageSizeHint kind={imageSpec.hintKind} />
              {imageInfo ? (
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                  <CheckCircle2 size={13} />
                  {imageInfo.width} × {imageInfo.height} · {imageSpec.ratioLabel} ঠিক আছে
                </p>
              ) : null}
              {imageWarning ? <p className="mt-1.5 text-[11px] leading-5 text-amber-300">{imageWarning}</p> : null}
            </div>

            <div className="space-y-3.5">
              <Field label="ব্যানারের নাম *" hint="শুধু ম্যানেজমেন্টে সহজে চিনতে ব্যবহার হবে।">
                <input className={fieldClass} value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} placeholder="যেমন: ভর্তি প্রস্তুতি ২০২৬" />
              </Field>

              <Field label="ছোট বিবরণ" hint="ছবিতেই সব লেখা থাকলে এটি খালি রাখুন।">
                <input className={fieldClass} value={subtitle} maxLength={300} onChange={(event) => setSubtitle(event.target.value)} placeholder="ঐচ্ছিক" />
              </Field>

              <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-3">
                <Field label="বাটনের লেখা">
                  <input className={fieldClass} value={buttonText} maxLength={80} onChange={(event) => setButtonText(event.target.value)} placeholder="যেমন: বিস্তারিত দেখুন" />
                </Field>
                <Field label="দেখানোর ক্রম">
                  <input className={fieldClass} type="number" min={0} value={ordering} onChange={(event) => setOrdering(event.target.value)} />
                </Field>
              </div>

              <Field label="বাটনের গন্তব্য লিংক">
                <div className="relative">
                  <Link2 size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input className={`${fieldClass} pl-10`} value={targetUrl} maxLength={300} onChange={(event) => setTargetUrl(event.target.value)} placeholder="/course অথবা https://..." />
                </div>
              </Field>

              <button type="button" role="switch" aria-checked={isActive} onClick={() => setIsActive((value) => !value)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-950/40 px-3.5 py-3 text-left">
                <span>
                  <span className="block text-sm font-bold text-slate-200">ওয়েবসাইটে ব্যানারটি দেখান</span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">বন্ধ রাখলে ব্যানারটি সংরক্ষিত থাকবে, কিন্তু ক্যারোসেলে আসবে না।</span>
                </span>
                <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${isActive ? "bg-emerald-500" : "bg-slate-700"}`}>
                  <span className={`absolute top-1 size-4 rounded-full bg-white transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-800 px-4 py-3.5 sm:flex-row sm:justify-end sm:px-5">
          <button type="button" onClick={onClose} disabled={isBusy} className="h-10 rounded-lg border border-slate-700 px-4 text-sm font-bold text-slate-300 hover:bg-white/5 disabled:opacity-50">বাতিল</button>
          <button type="button" onClick={save} disabled={isBusy} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 text-sm font-black text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">
            <Save size={16} />
            {isBusy ? "সংরক্ষণ হচ্ছে..." : slide ? "পরিবর্তন সংরক্ষণ করুন" : "ব্যানার যোগ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-bold text-slate-300">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] leading-4 text-slate-500">{hint}</span> : null}
    </label>
  );
}

function isValidTarget(value: string) {
  return /^\/(?!\/)/.test(value) || /^https:\/\//i.test(value);
}

function inspectImage(file: File): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      reject(new Error("Invalid image"));
      URL.revokeObjectURL(objectUrl);
    };
    image.src = objectUrl;
  });
}
