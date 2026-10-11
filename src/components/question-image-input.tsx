"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Loader } from "@/components/loaders";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type Props = {
  imageUrl?: string | null;
  imageFile?: File | null;
  imageAltText?: string;
  removeImage?: boolean;
  onChange: (patch: {
    imageFile?: File | null;
    imageAltText?: string;
    removeImage?: boolean;
  }) => void;
};

export default function QuestionImageInput({
  imageUrl,
  imageFile,
  imageAltText = "",
  removeImage = false,
  onChange,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const visibleImage = Boolean(imageFile || (!removeImage && imageUrl));

  const chooseImage = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      setError("JPG, PNG অথবা WEBP ছবি দিন।");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("ছবিটি ৫ MB-এর মধ্যে হতে হবে।");
      return;
    }
    onChange({ imageFile: file, removeImage: false });
  };

  const remove = () => {
    setError(null);
    onChange({
      imageFile: null,
      imageAltText: "",
      removeImage: Boolean(imageUrl),
    });
  };

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-slate-700 bg-gray-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-blue-50">প্রশ্নের ছবি (অপশনাল)</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Geometry diagram, graph বা table · JPG/PNG/WEBP · সর্বোচ্চ ৫ MB
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-400">
            <ImagePlus size={16} />
            {visibleImage ? "ছবি বদলান" : "ছবি যোগ করুন"}
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              type="file"
              onChange={(event) => {
                chooseImage(event.currentTarget.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </label>
          {visibleImage ? (
            <button
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2 text-sm font-semibold text-red-300"
              onClick={remove}
              type="button"
            >
              <Trash2 size={15} /> ছবি সরান
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

      {visibleImage ? (
        <div className="mt-4">
          {imageFile ? (
            <LocalImagePreview
              alt={imageAltText || "প্রশ্নের ছবির প্রিভিউ"}
              file={imageFile}
              key={`${imageFile.name}-${imageFile.size}-${imageFile.lastModified}`}
            />
          ) : (
            <LoadablePreviewImage
              alt={imageAltText || "প্রশ্নের ছবির প্রিভিউ"}
              src={imageUrl ?? ""}
            />
          )}
          <label className="mt-3 block text-xs font-semibold text-slate-300">
            ছবির বর্ণনা (screen reader-এর জন্য)
            <input
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-gray-800 px-3.5 py-2.5 text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none"
              maxLength={180}
              onChange={(event) => onChange({ imageAltText: event.target.value })}
              placeholder="যেমন: ABC ত্রিভুজে AB ও AC সমান"
              type="text"
              value={imageAltText}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

function LocalImagePreview({ file, alt }: { file: File; alt: string }) {
  const [src] = useState(() => URL.createObjectURL(file));

  useEffect(() => () => URL.revokeObjectURL(src), [src]);

  return <LoadablePreviewImage alt={alt} src={src} />;
}

function LoadablePreviewImage({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <div className="relative grid min-h-40 place-items-center overflow-hidden rounded-xl border border-slate-700 bg-white">
      {status === "loading" ? (
        <div className="absolute inset-0 grid place-items-center bg-slate-100" role="status" aria-label="ছবি লোড হচ্ছে">
          <Loader className="size-7 border-slate-300 border-t-blue-500" />
        </div>
      ) : null}
      {status === "error" ? (
        <p className="px-4 py-10 text-center text-sm font-semibold text-red-500">ছবিটি লোড করা যায়নি। অন্য ছবি দিন অথবা আবার চেষ্টা করুন।</p>
      ) : null}
      {/* User media and local object URLs cannot use a fixed Next image loader. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={alt}
        className={`max-h-80 w-full object-contain ${status === "error" ? "hidden" : "block"}`}
        onError={() => setStatus("error")}
        onLoad={() => setStatus("loaded")}
        src={src}
      />
    </div>
  );
}
