"use client";

import { useState } from "react";
import { X, Save, AlertTriangle } from "lucide-react";
import { useCreateNoticeMutation } from "@/redux/api/noticesApi";

const priorities = [
  { value: "urgent", label: "জরুরি" },
  { value: "important", label: "গুরুত্বপূর্ণ" },
  { value: "normal", label: "সাধারণ" },
];

const categories = ["সাধারণ", "পরীক্ষা", "সময়সূচি", "রিসোর্স"];

export default function AddNoticeModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [visible, setVisible] = useState(true);

  const [createNotice, { isLoading, isError }] = useCreateNoticeMutation();

  const handleSave = async () => {
    try {
      await createNotice({
        title,
        description,
        category,
        priority: priority || "normal",
        target_type: "all",
        is_visible: visible,
      }).unwrap();
      onClose();
    } catch {
      // error state shown inline below
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="w-full max-w-[520px] rounded-[20px] border border-white/5 bg-gray-900/75 p-7 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-50">নতুন নোটিশ যোগ করুন</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 pt-6">
          {isError && (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-500">নোটিশ সংরক্ষণ করা যায়নি। API সার্ভার সংযোগ পরীক্ষা করুন।</p>
            </div>
          )}

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">নোটিশের শিরোনাম</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="নোটিশের শিরোনাম লিখুন"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">বিস্তারিত বিবরণ</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="নোটিশের বিস্তারিত লিখুন..."
              rows={3}
              className="w-full resize-none rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">গুরুত্ব</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              >
                <option value="">নির্বাচন করুন</option>
                {priorities.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">ক্যাটাগরি</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              className="size-4 accent-blue-500"
            />
            <span className="text-xs font-medium text-slate-400">সকলের কাছে দৃশ্যমান রাখুন</span>
          </label>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] border border-slate-400/20 bg-slate-400/5 px-4 py-2 text-xs font-bold text-slate-400"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || !title.trim()}
              className="flex items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0px_4px_12px_0px_rgba(0,200,150,0.19)] disabled:opacity-50"
            >
              <Save size={14} />
              {isLoading ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
