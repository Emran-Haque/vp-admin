"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import ConfirmDeleteDialog from "@/components/confirm-delete-dialog";
import ErrorState from "@/components/error-state";
import { PageLoader } from "@/components/loaders";
import { getMediaUrl } from "@/redux/api/baseApi";
import {
  type HeroContent,
  useDeleteHeroSlideMutation,
  useGetHeroSlidesQuery,
  useUpdateHeroSlideMutation,
} from "@/redux/api/contentApi";
import BannerFormModal from "./banner-form-modal";

export default function BannerManager({ embedded = false }: { embedded?: boolean } = {}) {
  const { data, isLoading, isError, refetch } = useGetHeroSlidesQuery();
  const [updateSlide, { isLoading: updating }] = useUpdateHeroSlideMutation();
  const [deleteSlide, { isLoading: deleting }] = useDeleteHeroSlideMutation();
  const [editing, setEditing] = useState<HeroContent | null | undefined>();
  const [deletingSlide, setDeletingSlide] = useState<HeroContent | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const slides = useMemo(
    () => [...(data?.results ?? [])].sort((a, b) => a.ordering - b.ordering || a.id - b.id),
    [data],
  );
  const activeCount = slides.filter((slide) => slide.is_active).length;

  const toggleVisibility = async (slide: HeroContent) => {
    setActionError(null);
    try {
      await updateSlide({ id: slide.id, data: { is_active: !slide.is_active } }).unwrap();
    } catch {
      setActionError("ব্যানারের দৃশ্যমান অবস্থা পরিবর্তন করা যায়নি। আবার চেষ্টা করুন।");
    }
  };

  const move = async (slide: HeroContent, direction: -1 | 1) => {
    const currentIndex = slides.findIndex((item) => item.id === slide.id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= slides.length) return;

    const reordered = [...slides];
    [reordered[currentIndex], reordered[nextIndex]] = [reordered[nextIndex], reordered[currentIndex]];
    setActionError(null);
    try {
      await Promise.all(
        reordered.map((item, index) =>
          item.ordering === index
            ? Promise.resolve()
            : updateSlide({ id: item.id, data: { ordering: index } }).unwrap(),
        ),
      );
    } catch {
      setActionError("ব্যানারের ক্রম পরিবর্তন করা যায়নি। আবার চেষ্টা করুন।");
    }
  };

  const confirmDelete = async () => {
    if (!deletingSlide) return;
    setActionError(null);
    try {
      await deleteSlide(deletingSlide.id).unwrap();
      setDeletingSlide(null);
    } catch {
      setActionError("ব্যানারটি মুছে ফেলা যায়নি। আবার চেষ্টা করুন।");
    }
  };

  return (
    <section
      className={
        embedded
          ? "overflow-hidden"
          : "overflow-hidden rounded-lg border border-slate-800 bg-slate-950/35"
      }
    >
      <div className={`flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 ${embedded ? "px-0 pt-0 pb-4" : "bg-slate-900/70 px-4 py-4 sm:px-5"}`}>
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-black text-slate-50">হোমপেজ ব্যানার</h2>
            <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-300">
              মোট {slides.length.toLocaleString("bn-BD")}
            </span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
              চালু {activeCount.toLocaleString("bn-BD")}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            চালু ব্যানারগুলো ক্রম অনুযায়ী হোমপেজের ক্যারোসেলে দেখাবে।
          </p>
        </div>

        <button type="button" onClick={() => setEditing(null)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-black text-slate-950 hover:bg-sky-400">
          <Plus size={16} />
          নতুন ব্যানার
        </button>
      </div>

      {actionError ? (
        <p className="mx-4 mt-4 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300 sm:mx-5">{actionError}</p>
      ) : null}

      <div className="p-4 sm:p-5">
        {isLoading ? (
          <PageLoader label="ব্যানারের তালিকা লোড হচ্ছে..." />
        ) : isError ? (
          <div className="space-y-3 text-center">
            <ErrorState message="ব্যানারের তালিকা আনা যায়নি।" />
            <button type="button" onClick={() => refetch()} className="h-9 rounded-lg border border-slate-700 px-3 text-xs font-bold text-slate-300">আবার চেষ্টা করুন</button>
          </div>
        ) : slides.length === 0 ? (
          <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-slate-700 bg-slate-900/30 px-5 text-center">
            <div>
              <ImagePlus className="mx-auto text-slate-500" size={30} />
              <h3 className="mt-3 text-base font-black text-slate-200">এখনো কোনো ব্যানার যোগ করা হয়নি</h3>
              <p className="mt-1 text-sm text-slate-500">প্রথম ব্যানার যোগ করলে সেটি হোমপেজে দেখানো যাবে।</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {slides.map((slide, index) => {
              const imageUrl = getMediaUrl(slide.image);
              return (
                <article key={slide.id} className="min-w-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
                  <div className="relative aspect-video overflow-hidden bg-slate-950">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt={slide.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-sm text-slate-600">ছবি নেই</div>
                    )}
                    <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black backdrop-blur ${slide.is_active ? "border-emerald-300/30 bg-emerald-950/80 text-emerald-200" : "border-slate-500/30 bg-slate-950/80 text-slate-300"}`}>
                      {slide.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                      {slide.is_active ? "ওয়েবসাইটে দেখা যাচ্ছে" : "লুকানো আছে"}
                    </span>
                    <span className="absolute right-3 top-3 rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-bold text-slate-200 backdrop-blur">ক্রম {index + 1}</span>
                  </div>

                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-black text-slate-100">{slide.title}</h3>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-400">{slide.subtitle || slide.target_url || "কোনো অতিরিক্ত লেখা বা লিংক নেই"}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                      <IconButton label="এক ধাপ আগে নিন" disabled={index === 0 || updating} onClick={() => move(slide, -1)}><ArrowUp size={15} /></IconButton>
                      <IconButton label="এক ধাপ পরে নিন" disabled={index === slides.length - 1 || updating} onClick={() => move(slide, 1)}><ArrowDown size={15} /></IconButton>
                      <IconButton label={slide.is_active ? "ব্যানার লুকান" : "ব্যানার দেখান"} disabled={updating} onClick={() => toggleVisibility(slide)}>{slide.is_active ? <EyeOff size={15} /> : <Eye size={15} />}</IconButton>
                      <IconButton label="সম্পাদনা করুন" onClick={() => setEditing(slide)}><Pencil size={15} /></IconButton>
                      <IconButton label="মুছে ফেলুন" danger onClick={() => setDeletingSlide(slide)}><Trash2 size={15} /></IconButton>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {editing !== undefined ? (
        <BannerFormModal slide={editing} suggestedOrder={slides.length} onClose={() => setEditing(undefined)} onSaved={() => setEditing(undefined)} />
      ) : null}

      <ConfirmDeleteDialog
        open={Boolean(deletingSlide)}
        itemName={deletingSlide?.title ?? ""}
        itemType="ব্যানার"
        impact="ব্যানারটি ক্যারোসেল থেকে স্থায়ীভাবে মুছে যাবে। এই কাজটি ফেরানো যাবে না।"
        isLoading={deleting}
        onClose={() => setDeletingSlide(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}

function IconButton({ label, children, danger = false, disabled = false, onClick }: { label: string; children: ReactNode; danger?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-8 place-items-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-30 ${danger ? "border-red-400/20 text-red-300 hover:bg-red-400/10" : "border-slate-700 text-slate-300 hover:bg-white/5 hover:text-white"}`}
    >
      {children}
    </button>
  );
}
