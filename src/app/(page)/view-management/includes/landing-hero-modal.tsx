"use client";

import { useState } from "react";
import { Heading1 } from "lucide-react";
import { extractErrorMessage } from "@/lib/api-error";
import {
  type LandingHero,
  type LandingHeroKey,
  useGetLandingHeroesQuery,
  useSaveLandingHeroMutation,
} from "@/redux/api/contentApi";
import ModalShell, { Field, areaClass, fieldClass } from "./modal-shell";

/**
 * Which landing pages have an editable heading, and what the student site
 * currently ships for each.
 *
 * The fallback text is shown as the input placeholder so an admin can see what
 * the page says today without having to open it — leaving a field blank keeps
 * that built-in copy rather than blanking the page.
 */
export const LANDING_PAGES: {
  key: LandingHeroKey;
  label: string;
  path: string;
  fallback: { eyebrow?: string; title: string; description: string };
  hasActions?: boolean;
  hasAccent?: boolean;
}[] = [
  {
    key: "course",
    label: "কোর্স পেজ",
    path: "/course",
    hasActions: true,
    fallback: {
      eyebrow: "কোর্সসমূহ",
      title: "ভর্তি প্রস্তুতির সব কোর্স",
      description: "চট্টগ্রাম বিশ্ববিদ্যালয় ভর্তি প্রস্তুতির জন্য লাইভ ব্যাচ, ফ্রি ক্লাস…",
    },
  },
  {
    key: "exam_batch",
    label: "পরীক্ষা ব্যাচ পেজ",
    path: "/exam-batch",
    hasActions: true,
    fallback: {
      eyebrow: "পরীক্ষা ব্যাচ",
      title: "পরীক্ষা ব্যাচ",
      description: "MCQ পরীক্ষা, রুটিন, ফলাফল ও লাইভ পজিশন ট্র্যাকিংসহ আলাদা পরীক্ষা ব্যাচ।",
    },
  },
  {
    key: "book_store",
    label: "বুক স্টোর পেজ",
    path: "/book-store",
    fallback: {
      title: "সকল বই",
      description: "এইচএসসি, ভর্তি এবং প্রফেশনাল ব্যাচের জন্য সাজানো সকল কোর্স এক জায়গায়…",
    },
  },
  {
    key: "free_class",
    label: "ফ্রি ক্লাস পেজ",
    path: "/free-class",
    fallback: {
      title: "ফ্রি ক্লাস",
      description: "ভিডিও ক্লাস, ফ্রি MCQ পরীক্ষা, ইউনিট রিসোর্স এবং গুরুত্বপূর্ণ সাজেশন…",
    },
  },
  {
    key: "team",
    label: "মেন্টর / টিম পেজ",
    path: "/team",
    fallback: {
      eyebrow: "আমাদের টিম",
      title: "অভিজ্ঞ মেন্টর ও টিম",
      description: "ভর্তি প্রস্তুতিতে আপনাকে গাইডলাইন দেওয়ার জন্য কাজ করছেন আমাদের টিম।",
    },
  },
  {
    key: "success",
    label: "সাফল্য পেজ",
    path: "/success",
    hasAccent: true,
    fallback: {
      eyebrow: "সাফল্যের গল্প",
      title: "শিক্ষার্থীদের",
      description: "আমাদের শিক্ষার্থীদের বাস্তব অভিজ্ঞতা, সাফল্য এবং অনুপ্রেরণামূলক অর্জন।",
    },
  },
];

