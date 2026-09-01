"use client";

import { useEffect, useMemo } from "react";
import { ImagePlus, Plus, Sparkles, Trash2, X } from "lucide-react";
import { getMediaUrl } from "@/redux/api/baseApi";

export type BookSummaryPointDraft = {
  id: string;
  text: string;
};

export type BookFeatureDraft = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  iconImage?: string | null;
  iconImageFile?: File | null;
  removeIconImage?: boolean;
};

export type ApiBookSummaryPoint = {
  id?: number;
  text: string;
};

export type ApiBookFeature = {
  id?: number;
  title: string;
  description: string;
  icon?: string;
  icon_image?: string | null;
};

const inputClass =
  "w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

function persistedId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

function validFeatures(items: BookFeatureDraft[]) {
  return items.filter((item) => item.title.trim());
}

export function summaryDraftsFromApi(items?: ApiBookSummaryPoint[] | null): BookSummaryPointDraft[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item.text?.trim())
    .map((item) => ({ id: String(item.id ?? crypto.randomUUID()), text: item.text }));
}

export function featureDraftsFromApi(items?: ApiBookFeature[] | null): BookFeatureDraft[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item.title?.trim())
    .map((item) => ({
      id: String(item.id ?? crypto.randomUUID()),
      title: item.title,
      description: item.description || "",
      icon: item.icon || "",
      iconImage: item.icon_image || null,
      iconImageFile: null,
      removeIconImage: false,
    }));
}

export function serializeSummaryPoints(items: BookSummaryPointDraft[]) {
  return items
    .map((item, index) => ({ text: item.text.trim(), ordering: index }))
    .filter((item) => item.text);
}

export function serializeBookFeatures(items: BookFeatureDraft[]) {
  return validFeatures(items).map((item, index) => ({
    id: persistedId(item.id),
    title: item.title.trim(),
    description: item.description.trim(),
    icon: item.icon?.trim() || "",
    icon_image_field: item.iconImageFile ? `feature_icon_image_${index}` : "",
    remove_icon_image: Boolean(item.removeIconImage),
    ordering: index,
  }));
}

export function appendBookFeatureImages(formData: FormData, items: BookFeatureDraft[]) {
  validFeatures(items).forEach((item, index) => {
    if (item.iconImageFile) {
      formData.append(`feature_icon_image_${index}`, item.iconImageFile);
    }
  });
}

function FeatureIconPreview({ item }: { item: BookFeatureDraft }) {
  const previewUrl = useMemo(
    () => (item.iconImageFile ? URL.createObjectURL(item.iconImageFile) : null),
    [item.iconImageFile]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const imageUrl = previewUrl || (!item.removeIconImage ? getMediaUrl(item.iconImage) : null);

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" className="h-full w-full rounded-[10px] object-cover" />
    );
  }

  return (
    <span className="grid h-full w-full place-items-center rounded-[10px] bg-cyan-500/15 text-cyan-300">
      <Sparkles size={20} strokeWidth={2.4} />
    </span>
  );
}

