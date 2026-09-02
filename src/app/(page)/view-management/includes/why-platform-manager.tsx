"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, CheckCircle2, ExternalLink, Eye, ImagePlus, PlayCircle, Plus, Save, Trophy, X } from "lucide-react";
import ErrorState from "@/components/error-state";
import { PageLoader } from "@/components/loaders";
import { getMediaUrl } from "@/redux/api/baseApi";
import {
  type WhyPlatformCard,
  type WhyPlatformContent,
  useCreateWhyPlatformMutation,
  useGetWhyPlatformsQuery,
  useUpdateWhyPlatformMutation,
} from "@/redux/api/contentApi";

type CardForm = WhyPlatformCard & { key: string };

const defaultCards: CardForm[] = [
  { key: "paid", title: "পেইড কোর্স", description: "প্রিমিয়াম স্ট্রাকচার্ড সিলেবাস", icon: "book", target_url: "/course", ordering: 0 },
  { key: "free", title: "ফ্রি কোর্স", description: "শুরু করো সম্পূর্ণ বিনামূল্যে", icon: "play", target_url: "/free-class", ordering: 1 },
  { key: "notice", title: "ভর্তি সার্কুলার", description: "সর্বশেষ আপডেট ও বিজ্ঞপ্তি", icon: "calendar", target_url: "/course", ordering: 2 },
  { key: "success", title: "আমাদের সাফল্য", description: "চান্স প্রাপ্ত শিক্ষার্থীদের গল্প", icon: "trophy", target_url: "/success", ordering: 3 },
];

const iconOptions = [
  { value: "book", label: "কোর্স", icon: BookOpen },
  { value: "play", label: "ভিডিও", icon: PlayCircle },
  { value: "calendar", label: "তারিখ", icon: CalendarDays },
  { value: "trophy", label: "সাফল্য", icon: Trophy },
  { value: "check", label: "টিক", icon: CheckCircle2 },
];

const iconMap = Object.fromEntries(iconOptions.map((item) => [item.value, item.icon]));

function toFormCards(section?: WhyPlatformContent): CardForm[] {
  const cards = section?.cards?.length ? section.cards : defaultCards;
  return cards
    .slice()
    .sort((a, b) => a.ordering - b.ordering)
    .map((card, index) => ({
      key: `${card.id ?? "new"}-${index}-${card.title}`,
      id: card.id,
      title: card.title,
      description: card.description,
      icon: card.icon || defaultCards[index % defaultCards.length]?.icon || "book",
      target_url: card.target_url || defaultCards[index % defaultCards.length]?.target_url || "/",
      ordering: index,
    }));
}

