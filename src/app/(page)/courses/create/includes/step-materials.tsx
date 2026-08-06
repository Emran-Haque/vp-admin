"use client";

import { FileText, Video, HelpCircle, type LucideIcon } from "lucide-react";
import MaterialItemCard from "./material-item-card";
import type { MaterialDraft, MaterialKind, QuizQuestion } from "./types";

type Props = {
  materials: MaterialDraft[];
  courseId?: number;
  onChange: (materials: MaterialDraft[]) => void;
};

const addButtons: { kind: MaterialKind; label: string; icon: LucideIcon }[] = [
  { kind: "pdf", label: "পিডিএফ যোগ করুন", icon: FileText },
  { kind: "video", label: "ভিডিও যোগ করুন", icon: Video },
  { kind: "mcq", label: "কুইজ যোগ করুন", icon: HelpCircle },
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
  const addMaterial = (kind: MaterialKind) => {
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

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold leading-8 text-blue-50">কোর্স ম্যাটেরিয়াল সাজান</h2>
          <p className="mt-1 text-sm text-slate-400">{materials.length} টি ম্যাটেরিয়াল • সব বিনামূল্যে ও উন্মুক্ত</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {addButtons.map(({ kind, label, icon: Icon }) => (
            <button
              key={kind}
              type="button"
              onClick={() => addMaterial(kind)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {materials.map((item) => (
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

        {materials.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
            এখনো কোনো ম্যাটেরিয়াল যোগ হয়নি। উপরের বাটন থেকে পিডিএফ, ভিডিও বা কুইজ যোগ করুন।
          </p>
        )}
      </div>
    </section>
  );
}
