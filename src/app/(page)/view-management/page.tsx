"use client";

import { useState } from "react";
import { ChevronRight, ExternalLink, PanelsTopLeft, Settings2 } from "lucide-react";
import type { LandingHeroKey, StaticPageKey } from "@/redux/api/contentApi";
import AboutModal from "./includes/about-modal";
import BannerModal from "./includes/banner-modal";
import FooterModal from "./includes/footer-modal";
import LandingHeroModal from "./includes/landing-hero-modal";
import StaticPageModal from "./includes/static-page-modal";
import SuccessStoriesModal from "./includes/success-stories-modal";
import WhyPlatformModal from "./includes/why-platform-modal";
import { VIEW_SECTIONS, type ViewTarget } from "./includes/sections";

const studentSiteUrl =
  process.env.NEXT_PUBLIC_STUDENT_SITE_URL ?? "https://vaiyaderpathshala.com";

/**
 * Everything a visitor sees on the public site, in one place.
 *
 * Laid out as a section rail plus a grid of cards because the alternative —
 * every manager expanded on one page — put unrelated editors side by side and
 * left no room to add the rest. Each card opens the same modal chrome, so the
 * interaction is learned once and applies to all of them.
 */
export default function ViewManagementPage() {
  const [sectionId, setSectionId] = useState(VIEW_SECTIONS[0].id);
  const [target, setTarget] = useState<ViewTarget | null>(null);

  const section = VIEW_SECTIONS.find((item) => item.id === sectionId) ?? VIEW_SECTIONS[0];

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-sky-400/20 bg-sky-400/10 text-sky-300">
            <PanelsTopLeft size={19} />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-50 sm:text-2xl">ভিউ ম্যানেজমেন্ট</h1>
            <p className="mt-1 text-sm text-slate-400">
              লগইন ছাড়া যে পেজগুলো সবাই দেখতে পায়, সেগুলোর কনটেন্ট এখান থেকে ঠিক করুন।
            </p>
          </div>
        </div>

        <a
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 text-sm font-bold text-slate-200 hover:border-sky-400/40 hover:text-white"
          href={studentSiteUrl}
          rel="noreferrer"
          target="_blank"
        >
          ওয়েবসাইট দেখুন
          <ExternalLink size={15} />
        </a>
      </header>

      <div className="grid gap-5 lg:grid-cols-[228px_minmax(0,1fr)]">
        {/* Section rail — horizontal chips on mobile, a list on desktop. */}
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-4 lg:h-fit lg:flex-col lg:overflow-visible lg:pb-0">
          {VIEW_SECTIONS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === section.id;
            return (
              <button
                className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-bold transition lg:w-full ${
                  isActive
                    ? "border-sky-400/40 bg-sky-400/10 text-sky-100"
                    : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
                key={item.id}
                onClick={() => setSectionId(item.id)}
                type="button"
              >
                <Icon className="shrink-0" size={16} />
                <span className="truncate">{item.label}</span>
                <span
                  className={`ml-auto hidden shrink-0 rounded-full px-1.5 text-[10px] font-black lg:inline ${
                    isActive ? "bg-sky-400/20 text-sky-200" : "bg-white/5 text-slate-500"
                  }`}
                >
                  {item.items.length}
                </span>
              </button>
            );
          })}
        </nav>

        <section>
          <div className="mb-3.5">
            <h2 className="text-base font-black text-slate-100">{section.label}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{section.blurb}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  className="group flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-left transition hover:border-sky-400/40 hover:bg-slate-900"
                  key={item.id}
                  onClick={() => setTarget(item.target)}
                  type="button"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-700 bg-slate-950/60 text-slate-400 transition group-hover:border-sky-400/30 group-hover:text-sky-300">
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-bold text-slate-100">
                        {item.label}
                      </span>
                      <ChevronRight
                        className="shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-sky-300"
                        size={14}
                      />
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-5 text-slate-500">
                      {item.description}
                    </span>
                    {item.path ? (
                      <span className="mt-1.5 inline-block rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                        {item.path}
                      </span>
                    ) : null}
                  </span>
                  <Settings2
                    className="shrink-0 text-slate-700 transition group-hover:text-sky-400"
                    size={15}
                  />
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {target?.kind === "banner" ? <BannerModal onClose={() => setTarget(null)} /> : null}
      {target?.kind === "whyPlatform" ? (
        <WhyPlatformModal onClose={() => setTarget(null)} />
      ) : null}
      {target?.kind === "about" ? <AboutModal onClose={() => setTarget(null)} /> : null}
      {target?.kind === "successStories" ? (
        <SuccessStoriesModal onClose={() => setTarget(null)} />
      ) : null}
      {target?.kind === "footer" ? <FooterModal onClose={() => setTarget(null)} /> : null}
      {target?.kind === "landingHero" ? (
        <LandingHeroModal
          onClose={() => setTarget(null)}
          pageKey={target.pageKey as LandingHeroKey}
        />
      ) : null}
      {target?.kind === "staticPage" ? (
        <StaticPageModal
          onClose={() => setTarget(null)}
          pageKey={target.pageKey as StaticPageKey}
        />
      ) : null}
    </div>
  );
}
