"use client";

import { useState } from "react";
import { ExternalLink, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import ErrorState from "@/components/error-state";
import { PageLoader } from "@/components/loaders";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useGetCommunityLinksQuery,
  useDeleteCommunityLinkMutation,
  type CommunityLink,
} from "@/redux/api/communityLinksApi";
import CommunityFormModal from "./includes/community-form-modal";
import { PLATFORM_META, resolveMediaUrl } from "./includes/platform-meta";

type ModalState = null | "new" | CommunityLink;

export default function Page() {
  const { hasPermission } = usePermissions();
  const { data, isLoading, isError, error } = useGetCommunityLinksQuery();
  const [deleteLink] = useDeleteCommunityLinkMutation();
  const [modal, setModal] = useState<ModalState>(null);

  const canManage = hasPermission("can_manage_home_content");

  if (isLoading) return <PageLoader label="সোশ্যাল লিংক লোড হচ্ছে..." />;
  if (isError) return <ErrorState message="সোশ্যাল লিংক আনতে সমস্যা হচ্ছে।" error={error} />;

  const links = data?.results ?? [];

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-cyan-500/15 text-cyan-300">
              <Share2 size={28} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-blue-50">সোশ্যাল ও কমিউনিটি লিংক</h1>
              <p className="mt-1 text-sm text-slate-400">
                Facebook, YouTube, Telegram সহ সব সোশ্যাল গ্রুপ/পেজ যোগ করুন — শিক্ষার্থীরা ড্যাশবোর্ড থেকে সরাসরি যেতে পারবে।
              </p>
            </div>
          </div>
          {canManage ? (
            <button
              type="button"
              onClick={() => setModal("new")}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-500"
            >
              <Plus size={16} /> নতুন লিংক
            </button>
          ) : null}
        </div>
      </section>

      {links.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 p-10 text-center text-sm text-slate-400">
          এখনো কোনো সোশ্যাল লিংক যোগ করা হয়নি। উপরের &quot;নতুন লিংক&quot; থেকে শুরু করুন।
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {links.map((link) => {
            const meta = PLATFORM_META[link.platform] ?? PLATFORM_META.other;
            const banner = resolveMediaUrl(link.banner);
            return (
              <article key={link.id} className="flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
                <div className="relative h-28 overflow-hidden" style={{ background: `linear-gradient(135deg, ${meta.color}44, #0f172a)` }}>
                  {banner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={banner} alt={link.title} className="absolute inset-0 h-full w-full object-cover" />
                  ) : null}
                  <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-black text-white" style={{ backgroundColor: meta.color }}>
                    {meta.label}
                  </span>
                  {!link.is_active ? (
                    <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-bold text-amber-300 backdrop-blur">
                      লুকানো
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="line-clamp-2 text-[15px] font-black text-blue-50">{link.title}</h2>
                  <p className="mt-1 text-xs font-bold text-emerald-300">
                    {link.member_count.toLocaleString("bn-BD")} সদস্য
                  </p>
                  <a href={link.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 truncate text-xs text-cyan-300 no-underline hover:underline">
                    <ExternalLink size={12} className="shrink-0" /> <span className="truncate">{link.url}</span>
                  </a>
                  {canManage ? (
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setModal(link)}
                        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 text-xs font-bold text-blue-50 hover:bg-white/5"
                      >
                        <Pencil size={14} /> এডিট
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`"${link.title}" মুছে ফেলতে চান?`)) deleteLink(link.id);
                        }}
                        className="grid size-9 place-items-center rounded-lg border border-red-600/40 bg-red-600/10 text-red-500 hover:bg-red-600/20"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {modal !== null ? (
        <CommunityFormModal
          link={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}
