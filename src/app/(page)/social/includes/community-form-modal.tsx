"use client";

import { useState } from "react";
import { AlertTriangle, ImagePlus, Save, X } from "lucide-react";
import {
  useCreateCommunityLinkMutation,
  useUpdateCommunityLinkMutation,
  type CommunityLink,
  type CommunityPlatform,
} from "@/redux/api/communityLinksApi";
import { extractErrorMessage } from "@/lib/api-error";
import { PLATFORM_OPTIONS, resolveMediaUrl } from "./platform-meta";

const fieldClass =
  "w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40";

/** Create / edit a social/community link. `link` null → create mode. */
export default function CommunityFormModal({
  link,
  onClose,
  onSaved,
}: {
  link: CommunityLink | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(link?.title ?? "");
  const [platform, setPlatform] = useState<CommunityPlatform>(link?.platform ?? "facebook");
  const [url, setUrl] = useState(link?.url ?? "");
  const [memberCount, setMemberCount] = useState(String(link?.member_count ?? 0));
  const [isActive, setIsActive] = useState(link?.is_active ?? true);
  const [banner, setBanner] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createLink, { isLoading: creating }] = useCreateCommunityLinkMutation();
  const [updateLink, { isLoading: updating }] = useUpdateCommunityLinkMutation();
  const isBusy = creating || updating;

  const previewUrl = banner ? URL.createObjectURL(banner) : resolveMediaUrl(link?.banner ?? null);

  const save = async () => {
    if (!title.trim() || !url.trim()) {
      setError("টাইটেল ও URL দিন।");
      return;
    }
    setError(null);
    try {
      const members = Number(memberCount) || 0;
      if (banner) {
        const fd = new FormData();
        fd.append("title", title.trim());
        fd.append("platform", platform);
        fd.append("url", url.trim());
        fd.append("member_count", String(members));
        fd.append("is_active", String(isActive));
        fd.append("banner", banner);
        if (link) await updateLink({ id: link.id, data: fd }).unwrap();
        else await createLink(fd).unwrap();
      } else {
        const payload = { title: title.trim(), platform, url: url.trim(), member_count: members, is_active: isActive };
        if (link) await updateLink({ id: link.id, data: payload }).unwrap();
        else await createLink(payload).unwrap();
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="text-lg font-bold text-blue-50">{link ? "সোশ্যাল লিংক সম্পাদনা" : "নতুন সোশ্যাল লিংক"}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10">
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
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">
              ব্যানার / লোগো (ঐচ্ছিক) — প্রস্তাবিত সাইজ <span className="text-cyan-300">২৫৬×২৫৬ পিক্সেল (স্কয়ার ১:১)</span>
            </label>
            <label className="group relative mx-auto flex aspect-square h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-700 bg-gray-800/50 hover:border-cyan-500/50">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="ব্যানার" className="absolute inset-0 h-full w-full object-cover" />
              ) : null}
              <div className={`relative z-10 flex flex-col items-center gap-1.5 rounded-xl px-4 py-2 ${previewUrl ? "bg-black/50 text-white" : "text-slate-400"}`}>
                <ImagePlus size={22} />
                <span className="text-xs font-bold">{previewUrl ? "ব্যানার পরিবর্তন করুন" : "ছোট ব্যানার আপলোড করুন"}</span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setBanner(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">টাইটেল *</label>
            <input className={fieldClass} placeholder="যেমন: ভাইয়াদের পাঠশালা অফিসিয়াল গ্রুপ" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-2 max-[520px]:grid-cols-1">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">প্ল্যাটফর্ম</label>
              <select className={fieldClass} value={platform} onChange={(e) => setPlatform(e.target.value as CommunityPlatform)}>
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">লিংক (URL) *</label>
              <input className={fieldClass} placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">সদস্য সংখ্যা</label>
            <input className={fieldClass} type="number" min={0} placeholder="যেমন: 500" value={memberCount} onChange={(e) => setMemberCount(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-gray-800/50 px-4 py-3 text-sm font-semibold text-slate-200">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            শিক্ষার্থীদের ড্যাশবোর্ডে দেখান
          </label>
        </div>

        <div className="flex justify-end gap-2.5 border-t border-slate-800 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5">
            বাতিল
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isBusy || !title.trim() || !url.trim()}
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