export function BookSummaryPointsEditor({
  items,
  onChange,
}: {
  items: BookSummaryPointDraft[];
  onChange: (items: BookSummaryPointDraft[]) => void;
}) {
  const add = () => onChange([...items, { id: crypto.randomUUID(), text: "" }]);
  const update = (id: string, text: string) =>
    onChange(items.map((item) => (item.id === id ? { ...item, text } : item)));
  const remove = (id: string) => onChange(items.filter((item) => item.id !== id));

  return (
    <div className="rounded-[14px] border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-slate-100">বইয়ের সংক্ষিপ্ত বিবরণের পয়েন্ট</h3>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">
            প্রতিটি পয়েন্ট পাবলিক পেজে সবুজ টিক দিয়ে দেখাবে। খালি ঘর সেভের সময় বাদ যাবে।
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-500/20 px-2.5 py-1.5 text-xs font-semibold text-blue-300"
        >
          <Plus size={14} />
          পয়েন্ট যোগ করুন
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2.5">
        {items.map((item, index) => (
          <div key={item.id} className="grid grid-cols-[1fr_auto] gap-2 max-[520px]:grid-cols-1">
            <input
              value={item.text}
              onChange={(event) => update(item.id, event.target.value)}
              placeholder={`পয়েন্ট ${index + 1}`}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="grid size-10 place-items-center rounded-[10px] border border-red-500/30 bg-red-500/10 text-red-300 max-[520px]:size-auto max-[520px]:h-10"
              aria-label="পয়েন্ট মুছুন"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {items.length === 0 ? (
          <p className="py-2 text-center text-xs text-slate-500">এখনও কোনো পয়েন্ট যোগ করা হয়নি।</p>
        ) : null}
      </div>
    </div>
  );
}

export function BookFeaturesEditor({
  items,
  onChange,
}: {
  items: BookFeatureDraft[];
  onChange: (items: BookFeatureDraft[]) => void;
}) {
  const add = () =>
    onChange([
      ...items,
      { id: crypto.randomUUID(), title: "", description: "", icon: "", iconImage: null, iconImageFile: null },
    ]);
  const update = (id: string, patch: Partial<BookFeatureDraft>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const remove = (id: string) => onChange(items.filter((item) => item.id !== id));

  return (
    <div className="rounded-[14px] border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-slate-100">বইয়ের বিশেষ ফিচার</h3>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">
            ফিচারের আইকন হিসেবে ডিভাইস থেকে ছবি বাছাই করুন। ছবি না দিলে ডিফল্ট ফিচার আইকন দেখাবে।
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1.5 text-xs font-semibold text-emerald-300"
        >
          <Plus size={14} />
          ফিচার যোগ করুন
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {items.map((item, index) => {
          const hasImage = item.iconImageFile || (item.iconImage && !item.removeIconImage);
          return (
            <div key={item.id} className="rounded-xl border border-white/10 bg-gray-900/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-400">ফিচার {index + 1}</span>
                <button type="button" onClick={() => remove(item.id)} className="text-red-300" aria-label="ফিচার মুছুন">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-[72px_1fr] gap-3 max-[520px]:grid-cols-1">
                <div className="flex flex-col gap-2">
                  <div className="size-[72px] overflow-hidden rounded-[12px] border border-white/10 bg-white/5 p-1.5">
                    <FeatureIconPreview item={item} />
                  </div>
                  {hasImage ? (
                    <button
                      type="button"
                      onClick={() =>
                        update(item.id, {
                          iconImage: null,
                          iconImageFile: null,
                          removeIconImage: true,
                        })
                      }
                      className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-red-500/25 bg-red-500/10 px-2 text-[11px] font-bold text-red-300"
                    >
                      <X size={12} />
                      ছবি সরান
                    </button>
                  ) : null}
                </div>

                <div className="min-w-0">
                  <input
                    value={item.title}
                    onChange={(event) => update(item.id, { title: event.target.value })}
                    placeholder="ফিচারের নাম লিখুন"
                    className={inputClass}
                  />
                  <textarea
                    value={item.description}
                    onChange={(event) => update(item.id, { description: event.target.value })}
                    placeholder="ফিচার সম্পর্কে ছোট বর্ণনা লিখুন"
                    rows={2}
                    className={`${inputClass} mt-2 resize-none`}
                  />
                  <label className="mt-2 inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 text-xs font-bold text-cyan-200 hover:bg-cyan-500/15">
                    <ImagePlus size={14} />
                    আইকন ছবি বাছাই করুন
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        if (!file) return;
                        update(item.id, {
                          iconImageFile: file,
                          removeIconImage: false,
                        });
                      }}
                    />
                  </label>
                  <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
                    PNG, JPG বা WebP ব্যবহার করুন। না দিলে ডিফল্ট ফিচার আইকন থাকবে।
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 ? (
          <p className="py-2 text-center text-xs text-slate-500">এখনও কোনো ফিচার যোগ করা হয়নি।</p>
        ) : null}
      </div>

    </div>
  );
}
