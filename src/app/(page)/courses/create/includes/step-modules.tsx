"use client";

import { useState } from "react";
import { Plus, Trash2, Video, FileText, HelpCircle, type LucideIcon } from "lucide-react";
import AddItemForm from "./add-item-form";
import type { ContentType, CourseModule } from "./types";

type Props = {
  modules: CourseModule[];
  onChange: (modules: CourseModule[]) => void;
};

const itemIcon: Record<ContentType, { icon: LucideIcon; className: string }> = {
  video: { icon: Video, className: "text-blue-500" },
  file: { icon: FileText, className: "text-violet-500" },
  quiz: { icon: HelpCircle, className: "text-emerald-500" },
};

const addButtons: { type: ContentType; label: string; icon: LucideIcon }[] = [
  { type: "video", label: "ভিডিও পাঠ যোগ করুন", icon: Video },
  { type: "file", label: "ফাইল/নোট যোগ করুন", icon: FileText },
  { type: "quiz", label: "কুইজ যোগ করুন", icon: HelpCircle },
];

export default function StepModules({ modules, onChange }: Props) {
  const [openForm, setOpenForm] = useState<Record<string, ContentType | null>>({});

  const addModule = () => {
    const id = crypto.randomUUID();
    onChange([...modules, { id, title: `অধিবেশন ${modules.length + 1}`, items: [] }]);
  };

  const removeModule = (id: string) => {
    onChange(modules.filter((m) => m.id !== id));
  };

  const renameModule = (id: string, title: string) => {
    onChange(modules.map((m) => (m.id === id ? { ...m, title } : m)));
  };

  const addItem = (moduleId: string, type: ContentType, title: string) => {
    onChange(
      modules.map((m) =>
        m.id === moduleId
          ? { ...m, items: [...m.items, { id: crypto.randomUUID(), type, title }] }
          : m
      )
    );
    setOpenForm((prev) => ({ ...prev, [moduleId]: null }));
  };

  const removeItem = (moduleId: string, itemId: string) => {
    onChange(
      modules.map((m) => (m.id === moduleId ? { ...m, items: m.items.filter((i) => i.id !== itemId) } : m))
    );
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold leading-8 text-blue-50">কোর্সের কন্টেন্ট সাজান</h2>
          <p className="mt-1 text-sm text-slate-400">{modules.length} মডিউল যোগ হয়েছে</p>
        </div>
        <button
          type="button"
          onClick={addModule}
          className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={16} />
          নতুন মডিউল
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {modules.map((module, index) => (
          <div key={module.id} className="rounded-2xl border border-slate-800 bg-gray-900/30 p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                {index + 1}
              </span>
              <input
                type="text"
                value={module.title}
                onChange={(e) => renameModule(module.id, e.target.value)}
                className="flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-base font-semibold text-blue-50 focus:border-slate-800 focus:bg-gray-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeModule(module.id)}
                className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-red-600/40 bg-red-600/10 text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {module.items.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {module.items.map((item) => {
                  const { icon: Icon, className } = itemIcon[item.type];
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 rounded-xl border border-slate-800 bg-gray-800 px-3 py-2"
                    >
                      <Icon size={16} className={className} />
                      <span className="flex-1 text-sm text-blue-50">{item.title}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(module.id, item.id)}
                        className="text-slate-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {addButtons.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOpenForm((prev) => ({ ...prev, [module.id]: type }))}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-3 py-2 text-sm text-blue-50"
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {openForm[module.id] && (
              <AddItemForm
                type={openForm[module.id] as ContentType}
                onAdd={(title) => addItem(module.id, openForm[module.id] as ContentType, title)}
                onCancel={() => setOpenForm((prev) => ({ ...prev, [module.id]: null }))}
              />
            )}
          </div>
        ))}

        {modules.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
            এখনো কোনো মডিউল যোগ হয়নি। &quot;নতুন মডিউল&quot; চেপে শুরু করুন।
          </p>
        )}
      </div>
    </section>
  );
}
