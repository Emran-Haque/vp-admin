"use client";

import { useState } from "react";
import { Video, FileText, HelpCircle, type LucideIcon } from "lucide-react";
import type { ContentType } from "./types";

const config: Record<ContentType, { label: string; icon: LucideIcon; placeholder: string; hint: string }> = {
  video: {
    label: "ভিডিও পাঠ",
    icon: Video,
    placeholder: "যেমন: ভূমিকা ভিডিও",
    hint: "YouTube/Vimeo লিংক",
  },
  file: {
    label: "ফাইল/নোট",
    icon: FileText,
    placeholder: "যেমন: হ্যান্ডআউট",
    hint: "PDF, DOC, PPT সমর্থিত",
  },
  quiz: {
    label: "কুইজ",
    icon: HelpCircle,
    placeholder: "প্রশ্ন লিখুন",
    hint: "অপশন যোগ করুন",
  },
};

export default function AddItemForm({
  type,
  onAdd,
  onCancel,
}: {
  type: ContentType;
  onAdd: (title: string) => void;
  onCancel: () => void;
}) {
  const { label, icon: Icon, placeholder, hint } = config[type];
  const [title, setTitle] = useState("");
  const [secondary, setSecondary] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title.trim());
  };

  return (
    <div className="mt-3 rounded-2xl border border-slate-800 bg-gray-900/50 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-blue-50">
        <Icon size={16} className="text-blue-500" />
        {label} যোগ করুন
      </p>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        className="mt-3 w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-2.5 text-sm text-blue-50 placeholder:text-slate-400 focus:outline-none"
      />

      {type === "video" && (
        <input
          type="text"
          value={secondary}
          onChange={(e) => setSecondary(e.target.value)}
          placeholder={hint}
          className="mt-2 w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-2.5 text-sm text-blue-50 placeholder:text-slate-400 focus:outline-none"
        />
      )}

      {type === "file" && <p className="mt-2 text-xs text-slate-400">{hint}</p>}

      {type === "quiz" && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {options.map((opt, i) => (
            <input
              key={i}
              type="text"
              value={opt}
              onChange={(e) => {
                const next = [...options];
                next[i] = e.target.value;
                setOptions(next);
              }}
              placeholder={`অপশন ${i + 1}`}
              className="rounded-xl border border-slate-800 bg-gray-800 px-4 py-2.5 text-sm text-blue-50 placeholder:text-slate-400 focus:outline-none"
            />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
        >
          যোগ করুন
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-800 px-4 py-2 text-sm font-medium text-slate-400"
        >
          বাতিল
        </button>
      </div>
    </div>
  );
}