export default function LandingHeroModal({
  pageKey,
  onClose,
}: {
  pageKey: LandingHeroKey;
  onClose: () => void;
}) {
  const meta = LANDING_PAGES.find((page) => page.key === pageKey);
  const { data, isLoading } = useGetLandingHeroesQuery();
  const [saveHero, { isLoading: isSaving }] = useSaveLandingHeroMutation();

  const list: LandingHero[] = Array.isArray(data) ? data : (data?.results ?? []);
  const hero = list.find((item) => item.page_key === pageKey);

  const [draft, setDraft] = useState<Partial<LandingHero> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const value = {
    eyebrow: draft?.eyebrow ?? hero?.eyebrow ?? "",
    title: draft?.title ?? hero?.title ?? "",
    accent: draft?.accent ?? hero?.accent ?? "",
    description: draft?.description ?? hero?.description ?? "",
    primary_label: draft?.primary_label ?? hero?.primary_label ?? "",
    primary_href: draft?.primary_href ?? hero?.primary_href ?? "",
    secondary_label: draft?.secondary_label ?? hero?.secondary_label ?? "",
    secondary_href: draft?.secondary_href ?? hero?.secondary_href ?? "",
    is_active: draft?.is_active ?? hero?.is_active ?? true,
  };

  const set = <K extends keyof typeof value>(key: K, next: (typeof value)[K]) =>
    setDraft({ ...value, [key]: next });

  const save = async () => {
    setError(null);
    setSuccess(null);
    if (!value.title.trim()) {
      setError("শিরোনাম দিতে হবে।");
      return;
    }
    try {
      await saveHero({
        exists: Boolean(hero),
        data: { ...value, page_key: pageKey, title: value.title.trim() },
      }).unwrap();
      setSuccess("পেজ হেডিং সেভ হয়ে গেছে।");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <ModalShell
      error={error}
      footerNote={meta ? `শিক্ষার্থীরা দেখবে ${meta.path} পেজের উপরে` : undefined}
      icon={<Heading1 size={17} />}
      isSaving={isSaving}
      onClose={onClose}
      onSave={save}
      subtitle="পেজের উপরের শিরোনাম, বিবরণ ও বাটন"
      success={success}
      title={meta?.label ?? "পেজ হেডিং"}
    >
      {isLoading ? (
        <p className="py-10 text-center text-sm text-slate-400">লোড হচ্ছে…</p>
      ) : (
        <div className="space-y-4">
          {!hero ? (
            <p className="rounded-lg border border-sky-400/25 bg-sky-400/5 px-3.5 py-2.5 text-[11px] leading-5 text-sky-200">
              এই পেজে এখনো কাস্টম হেডিং সেট করা হয়নি — এখন সাইটে বিল্ট-ইন লেখাটাই দেখাচ্ছে
              (প্লেসহোল্ডারে দেখানো আছে)। সেভ করলে আপনার লেখাটা দেখা যাবে।
            </p>
          ) : null}

          <Field label="ছোট লেখা (eyebrow)" hint="শিরোনামের উপরে ছোট ট্যাগ। না চাইলে খালি রাখুন।">
            <input
              className={fieldClass}
              onChange={(e) => set("eyebrow", e.target.value)}
              placeholder={meta?.fallback.eyebrow ?? "—"}
              value={value.eyebrow}
            />
          </Field>

          <div className={meta?.hasAccent ? "grid gap-4 sm:grid-cols-2" : ""}>
            <Field label="শিরোনাম">
              <input
                className={fieldClass}
                onChange={(e) => set("title", e.target.value)}
                placeholder={meta?.fallback.title}
                value={value.title}
              />
            </Field>
            {meta?.hasAccent ? (
              <Field label="শিরোনামের রঙিন অংশ" hint="শিরোনামের দ্বিতীয় অংশ, আলাদা রঙে দেখাবে">
                <input
                  className={fieldClass}
                  onChange={(e) => set("accent", e.target.value)}
                  placeholder="সফলতার গল্প"
                  value={value.accent}
                />
              </Field>
            ) : null}
          </div>

          <Field label="বিবরণ">
            <textarea
              className={areaClass}
              onChange={(e) => set("description", e.target.value)}
              placeholder={meta?.fallback.description}
              rows={4}
              value={value.description}
            />
          </Field>

          {meta?.hasActions ? (
            <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3.5">
              <p className="text-[11px] font-bold text-slate-400">বাটন (ঐচ্ছিক)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="প্রথম বাটনের লেখা">
                  <input
                    className={fieldClass}
                    onChange={(e) => set("primary_label", e.target.value)}
                    placeholder="সব কোর্স দেখুন"
                    value={value.primary_label}
                  />
                </Field>
                <Field label="প্রথম বাটনের লিংক">
                  <input
                    className={fieldClass}
                    onChange={(e) => set("primary_href", e.target.value)}
                    placeholder="#all-courses"
                    value={value.primary_href}
                  />
                </Field>
                <Field label="দ্বিতীয় বাটনের লেখা">
                  <input
                    className={fieldClass}
                    onChange={(e) => set("secondary_label", e.target.value)}
                    placeholder="ফ্রি ক্লাস"
                    value={value.secondary_label}
                  />
                </Field>
                <Field label="দ্বিতীয় বাটনের লিংক">
                  <input
                    className={fieldClass}
                    onChange={(e) => set("secondary_href", e.target.value)}
                    placeholder="/free-class"
                    value={value.secondary_href}
                  />
                </Field>
              </div>
            </div>
          ) : null}

          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-950/40 px-3.5 py-3">
            <input
              checked={value.is_active}
              className="size-4 accent-sky-500"
              onChange={(e) => set("is_active", e.target.checked)}
              type="checkbox"
            />
            <span className="text-xs font-bold text-slate-300">
              এই হেডিং ব্যবহার করুন
              <span className="ml-1.5 font-normal text-slate-500">
                (বন্ধ করলে সাইটের বিল্ট-ইন লেখাটা দেখাবে)
              </span>
            </span>
          </label>
        </div>
      )}
    </ModalShell>
  );
}
