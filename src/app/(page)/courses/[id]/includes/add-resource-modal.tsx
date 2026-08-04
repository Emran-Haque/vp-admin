"use client";

import { useState } from "react";
import { X, Save, AlertTriangle } from "lucide-react";
import {
  useCreateResourceMutation,
  useUpdateResourceMutation,
  type CourseResource,
} from "@/redux/api/resourcesApi";
import { useGetCourseSubjectsQuery } from "@/redux/api/courseSubjectsApi";
import { extractErrorMessage } from "@/lib/api-error";

const resourceTypes: { value: CourseResource["resource_type"]; label: string }[] = [
  { value: "book", label: "বই" },
  { value: "note", label: "নোট" },
  { value: "pdf", label: "পিডিএফ" },
  { value: "question_bank", label: "প্রশ্ন ব্যাংক" },
  { value: "magazine", label: "ম্যাগাজিন" },
  { value: "short_note", label: "শর্ট নোট" },
  { value: "link", label: "লিংক" },
];

type AddResourceModalProps = {
  courseId: number;
  initialSubjectId?: number;
  initialSubjectName?: string;
  editItem?: CourseResource;
  onClose: () => void;
};

export default function AddResourceModal({
  courseId,
  initialSubjectId,
  initialSubjectName,
  editItem,
  onClose,
}: AddResourceModalProps) {
  const isEdit = Boolean(editItem);
  const [title, setTitle] = useState(editItem?.title ?? "");
  const [resourceType, setResourceType] = useState<CourseResource["resource_type"]>(
    editItem?.resource_type ?? "pdf",
  );
  const [externalLink, setExternalLink] = useState(editItem?.external_link ?? "");
  const [subjectId, setSubjectId] = useState(
    editItem?.subject ? String(editItem.subject) : "",
  );
  const [error, setError] = useState<string | null>(null);

  const { data: subjectsData } = useGetCourseSubjectsQuery({ course: courseId });
  const subjects = subjectsData?.results ?? [];

  const [createResource, { isLoading: isCreating }] = useCreateResourceMutation();
  const [updateResource, { isLoading: isUpdating }] = useUpdateResourceMutation();
  const isLoading = isCreating || isUpdating;

  const handleSave = async () => {
    setError(null);
    try {
      if (isEdit && editItem) {
        await updateResource({
          id: editItem.id,
          data: {
            title,
            resource_type: resourceType,
            external_link: externalLink,
            subject: subjectId ? Number(subjectId) : null,
          },
        }).unwrap();
        onClose();
        return;
      }
      await createResource({
        course: courseId,
        title,
        subject: initialSubjectId ?? null,
        resource_type: resourceType,
        external_link: externalLink,
      }).unwrap();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="w-full max-w-[560px] rounded-[20px] border border-white/5 bg-gray-900/75 p-7 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-50">
            {isEdit ? "রিসোর্স সম্পাদনা" : "রিসোর্স যোগ করুন"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 pt-6">
          {error && (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-500">{error}</p>
            </div>
          )}

          {initialSubjectName ? (
            <div className="rounded-[10px] border border-blue-500/25 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-100">
              বিষয়: {initialSubjectName}
            </div>
          ) : null}

          {isEdit ? (
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">বিষয়</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              >
                <option value="">কোনো বিষয় নয়</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">রিসোর্সের নাম</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: অধ্যায় ১ - নোট"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">ধরন</label>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value as CourseResource["resource_type"])}
              className="w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
            >
              {resourceTypes.map((t) => (
                <option key={t.value} value={t.value} className="bg-slate-800 text-slate-200">
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">লিংক</label>
            <input
              type="text"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="Drive / ডাউনলোড লিংক"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-[10px] border border-slate-400/20 bg-slate-400/5 px-4 py-2 text-xs font-bold text-slate-400"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || !title.trim()}
              className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0px_4px_12px_0px_rgba(0,200,150,0.19)] disabled:cursor-not-allowed disabled:opacity-50"
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