export default function WhyPlatformManager({ embedded = false }: { embedded?: boolean } = {}) {
  const { data, isLoading, isError, refetch } = useGetWhyPlatformsQuery();
  const [createSection, { isLoading: creating }] = useCreateWhyPlatformMutation();
  const [updateSection, { isLoading: updating }] = useUpdateWhyPlatformMutation();
  const section = useMemo(() => data?.results?.[0], [data]);
  const saving = creating || updating;

  const [title, setTitle] = useState("কেন ভাইয়াদের পাঠশালা");
  const [description, setDescription] = useState("অভিজ্ঞ মেন্টর, স্ট্রাকচার্ড সিলেবাস এবং রেজাল্ট-ফোকাসড প্রস্তুতি।");
  const [promoVideoUrl, setPromoVideoUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [cards, setCards] = useState<CardForm[]>(defaultCards);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!section) return;
    setTitle(section.title || "");
    setDescription(section.description || "");
    setPromoVideoUrl(section.promo_video_url || "");
    setIsActive(section.is_active);
    setThumbnailFile(null);
    setCards(toFormCards(section));
  }, [section]);

  const thumbnailPreview = thumbnailFile ? URL.createObjectURL(thumbnailFile) : getMediaUrl(section?.promo_video_thumbnail) || "";

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [previewOpen]);

  const patchCard = (key: string, patch: Partial<CardForm>) => {
    setCards((items) => items.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const addCard = () => {
    setCards((items) => [
      ...items,
      { key: `new-${Date.now()}`, title: "", description: "", icon: "book", target_url: "/", ordering: items.length },
    ]);
  };

  const removeCard = (key: string) => {
    setCards((items) => items.filter((item) => item.key !== key).map((item, index) => ({ ...item, ordering: index })));
  };

  const onSave = async () => {
    setStatus(null);
    const cleanCards = cards
      .map((card, index) => ({
        id: card.id,
        title: card.title.trim(),
        description: card.description.trim(),
        icon: card.icon,
        target_url: card.target_url.trim(),
        ordering: index,
      }))
      .filter((card) => card.title);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("promo_video_url", promoVideoUrl.trim());
    formData.append("is_active", String(isActive));
    formData.append("cards", JSON.stringify(cleanCards));
    if (thumbnailFile) formData.append("promo_video_thumbnail", thumbnailFile);

    try {
      if (section) {
        await updateSection({ id: section.id, data: formData }).unwrap();
      } else {
        await createSection(formData).unwrap();
      }
      setThumbnailFile(null);
      setStatus({ type: "success", message: "সেকশনটি সেভ হয়েছে।" });
    } catch {
      setStatus({ type: "error", message: "সেভ করা যায়নি। তথ্যগুলো দেখে আবার চেষ্টা করুন।" });
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
      <div className={`flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 ${embedded ? "px-0 pt-0 pb-4" : "bg-slate-900/70 px-4 py-4 sm:px-5"}`}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-black text-slate-50">কেন ভাইয়াদের পাঠশালা</h2>
            <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-300">মেইন ল্যান্ডিং</span>
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${isActive ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-slate-700 bg-slate-800 text-slate-400"}`}>{isActive ? "চালু" : "বন্ধ"}</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-400">ভিডিও থাম্বনেইল, ভিডিও লিংক এবং নিচের ছোট কার্ডগুলো ওয়েবসাইটে এই সেকশনে দেখাবে।</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/70 px-4 text-sm font-black text-slate-100 hover:bg-slate-800">
            <Eye size={16} />
            প্রিভিউ দেখুন
          </button>
          <button type="button" disabled={saving} onClick={onSave} className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-black text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60">
            <Save size={16} />
            {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {isLoading ? (
          <PageLoader label="সেকশনের তথ্য লোড হচ্ছে..." />
        ) : isError ? (
          <div className="space-y-3 text-center">
            <ErrorState message="সেকশনের তথ্য আনা যায়নি।" />
            <button type="button" onClick={() => refetch()} className="h-9 rounded-lg border border-slate-700 px-3 text-xs font-bold text-slate-300">আবার চেষ্টা করুন</button>
          </div>
        ) : (
          <div className="grid gap-5">
            <div className="space-y-5">
              {status ? <p className={`rounded-lg border px-3 py-2 text-xs ${status.type === "success" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-red-400/20 bg-red-400/10 text-red-300"}`}>{status.message}</p> : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-300">সেকশনের শিরোনাম</span>
                  <input value={title} onChange={(event) => setTitle(event.target.value)} className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-sky-400" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-300">ভিডিও লিংক</span>
                  <input value={promoVideoUrl} onChange={(event) => setPromoVideoUrl(event.target.value)} placeholder="YouTube/Facebook/Drive link" className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-sky-400" />
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-300">সংক্ষিপ্ত লেখা</span>
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-400" />
              </label>

              <div className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
                  <div className="grid aspect-video place-items-center bg-slate-950">
                    {thumbnailPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbnailPreview} alt="ভিডিও থাম্বনেইল" className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-center text-slate-500"><ImagePlus className="mx-auto" size={28} /><p className="mt-2 text-xs">থাম্বনেইল নেই</p></div>
                    )}
                  </div>
                  <label className="flex cursor-pointer items-center justify-center gap-2 px-3 py-3 text-xs font-black text-sky-300 hover:bg-white/5">
                    <ImagePlus size={15} />
                    থাম্বনেইল বাছুন
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => setThumbnailFile(event.target.files?.[0] ?? null)} />
                  </label>
                </div>

                <label className="flex min-h-[116px] items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                  <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="size-4 accent-sky-400" />
                  <span>
                    <span className="block text-sm font-black text-slate-100">ওয়েবসাইটে সেকশনটি দেখান</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-400">বন্ধ করলে API ডেটা থাকবে, কিন্তু মেইন ল্যান্ডিং পেজে এই অংশ দেখাবে না।</span>
                  </span>
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-black text-slate-100">সেকশনের ছোট কার্ড</h3>
                  <button type="button" onClick={addCard} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 px-3 text-xs font-black text-slate-200 hover:bg-white/5"><Plus size={14} /> নতুন কার্ড</button>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  {cards.map((card, index) => {
                    const Icon = iconMap[card.icon] ?? BookOpen;
                    return (
                      <article key={card.key} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-2 text-xs font-black text-slate-300"><Icon size={15} /> কার্ড {index + 1}</span>
                          <button type="button" onClick={() => removeCard(card.key)} className="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-red-400/10 hover:text-red-300"><X size={14} /></button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input value={card.title} onChange={(event) => patchCard(card.key, { title: event.target.value })} placeholder="কার্ডের নাম" className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-sky-400" />
                          <select value={card.icon} onChange={(event) => patchCard(card.key, { icon: event.target.value })} className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-sky-400">
                            {iconOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                        </div>
                        <input value={card.description} onChange={(event) => patchCard(card.key, { description: event.target.value })} placeholder="ছোট বিবরণ" className="mt-3 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-sky-400" />
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                          <ExternalLink size={14} className="text-slate-500" />
                          <input value={card.target_url} onChange={(event) => patchCard(card.key, { target_url: event.target.value })} placeholder="/course" className="h-7 flex-1 bg-transparent text-sm text-slate-100 outline-none" />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      <PublicPreviewDialog
        open={previewOpen}
        title={title}
        description={description}
        promoVideoUrl={promoVideoUrl}
        thumbnailPreview={thumbnailPreview}
        cards={cards}
        onClose={() => setPreviewOpen(false)}
      />
    </section>
  );
}

function PublicPreviewDialog({
  open,
  title,
  description,
  promoVideoUrl,
  thumbnailPreview,
  cards,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  promoVideoUrl: string;
  thumbnailPreview: string;
  cards: CardForm[];
  onClose: () => void;
}) {
  if (!open) return null;
  const visibleCards = cards.filter((card) => card.title.trim()).slice(0, 4);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/82 p-4 backdrop-blur-sm">
      <button type="button" aria-label="প্রিভিউ বন্ধ করুন" onClick={onClose} className="absolute inset-0 cursor-default" />
      <div className="relative flex max-h-[92vh] w-full max-w-[1040px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-[0_28px_90px_rgba(0,0,0,0.48)]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[2px] text-sky-300">পাবলিক প্রিভিউ</p>
            <h3 className="mt-1 truncate text-base font-black text-white">কেন ভাইয়াদের পাঠশালা</h3>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-700 text-slate-300 hover:bg-white/5" aria-label="বন্ধ করুন">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto mb-6 max-w-[720px] text-center">
            <h2 className="text-[clamp(28px,4vw,44px)] font-black leading-tight text-white">{title || "কেন ভাইয়াদের পাঠশালা"}</h2>
            <p className="mx-auto mt-3 max-w-[640px] text-sm leading-6 text-slate-400 sm:text-base">{description || "সংক্ষিপ্ত লেখা"}</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.42fr)_minmax(320px,0.9fr)]">
            <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 sm:min-h-[360px] lg:min-h-[430px]">
              {thumbnailPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbnailPreview} alt="ভিডিও থাম্বনেইল" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="grid h-full min-h-[260px] place-items-center text-slate-600 sm:min-h-[360px] lg:min-h-[430px]">
                  <ImagePlus size={34} />
                </div>
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <span className="absolute inset-0 m-auto grid size-16 place-items-center rounded-full bg-white text-slate-950 shadow-[0_18px_46px_rgba(0,0,0,0.28)]">
                <PlayCircle size={32} />
              </span>
              {promoVideoUrl.trim() ? (
                <a href={promoVideoUrl.trim()} target="_blank" rel="noreferrer" className="absolute bottom-4 right-4 inline-flex h-10 items-center gap-2 rounded-full bg-white/90 px-4 text-xs font-black text-slate-950 no-underline shadow-lg">
                  <ExternalLink size={14} />
                  ভিডিও খুলুন
                </a>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {visibleCards.length ? visibleCards.map((card, index) => {
                const Icon = iconMap[card.icon] ?? iconMap[defaultCards[index % defaultCards.length]?.icon || "book"] ?? BookOpen;
                return (
                  <article key={card.key} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
                    <span className="grid size-10 place-items-center rounded-xl bg-sky-400/10 text-sky-300">
                      <Icon size={20} />
                    </span>
                    <h4 className="mt-3 text-sm font-black leading-5 text-white sm:text-base">{card.title}</h4>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{card.description}</p>
                  </article>
                );
              }) : (
                <div className="col-span-2 rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">প্রিভিউ দেখাতে অন্তত একটি কার্ডের নাম লিখুন।</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

