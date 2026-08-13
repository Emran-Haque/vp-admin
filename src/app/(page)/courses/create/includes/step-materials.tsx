"use client";

import { useState } from "react";
import { FileText, Video, HelpCircle, Plus, type LucideIcon } from "lucide-react";
import MaterialItemCard from "./material-item-card";
import type { MaterialDraft, MaterialKind, QuizQuestion } from "./types";

type Props = {
  materials: MaterialDraft[];
  courseId?: number;
  onChange: (materials: MaterialDraft[]) => void;
};

const bn = (n: number) => n.toLocaleString("bn-BD");

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
    hint: "ফ্রি প্রিভিউতে শিক্ষার্থীরা এই পিডিএফ নোটগুলো দেখতে পারবে।",
    emptyText: "এখনো কোনো পিডিএফ যোগ হয়নি। উপরের বাটন থেকে পিডিএফ যোগ করুন।",
  },
  {
    kind: "video",
    label: "ভিডিও",
    icon: Video,
    addLabel: "ভিডিও যোগ করুন",
    hint: "YouTube বা Facebook ভিডিও লিংক দিন — সুরক্ষিত প্লেয়ারে চলবে।",
    emptyText: "এখনো কোনো ভিডিও যোগ হয়নি। উপরের বাটন থেকে ভিডিও যোগ করুন।",
  },
  {
    kind: "mcq",
    label: "কুইজ",
    icon: HelpCircle,
    addLabel: "কুইজ যোগ করুন",
    hint: "নতুন প্রশ্ন লিখুন অথবা আগে তৈরি করা কুইজ নির্বাচন করুন।",
    emptyText: "এখনো কোনো কুইজ যোগ হয়নি। উপরের বাটন থেকে কুইজ যোগ করুন।",
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

  const addMaterial = (kind: MaterialKind) => {
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
  const visible = materials.filter((m) => m.kind === activeKind);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div>
        <h2 className="text-xl font-bold leading-8 text-blue-50">কোর্স ম্যাটেরিয়াল সাজান</h2>
        <p className="mt-1 text-sm text-slate-400">
          {bn(materials.length)} টি ম্যাটেরিয়াল • সব বিনামূল্যে ও উন্মুক্ত
        </p>
      </div>

      {/* Type tabs — group materials by PDF / video / quiz so each kind is edited on its own. */}
      <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-slate-800 bg-gray-900/40 p-1.5">
        {TABS.map((t) => {
          const count = materials.filter((m) => m.kind === t.kind).length;
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
              <span
                className={`flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                {bn(count)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active-tab toolbar: a short hint + the single "add" action for this kind. */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{activeTab.hint}</p>
        <button
          type="button"
          onClick={() => addMaterial(activeKind)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"
        >
          <Plus size={16} />
          {activeTab.addLabel}
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {visible.map((item, index) => (
          <MaterialItemCard
            key={item.id}
            item={item}
            position={index + 1}
            courseId={courseId}
            onUpdate={(patch) => updateMaterial(item.id, patch)}
            onRemove={() => removeMaterial(item.id)}
            onAddQuestion={() => addQuestion(item.id)}
            onUpdateQuestion={(questionId, patch) => updateQuestion(item.id, questionId, patch)}
          />
        ))}

        {visible.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-800 p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/5 text-slate-400">
              <activeTab.icon size={24} />
            </span>
            <p className="text-sm text-slate-400">{activeTab.emptyText}</p>
            <button
              type="button"
              onClick={() => addMaterial(activeKind)}
              className="flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
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
