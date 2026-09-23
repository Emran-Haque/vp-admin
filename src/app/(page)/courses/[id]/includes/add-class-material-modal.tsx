"use client";

import { useState } from "react";
import { AlertTriangle, Save, X } from "lucide-react";
import {
  type ClassMaterial,
  type CourseClass,
  useCreateClassMaterialMutation,
  useUpdateClassMaterialMutation,
} from "@/redux/api/classesApi";
import { extractErrorMessage } from "@/lib/api-error";

export default function AddClassMaterialModal({
  courseClass,
  editItem,
  onClose,
}: {
  courseClass: CourseClass;
  editItem?: ClassMaterial;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(editItem?.title ?? "");
  const [driveLink, setDriveLink] = useState(editItem?.drive_link ?? editItem?.file_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [downloadable, setDownloadable] = useState(editItem?.downloadable ?? true);
  const [error, setError] = useState<string | null>(null);
  const [createMaterial, createState] = useCreateClassMaterialMutation();
  const [updateMaterial, updateState] = useUpdateClassMaterialMutation();
  const isLoading = createState.isLoading || updateState.isLoading;

  async function handleSave() {
    setError(null);
    try {
      const data = new FormData();
      data.append("course_class", String(courseClass.id));
      data.append("title", title.trim());
      data.append("downloadable", String(downloadable));
      if (driveLink.trim()) {
        data.append("drive_link", driveLink.trim());
        data.append("kind", "link");
      }
      if (file) {
        data.append("file", file);
        data.append(
          "kind",
          file.type.startsWith("image/")
            ? "image"
            : file.type === "application/pdf"
              ? "pdf"
              : "doc",
        );
      }
      if (editItem) {
        await updateMaterial({ id: editItem.id, data }).unwrap();
      } else {
        await createMaterial(data).unwrap();
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="w-full max-w-[560px] rounded-[20px] border border-white/5 bg-gray-900 p-7 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-50">
              {editItem ? "নোট/ম্যাটেরিয়াল এডিট" : "নোট/ম্যাটেরিয়াল যোগ করুন"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">লেকচার: {courseClass.title}</p>
          </div>
          <button className="grid size-8 place-items-center rounded-lg bg-white/5 text-slate-400" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {error ? (
            <div className="flex gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400">
              <AlertTriangle className="shrink-0" size={16} /> {error}
            </div>
          ) : null}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">শিরোনাম</label>
            <input className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 outline-none" onChange={(event) => setTitle(event.target.value)} value={title} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">ফাইল</label>
            <input className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-300" onChange={(event) => setFile(event.target.files?.[0] ?? null)} type="file" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">অথবা Drive/External লিংক</label>
            <input className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 outline-none" onChange={(event) => setDriveLink(event.target.value)} placeholder="https://..." value={driveLink} />
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <input checked={downloadable} onChange={(event) => setDownloadable(event.target.checked)} type="checkbox" />
            শিক্ষার্থী ডাউনলোড করতে পারবে
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300" onClick={onClose} type="button">বাতিল</button>
            <button className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-50" disabled={isLoading || !title.trim() || (!file && !driveLink.trim() && !editItem)} onClick={handleSave} type="button">
              <Save size={14} /> {isLoading ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
