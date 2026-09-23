"use client";

import { useState } from "react";
import { Save, AlertTriangle, Loader2 } from "lucide-react";
import {
  useGetSmsTemplatesQuery,
  useUpdateSmsTemplateMutation,
  type SmsTemplate,
} from "@/redux/api/guardianSmsApi";

/**
 * Edit the Bangla that parents actually receive.
 *
 * The live preview matters more than it looks: a Bangla SMS part is 70
 * characters, so one extra word silently doubles the bill for every parent.
 * Showing the rendered sample and its credit count next to the editor makes
 * that visible while the wording is still being chosen.
 */

const PLACEHOLDERS = [
  { token: "{student_name}", label: "শিক্ষার্থীর নাম" },
  { token: "{exam_title}", label: "পরীক্ষার নাম" },
  { token: "{marks}", label: "প্রাপ্ত নম্বর" },
  { token: "{total_marks}", label: "মোট নম্বর" },
  { token: "{percentage}", label: "শতকরা" },
  { token: "{rank}", label: "মেধাক্রম" },
  { token: "{student_id}", label: "শিক্ষার্থী আইডি" },
  { token: "{exam_date}", label: "পরীক্ষার তারিখ" },
  { token: "{brand}", label: "প্রতিষ্ঠানের নাম" },
];

export default function TemplateEditor() {
  const { data, isLoading } = useGetSmsTemplatesQuery();
  const templates: SmsTemplate[] = Array.isArray(data) ? data : (data?.results ?? []);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-[16px] border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-bold text-slate-50">প্লেসহোল্ডার</h2>
        <p className="pt-1 text-xs text-slate-400">
          মেসেজে এগুলো লিখলে পাঠানোর সময় প্রতিটি শিক্ষার্থীর আসল তথ্য বসে যাবে।
        </p>
        <div className="flex flex-wrap gap-2 pt-3">
          {PLACEHOLDERS.map((item) => (
            <span
              key={item.token}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
            >
              <code className="text-blue-300">{item.token}</code> — {item.label}
            </span>
          ))}
        </div>
      </section>

      {isLoading && (
        <p className="text-center text-sm text-slate-400">টেমপ্লেট লোড হচ্ছে…</p>
      )}

      {templates.map((template) => (
        // `updated_at` is part of the key on purpose: when the server returns a
        // newer copy (this admin saved, or another one did) the card remounts
        // with fresh state. That is React's own answer to "reset state when a
        // prop changes" — an effect that setStates would cascade renders.
        <TemplateCard
          key={`${template.id}-${template.updated_at}`}
          template={template}
        />
      ))}
    </div>
  );
}

function TemplateCard({ template }: { template: SmsTemplate }) {
  const [body, setBody] = useState(template.body);
  const [isActive, setIsActive] = useState(template.is_active);
  const [error, setError] = useState("");
  const [updateTemplate, { isLoading: isSaving }] = useUpdateSmsTemplateMutation();

  const isDirty = body !== template.body || isActive !== template.is_active;

  const handleSave = async () => {
    setError("");
    try {
      // On success the refetched template carries a new `updated_at`, so this
      // card remounts with the saved values and the button returns to disabled.
      await updateTemplate({ id: template.id, body, is_active: isActive }).unwrap();
    } catch (saveError) {
      const detail = (saveError as { data?: { detail?: string } })?.data?.detail;
      setError(detail || "টেমপ্লেট সংরক্ষণ করা যায়নি।");
    }
  };

  return (
    <section className="rounded-[16px] border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-50">{template.key_display}</h3>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-400">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="size-4 cursor-pointer accent-blue-500"
          />
          চালু আছে
        </label>
      </div>

      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={3}
        className="mt-3 w-full resize-none rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
      />

      <div className="mt-3 rounded-[10px] border border-white/10 bg-black/20 p-3">
        <p className="text-xs font-semibold text-slate-400">নমুনা (অভিভাবক যা পাবেন)</p>
        <p className="pt-1.5 text-sm leading-6 text-slate-200">
          {template.sample_message}
        </p>
        <p className="pt-2 text-xs text-slate-500">
          এই মেসেজে খরচ হবে{" "}
          <span className="font-bold text-blue-300">
            {template.sample_segments}টি SMS
          </span>{" "}
          প্রতি অভিভাবকের জন্য।
          {isDirty && " (সেভ করলে নতুন হিসাব দেখা যাবে)"}
        </p>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          সংরক্ষণ করুন
        </button>
      </div>
    </section>
  );
}
