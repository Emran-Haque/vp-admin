"use client";

import { Check, FileText, HelpCircle, Plus, Trash2, Upload, Video, type LucideIcon } from "lucide-react";
import type { ContentType, ModuleItem, QuizQuestion } from "./types";

const badgeConfig: Record<ContentType, { label: string; icon: LucideIcon; className: string }> = {
  file: { label: "ফাইল", icon: FileText, className: "bg-amber-500/20 text-amber-500" },
  video: { label: "ভিডিও", icon: Video, className: "bg-white text-blue-500" },
  quiz: { label: "কুইজ", icon: HelpCircle, className: "bg-red-600/20 text-red-500" },
};

type Props = {
  item: ModuleItem;
  onUpdate: (patch: Partial<ModuleItem>) => void;
  onRemove: () => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (questionId: string, patch: Partial<QuizQuestion>) => void;
};

export default function ModuleItemCard({ item, onUpdate, onRemove, onAddQuestion, onUpdateQuestion }: Props) {
  const badge = badgeConfig[item.type];

  return (
    <div className="rounded-2xl border border-slate-800 bg-gray-900/40 p-3.5">
      <div className="flex items-center gap-2">
        <span className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2 py-1 text-sm font-semibold ${badge.className}`}>
          <badge.icon size={16} />
          {badge.label}
        </span>
        <input
          type="text"
          value={item.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="flex-1 rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 focus:outline-none"
        />
        <button
          type="button"
          onClick={onRemove}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-red-600/40 bg-red-600/10 text-red-600"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {item.type === "file" && (
        <label className="mt-3.5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-800 p-4 text-center">
          <Upload size={22} className="text-slate-400" />
          <span className="text-sm text-blue-50">{item.file?.name || "PDF / DOC / PPT আপলোড করুন"}</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            className="hidden"
            onChange={(e) => onUpdate({ file: e.target.files?.[0] ?? null })}
          />
        </label>
      )}

      {item.type === "video" && (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={item.videoUrl ?? ""}
            onChange={(e) => onUpdate({ videoUrl: e.target.value })}
            placeholder="YouTube / Vimeo লিংক"
            className="rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 placeholder:text-slate-400 focus:outline-none sm:flex-[2]"
          />
          <input
            type="text"
            value={item.videoDuration ?? ""}
            onChange={(e) => onUpdate({ videoDuration: e.target.value })}
            placeholder="সময় (যেমন: ৬২ মি.)"
            className="rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 placeholder:text-slate-400 focus:outline-none sm:flex-1"
          />
        </div>
      )}

      {item.type === "quiz" && (
        <div className="mt-2 flex flex-col gap-3">
          {(item.questions ?? []).map((q, qIndex) => (
            <div key={q.id} className="rounded-xl border border-slate-800 bg-gray-900/60 p-3">
              <input
                type="text"
                value={q.question}
                onChange={(e) => onUpdateQuestion(q.id, { question: e.target.value })}
                placeholder={`প্রশ্ন ${qIndex + 1}`}
                className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 placeholder:text-slate-400 focus:outline-none"
              />
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.options.map((opt, optIndex) => (
                  <div
                    key={optIndex}
                    className={`flex items-center gap-2 rounded-xl border px-2 py-1 ${
                      q.correctIndex === optIndex
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-slate-800 bg-gray-800"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onUpdateQuestion(q.id, { correctIndex: optIndex })}
                      aria-label="সঠিক উত্তর নির্বাচন করুন"
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                        q.correctIndex === optIndex ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-600"
                      }`}
                    >
                      {q.correctIndex === optIndex && <Check size={12} />}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...q.options];
                        next[optIndex] = e.target.value;
                        onUpdateQuestion(q.id, { options: next });
                      }}
                      placeholder={`অপশন ${optIndex + 1}`}
                      className="flex-1 bg-transparent py-2 text-sm text-blue-50 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={onAddQuestion}
            className="flex w-fit items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-blue-500"
          >
            <Plus size={14} />
            নতুন প্রশ্ন
          </button>
        </div>
      )}
    </div>
  );
}
