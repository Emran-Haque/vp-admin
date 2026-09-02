"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, Info, X } from "lucide-react";
import ImageSizeHint from "@/components/image-size-hint";
import { extractErrorMessage } from "@/lib/api-error";
import { getMediaUrl } from "@/redux/api/baseApi";
import {
  useGetAboutContentQuery,
  useSaveAboutContentMutation,
} from "@/redux/api/contentApi";
import ModalShell, { Field, areaClass, fieldClass } from "./modal-shell";

/** Homepage "আমাদের সম্পর্কে" block — a single row, so this is edit-only. */
export default function AboutModal({ onClose }: { onClose: () => void }) {
  const { data, isLoading } = useGetAboutContentQuery();
  const [saveAbout, { isLoading: isSaving }] = useSaveAboutContentMutation();

  const about = Array.isArray(data) ? data[0] : data?.results?.[0];
  const [title, setTitle] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // The query resolves after first render, so local edits start as null and
  // fall back to the server value until the admin actually types.
  const titleValue = title ?? about?.title ?? "";
  const descriptionValue = description ?? about?.description ?? "";
  const activeValue = isActive ?? about?.is_active ?? true;
  const preview = image ? URL.createObjectURL(image) : getMediaUrl(about?.image ?? null);

  const save = async () => {
    setError(null);
    setSuccess(null);
    try {
      if (image) {
        const fd = new FormData();
        fd.append("title", titleValue);
        fd.append("description", descriptionValue);
        fd.append("is_active", String(activeValue));
        fd.append("image", image);
        await saveAbout({ id: about?.id, data: fd }).unwrap();
      } else {
        await saveAbout({
          id: about?.id,
          data: { title: titleValue, description: descriptionValue, is_active: activeValue },
        }).unwrap();
      }
      setSuccess("সেভ হয়ে গেছে।");
      setImage(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <ModalShell
      error={error}
      footerNote="হোমপেজের 'আমাদের সম্পর্কে' অংশে দেখা যাবে"
      icon={<Info size={17} />}
      isSaving={isSaving}
      onClose={onClose}
      onSave={save}
      subtitle="হোমপেজে প্রতিষ্ঠান পরিচিতির অংশ"
      success={success}
      title="আমাদের সম্পর্কে"
    >
      {isLoading ? (
        <p className="py-10 text-center text-sm text-slate-400">লোড হচ্ছে…</p>
      ) : (
        <div className="space-y-4">
          <Field label="শিরোনাম">
            <input
              className={fieldClass}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: আমাদের সম্পর্কে"
              value={titleValue}
            />
          </Field>

          <Field label="বিবরণ">
            <textarea
              className={areaClass}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="প্রতিষ্ঠান সম্পর্কে সংক্ষেপে লিখুন"
              rows={5}
              value={descriptionValue}
            />
          </Field>

          <div>
            <span className="mb-1.5 block text-xs font-bold text-slate-400">ছবি</span>
            <div className="flex items-center gap-3">
              <label className="relative grid h-[96px] w-[96px] cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-slate-700 bg-slate-950/60 text-slate-500 hover:border-sky-400/50">
                {preview ? (
                  <Image alt="" className="object-cover object-center" fill src={preview} unoptimized />
                ) : (
                  <ImagePlus size={18} />
                )}
                <input
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>
              {image ? (
                <button
                  className="flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-white/5"
                  onClick={() => setImage(null)}
                  type="button"
                >
                  <X size={12} />
                  বাতিল
                </button>
              ) : null}
            </div>
            <ImageSizeHint kind="aboutImage" />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-950/40 px-3.5 py-3">
            <input
              checked={activeValue}
              className="size-4 accent-sky-500"
              onChange={(e) => setIsActive(e.target.checked)}
              type="checkbox"
            />
            <span className="text-xs font-bold text-slate-300">
              হোমপেজে দেখান
              <span className="ml-1.5 font-normal text-slate-500">
                (বন্ধ করলে সেকশনটি লুকিয়ে যাবে)
              </span>
            </span>
          </label>
        </div>
      )}
    </ModalShell>
  );
}
