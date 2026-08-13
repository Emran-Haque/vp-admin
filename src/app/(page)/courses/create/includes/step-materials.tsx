"use client";

import { useState } from "react";
import { FileText, Video, HelpCircle, Plus, CheckCircle2, type LucideIcon } from "lucide-react";
import MaterialItemCard from "./material-item-card";
import type { MaterialDraft, MaterialKind, QuizQuestion } from "./types";

type Props = {
  materials: MaterialDraft[];
  courseId?: number;
  onChange: (materials: MaterialDraft[]) => void;
};

const TABS: {
  kind: MaterialKind;
  label: string;
  icon: LucideIcon;
  addLabel: string;
  hint: string;
  emptyText: string;
}[] = [
  {
    kind: "pdf",
    label: "পিডিএফ",
    icon: FileText,
    addLabel: "পিডিএফ যোগ করুন",
    hint: "কোর্সের জন্য একটি ফ্রি পিডিএফ নোট — শিক্ষার্থীরা প্রিভিউতে দেখতে পারবে।",
    emptyText: "এখনো কোনো পিডিএফ যোগ হয়নি।",
  },
  {
    kind: "video",
    label: "ভিডিও",
    icon: Video,
    addLabel: "ভিডিও যোগ করুন",
    hint: "কোর্সের জন্য একটি ফ্রি ভিডিও — YouTube/Facebook লিংক, সুরক্ষিত প্লেয়ারে চলবে।",
    emptyText: "এখনো কোনো ভিডিও যোগ হয়নি।",
  },
  {
    kind: "mcq",
    label: "কুইজ",
    icon: HelpCircle,
    addLabel: "কুইজ যোগ করুন",
    hint: "কোর্সের জন্য একটি ফ্রি কুইজ — নতুন প্রশ্ন লিখুন বা তৈরি করা কুইজ নির্বাচন করুন।",
    emptyText: "এখনো কোনো কুইজ যোগ হয়নি।",
  },
];

const createQuestion = (): QuizQuestion => ({
  id: crypto.randomUUID(),
  question: "",
  options: ["", "", "", ""],
  correctIndex: null,
});

// The titles a freshly-added material starts with. Publishing a material still
// carrying one of these means it was never named, so we block the save.
export const DEFAULT_MATERIAL_TITLES = ["নতুন পিডিএফ", "নতুন ভিডিও", "নতুন কুইজ"];

const createMaterial = (kind: MaterialKind): MaterialDraft => {
  const id = crypto.randomUUID();
  if (kind === "pdf") return { id, kind, title: "নতুন পিডিএফ", file: null, driveLink: "" };
  if (kind === "video") return { id, kind, title: "নতুন ভিডিও", videoUrl: "" };
  return { id, kind, title: "নতুন কুইজ", questions: [createQuestion()] };
};

/** Returns an error message if any material has an empty or still-default title
 *  (so nothing publishes as "নতুন পিডিএফ" etc.), otherwise null. */
export function validateMaterialTitles(materials: MaterialDraft[]): string | null {
  for (const material of materials) {
    const title = material.title.trim();
    if (!title) {
      return "প্রতিটি ম্যাটেরিয়ালের একটি নাম দিন।";
    }
    if (DEFAULT_MATERIAL_TITLES.includes(title)) {
      return `ম্যাটেরিয়ালের ডিফল্ট নাম "${title}" পরিবর্তন করে আসল নাম দিন।`;
    }
  }
  return null;
}

export default function StepMaterials({ materials, courseId, onChange }: Props) {
  const [activeKind, setActiveKind] = useState<MaterialKind>("pdf");

  // One material per kind: only add when this kind has none yet.
  const addMaterial = (kind: MaterialKind) => {
    if (materials.some((m) => m.kind === kind)) return;
    setActiveKind(kind);
    onChange([...materials, createMaterial(kind)]);
  };

  const updateMaterial = (id: string, patch: Partial<MaterialDraft>) => {
    onChange(materials.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const removeMaterial = (id: string) => {
    onChange(materials.filter((m) => m.id !== id));
  };

  const addQuestion = (materialId: string) => {
    onChange(
      materials.map((m) =>
        m.id !== materialId || m.kind !== "mcq"
          ? m
          : { ...m, questions: [...(m.questions ?? []), createQuestion()] }
      )
    );
  };

  const updateQuestion = (materialId: string, questionId: string, patch: Partial<QuizQuestion>) => {
    onChange(
      materials.map((m) =>
        m.id !== materialId || m.kind !== "mcq"
          ? m
          : { ...m, questions: (m.questions ?? []).map((q) => (q.id === questionId ? { ...q, ...patch } : q)) }
      )
    );
  };

  const activeTab = TABS.find((t) => t.kind === activeKind)!;
  // Normally 0 or 1 item; older courses may carry more, so we render whatever exists.
  const items = materials.filter((m) => m.kind === activeKind);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div>
        <h2 className="text-xl font-bold leading-8 text-blue-50">কোর্স ম্যাটেরিয়াল সাজান</h2>
        <p className="mt-1 text-sm text-slate-400">
          প্রতিটি কোর্সে একটি পিডিএফ, একটি ভিডিও ও একটি কুইজ — সব বিনামূল্যে ও উন্মুক্ত।
        </p>
      </div>

      {/* One tab per kind. A green check marks the kinds that already have their item. */}
      <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-slate-800 bg-gray-900/40 p-1.5">
        {TABS.map((t) => {
          const filled = materials.some((m) => m.kind === t.kind);
          const isActive = t.kind === activeKind;
          return (
            <button
              key={t.kind}
              type="button"
              onClick={() => setActiveKind(t.kind)}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? "bg-blue-500 text-white shadow-sm" : "text-slate-400 hover:bg-white/5 hover:text-blue-50"
              }`}
            >
              <t.icon size={16} className="shrink-0" />
              <span>{t.label}</span>
              {filled ? (
                <CheckCircle2 size={16} className={`shrink-0 ${isActive ? "text-white" : "text-emerald-500"}`} />
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-sm text-slate-400">{activeTab.hint}</p>

      <div className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <MaterialItemCard
            key={item.id}
            item={item}
            courseId={courseId}
            onUpdate={(patch) => updateMaterial(item.id, patch)}
            onRemove={() => removeMaterial(item.id)}
            onAddQuestion={() => addQuestion(item.id)}
            onUpdateQuestion={(questionId, patch) => updateQuestion(item.id, questionId, patch)}
          />
        ))}

        {items.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-800 p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/5 text-slate-400">
              <activeTab.icon size={24} />
            </span>
            <p className="text-sm text-slate-400">{activeTab.emptyText}</p>
            <button
              type="button"
              onClick={() => addMaterial(activeKind)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"
            >
              <Plus size={16} />
              {activeTab.addLabel}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
