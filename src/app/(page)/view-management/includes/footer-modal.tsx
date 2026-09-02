"use client";

import { useState } from "react";
import { Link2, Plus, PanelBottom, Trash2 } from "lucide-react";
import { extractErrorMessage } from "@/lib/api-error";
import {
  useGetFooterContentQuery,
  useSaveFooterContentMutation,
} from "@/redux/api/contentApi";
import ModalShell, { Field, areaClass, fieldClass } from "./modal-shell";

/** Social platforms the footer renders. Keys match what the student site reads. */
const SOCIAL_KEYS: { key: string; label: string; placeholder: string }[] = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@..." },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/..." },
];

type LinkRow = { label: string; url: string };

export default function FooterModal({ onClose }: { onClose: () => void }) {
  const { data, isLoading } = useGetFooterContentQuery();
  const [saveFooter, { isLoading: isSaving }] = useSaveFooterContentMutation();

  const footer = Array.isArray(data) ? data[0] : data?.results?.[0];
  const [draft, setDraft] = useState<{
    name: string;
    short_description: string;
    whatsapp_number: string;
    social_links: Record<string, string>;
    important_links: LinkRow[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Seed the form from the server value the first time it arrives, then let
  // local edits own it.
  const value = draft ?? {
    name: footer?.name ?? "",
    short_description: footer?.short_description ?? "",
    whatsapp_number: footer?.whatsapp_number ?? "",
    social_links: footer?.social_links ?? {},
    important_links: footer?.important_links ?? [],
  };

  const set = <K extends keyof typeof value>(key: K, next: (typeof value)[K]) =>
    setDraft({ ...value, [key]: next });

  const save = async () => {
    setError(null);
    setSuccess(null);
    try {
      await saveFooter({
        id: footer?.id,
        data: {
          ...value,
          // Drop empty rows rather than storing blank links the site would render.
          important_links: value.important_links.filter(
            (row) => row.label.trim() && row.url.trim(),
          ),
          social_links: Object.fromEntries(
            Object.entries(value.social_links).filter(([, url]) => url.trim()),
          ),
        },
      }).unwrap();
      setSuccess("ফুটার সেভ হয়ে গেছে।");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <ModalShell
      error={error}
      footerNote="সাইটের সব পেজের নিচে দেখা যাবে"
      icon={<PanelBottom size={17} />}
      isSaving={isSaving}
      onClose={onClose}
      onSave={save}
      size="lg"
      subtitle="লোগো টেক্সট, সোশ্যাল লিংক ও গুরুত্বপূর্ণ লিংক"
      success={success}
      title="ফুটার"
    >
      {isLoading ? (
        <p className="py-10 text-center text-sm text-slate-400">লোড হচ্ছে…</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="নাম">
              <input
                className={fieldClass}
                onChange={(e) => set("name", e.target.value)}
                placeholder="ভাইয়াদের পাঠশালা"
                value={value.name}
              />
            </Field>
            <Field label="WhatsApp নম্বর" hint="সাপোর্ট বাটনে এই নম্বরটি ব্যবহার হবে">
              <input
                className={fieldClass}
                onChange={(e) => set("whatsapp_number", e.target.value)}
                placeholder="+8801XXXXXXXXX"
                value={value.whatsapp_number}
              />
            </Field>
          </div>

          <Field label="সংক্ষিপ্ত বিবরণ">
            <textarea
              className={areaClass}
              onChange={(e) => set("short_description", e.target.value)}
              placeholder="ফুটারে লোগোর নিচে ছোট একটা লাইন"
              rows={3}
              value={value.short_description}
            />
          </Field>

          <div>
            <span className="mb-2 block text-xs font-bold text-slate-400">সোশ্যাল লিংক</span>
            <div className="grid gap-3 sm:grid-cols-2">
              {SOCIAL_KEYS.map((social) => (
                <label key={social.key} className="block">
                  <span className="mb-1.5 block text-[11px] font-bold text-slate-500">
                    {social.label}
                  </span>
                  <input
                    className={fieldClass}
                    onChange={(e) =>
                      set("social_links", { ...value.social_links, [social.key]: e.target.value })
                    }
                    placeholder={social.placeholder}
                    value={value.social_links[social.key] ?? ""}
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">গুরুত্বপূর্ণ লিংক</span>
              <button
                className="flex items-center gap-1 rounded-lg border border-sky-400/30 bg-sky-400/10 px-2.5 py-1.5 text-[11px] font-bold text-sky-200 hover:bg-sky-400/20"
                onClick={() =>
                  set("important_links", [...value.important_links, { label: "", url: "" }])
                }
                type="button"
              >
                <Plus size={12} />
                লিংক যোগ করুন
              </button>
            </div>

            {value.important_links.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-700 px-3.5 py-4 text-center text-[11px] text-slate-500">
                এখনো কোনো লিংক নেই।
              </p>
            ) : (
              <div className="space-y-2">
                {value.important_links.map((row, index) => (
                  <div className="flex items-center gap-2" key={index}>
                    <input
                      className={`${fieldClass} flex-1`}
                      onChange={(e) => {
                        const next = [...value.important_links];
                        next[index] = { ...row, label: e.target.value };
                        set("important_links", next);
                      }}
                      placeholder="নাম (যেমন: প্রাইভেসি পলিসি)"
                      value={row.label}
                    />
                    <div className="relative flex-1">
                      <Link2
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                        size={14}
                      />
                      <input
                        className={`${fieldClass} pl-9`}
                        onChange={(e) => {
                          const next = [...value.important_links];
                          next[index] = { ...row, url: e.target.value };
                          set("important_links", next);
                        }}
                        placeholder="/privacy"
                        value={row.url}
                      />
                    </div>
                    <button
                      aria-label="লিংক মুছুন"
                      className="grid size-9 shrink-0 place-items-center rounded-lg border border-red-600/40 bg-red-600/10 text-red-400 hover:bg-red-600/20"
                      onClick={() =>
                        set(
                          "important_links",
                          value.important_links.filter((_, i) => i !== index),
                        )
                      }
                      type="button"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </ModalShell>
  );
}
