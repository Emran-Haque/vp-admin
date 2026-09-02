"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import RichTextEditor from "@/components/rich-text-editor";
import { extractErrorMessage } from "@/lib/api-error";
import {
  type StaticPageKey,
  useGetStaticPageQuery,
  useUpdateStaticPageMutation,
} from "@/redux/api/contentApi";
import ModalShell, { Field, fieldClass } from "./modal-shell";

export const STATIC_PAGES: { key: StaticPageKey; label: string; path: string }[] = [
  { key: "privacy_policy", label: "প্রাইভেসি পলিসি", path: "/privacy" },
  { key: "refund_policy", label: "রিফান্ড পলিসি", path: "/refund" },
  { key: "terms_of_use", label: "টার্মস অব ইউজ", path: "/terms" },
  { key: "about", label: "অ্যাবাউট পেজ", path: "/about" },
  { key: "contact", label: "কন্টাক্ট পেজ", path: "/contact" },
];

export default function StaticPageModal({
  pageKey,
  onClose,
}: {
  pageKey: StaticPageKey;
  onClose: () => void;
}) {
  const meta = STATIC_PAGES.find((page) => page.key === pageKey);
  const { data, isLoading } = useGetStaticPageQuery(pageKey);
  const [updatePage, { isLoading: isSaving }] = useUpdateStaticPageMutation();

  const [draft, setDraft] = useState<{
    title: string;
    content: string;
    meta_title: string;
    meta_description: string;
    is_published: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const value = draft ?? {
    title: data?.title ?? "",
    content: data?.content ?? "",
    meta_title: data?.meta_title ?? "",
    meta_description: data?.meta_description ?? "",
    is_published: data?.is_published ?? true,
  };

  const set = <K extends keyof typeof value>(key: K, next: (typeof value)[K]) =>
    setDraft({ ...value, [key]: next });

  const save = async () => {
    setError(null);
    setSuccess(null);
    try {
      await updatePage({ pageKey, data: value }).unwrap();
      setSuccess("পেজ সেভ হয়ে গেছে।");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <ModalShell
      error={error}
      footerNote={meta ? `শিক্ষার্থীরা দেখবে ${meta.path} ঠিকানায়` : undefined}
      icon={<FileText size={17} />}
      isSaving={isSaving}
      onClose={onClose}
      onSave={save}
      size="lg"
      subtitle="টাইটেল, কনটেন্ট ও SEO তথ্য"
      success={success}
      title={meta?.label ?? "পেজ"}
    >
      {isLoading ? (
        <p className="py-10 text-center text-sm text-slate-400">লোড হচ্ছে…</p>
      ) : (
        <div className="space-y-4">
          <Field label="পেজের টাইটেল">
            <input
              className={fieldClass}
              onChange={(e) => set("title", e.target.value)}
              placeholder={meta?.label}
              value={value.title}
            />
          </Field>

          <div>
            <span className="mb-1.5 block text-xs font-bold text-slate-400">কনটেন্ট</span>
            <RichTextEditor
              minHeight={260}
              onChange={(next) => set("content", next)}
              placeholder="পেজের বিস্তারিত লিখুন"
              value={value.content}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SEO টাইটেল" hint="খালি রাখলে পেজের টাইটেলই ব্যবহার হবে">
              <input
                className={fieldClass}
                onChange={(e) => set("meta_title", e.target.value)}
                value={value.meta_title}
              />
            </Field>
            <Field label="SEO ডিসক্রিপশন" hint="সার্চ রেজাল্টে দেখা যাবে">
              <input
                className={fieldClass}
                onChange={(e) => set("meta_description", e.target.value)}
                value={value.meta_description}
              />
            </Field>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-950/40 px-3.5 py-3">
            <input
              checked={value.is_published}
              className="size-4 accent-sky-500"
              onChange={(e) => set("is_published", e.target.checked)}
              type="checkbox"
            />
            <span className="text-xs font-bold text-slate-300">
              পেজটি পাবলিশড
              <span className="ml-1.5 font-normal text-slate-500">
                (বন্ধ করলে শিক্ষার্থীরা পেজটি দেখতে পাবে না)
              </span>
            </span>
          </label>
        </div>
      )}
    </ModalShell>
  );
}
