"use client";

import { ArrowDown, ArrowUp, ListChecks, Plus, Trash2 } from "lucide-react";
import type { IncludeDraft } from "@/lib/rich-text";

/**
 * Edits the "এই কোর্সে/বইয়ে/ব্যাচে যা থাকছে" list shown on the public detail
 * page. Deliberately plain text — these are short one-line bullets, so a
 * formatting toolbar on every row cost more space than it was worth.
 *
 * `variant` picks the chrome: "section" matches the course wizard's cards,
 * "panel" is the flatter block used inside the book and batch modals.
 */

/** Id of the placeholder row shown when nothing has been authored yet. */
const BLANK_ROW_ID = "__blank__";

export default function IncludesEditor({
  items,
  onItemsChange,
  title,
  onTitleChange,
  titlePlaceholder,
  label = "এই আইটেমে যা থাকছে",
  variant = "panel",
}: {
  items: IncludeDraft[];
  onItemsChange: (items: IncludeDraft[]) => void;
  title: string;
  onTitleChange: (value: string) => void;
  titlePlaceholder: string;
  label?: string;
  variant?: "section" | "panel";
}) {
  const newId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `row-${Date.now()}-${Math.random()}`;

  // With nothing authored yet, one empty row still shows so the fields are
  // visible on arrival. It keeps its id once typing starts, so the input is
  // never remounted mid-keystroke.
  const rows = items.length ? items : [{ id: BLANK_ROW_ID, text: "", icon: "" }];

  const add = () => onItemsChange([...items, { id: newId(), text: "", icon: "" }]);

  const remove = (id: string) => {
    if (!items.length) return;
    onItemsChange(items.filter((item) => item.id !== id));
  };

  const update = (id: string, patch: Partial<IncludeDraft>) => {
    if (!items.length) {
      onItemsChange([{ id: BLANK_ROW_ID, text: "", icon: "", ...patch }]);
      return;
    }
    onItemsChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onItemsChange(next);
  };

  const addButton = (
    <button
      className="flex shrink-0 items-center gap-1 rounded-lg bg-cyan-500/20 px-2.5 py-1.5 text-xs font-bold text-cyan-300 transition-colors hover:bg-cyan-500/30"
      onClick={add}
      type="button"
    >
      <Plus size={14} />
      যোগ করুন
    </button>
  );

  const body = (
    <div className="mt-4 rounded-2xl border border-slate-800 bg-gray-900/30 p-3.5">
      <div className="flex items-center gap-2.5">
        <label className="w-24 shrink-0 text-xs font-semibold text-slate-400" htmlFor="includes-title">
          শিরোনাম
        </label>
        <input
          className="w-full rounded-xl border border-slate-800 bg-gray-800 px-3.5 py-2 text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
          id="includes-title"
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={titlePlaceholder}
          value={title}
        />
      </div>

      <div className="mt-2.5 flex flex-col gap-1.5">
        {rows.map((item, index) => (
          <div
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-gray-800 px-2 py-1.5"
            key={item.id}
          >
            <input
              aria-label={`আইকন ${index + 1}`}
              className="w-9 shrink-0 rounded-lg border border-slate-700 bg-gray-900/60 py-1 text-center text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none"
              maxLength={2}
              onChange={(event) => update(item.id, { icon: event.target.value })}
              placeholder="✓"
              value={item.icon}
            />
            <input
              aria-label={`পয়েন্ট ${index + 1}`}
              className="w-full bg-transparent px-1 text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none"
              onChange={(event) => update(item.id, { text: event.target.value })}
              placeholder="যেমন: ব্যাচভিত্তিক MCQ পরীক্ষা"
              value={item.text}
            />
            <IconButton
              disabled={index === 0}
              label="উপরে"
              onClick={() => move(index, -1)}
            >
              <ArrowUp size={13} />
            </IconButton>
            <IconButton
              disabled={index === rows.length - 1}
              label="নিচে"
              onClick={() => move(index, 1)}
            >
              <ArrowDown size={13} />
            </IconButton>
            <IconButton danger label="মুছুন" onClick={() => remove(item.id)}>
              <Trash2 size={13} />
            </IconButton>
          </div>
        ))}
      </div>

      <p className="mt-2 text-[11px] text-slate-500">
        আইকন খালি রাখলে সবুজ টিক (✓) দেখাবে। খালি ঘর সেভের সময় বাদ পড়বে।
      </p>
    </div>
  );

  if (variant === "section") {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <div className="flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20">
            <ListChecks size={24} className="text-blue-500" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold leading-8 text-blue-50">{label}</h2>
            <p className="mt-0.5 text-base text-slate-400">
              ক্রয়ের কার্ডে টিক চিহ্নসহ যে পয়েন্টগুলো দেখাবে
            </p>
          </div>
          {addButton}
        </div>
        {body}
      </section>
    );
  }

  return (
    <div className="rounded-[14px] border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ListChecks size={16} className="text-cyan-400" />
          <span className="text-xs font-bold text-blue-50">{label}</span>
        </div>
        {addButton}
      </div>
      {body}
    </div>
  );
}

function IconButton({
  children,
  danger = false,
  disabled = false,
  label,
  onClick,
}: {
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={`flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${
        danger
          ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      }`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}
