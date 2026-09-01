"use client";

import { useState } from "react";
import { X, Save, AlertTriangle, Upload } from "lucide-react";
import {
  useCreateResourceMutation,
  useUpdateResourceMutation,
  type CourseResource,
  type ResourceKind,
} from "@/redux/api/resourcesApi";
import { useGetCourseSubjectsQuery } from "@/redux/api/courseSubjectsApi";
import { extractErrorMessage } from "@/lib/api-error";

/**
 * The three ways a resource reaches a student, and what each one needs.
 *
 * `accept` is null for the Drive kind — that one takes a link instead of a
 * file, which is why the form swaps its input rather than showing both.
 */
const resourceTypes: {
  value: ResourceKind;
  label: string;
  hint: string;
  accept: string | null;
}[] = [
  {
    value: "pdf",
    label: "পিডিএফ",
    hint: "PDF ফাইল আপলোড করুন",
    accept: "application/pdf,.pdf",
  },
  {
    value: "doc",
    label: "ডকুমেন্ট",
    hint: "Word ফাইল আপলোড করুন (.doc / .docx)",
    accept: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    value: "drive",
    label: "ড্রাইভ লিংক",
    hint: "Google Drive বা অন্য কোনো লিংক দিন",
    accept: null,
  },
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
  const [resourceType, setResourceType] = useState<ResourceKind>(
    editItem?.resource_type ?? "pdf",
  );
  const [externalLink, setExternalLink] = useState(editItem?.external_link ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [subjectId, setSubjectId] = useState(
    editItem?.subject ? String(editItem.subject) : "",
  );
  const [error, setError] = useState<string | null>(null);

  const { data: subjectsData } = useGetCourseSubjectsQuery({ course: courseId });
  const subjects = subjectsData?.results ?? [];

  const [createResource, { isLoading: isCreating }] = useCreateResourceMutation();
  const [updateResource, { isLoading: isUpdating }] = useUpdateResourceMutation();
  const isLoading = isCreating || isUpdating;

  const activeType = resourceTypes.find((t) => t.value === resourceType) ?? resourceTypes[0];
  const isDrive = resourceType === "drive";
  // The file already on the server, if the admin has not replaced it.
  const existingFileName = editItem?.file ? decodeURIComponent(editItem.file.split("/").pop() ?? "") : "";
  const hasDeliverable = isDrive
    ? externalLink.trim() !== ""
    : Boolean(file) || Boolean(existingFileName) || externalLink.trim() !== "";

  const handleSave = async () => {
    setError(null);
    try {
      // Multipart only when a file is attached; otherwise plain JSON, so a
      // link-only edit does not have to re-send the whole record as form data.
      const body = (extra: Record<string, string>) => {
        if (!file) return null;
        const fd = new FormData();
        Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
        fd.append("file", file);
        return fd;
      };

      if (isEdit && editItem) {
        const fields: Record<string, string> = {
          title,
          resource_type: resourceType,
          external_link: isDrive ? externalLink : "",
        };
        if (subjectId) fields.subject = subjectId;
        const fd = body(fields);
        await updateResource({
          id: editItem.id,
          data:
            fd ?? {
              title,
              resource_type: resourceType,
              external_link: isDrive ? externalLink : "",
              subject: subjectId ? Number(subjectId) : null,
            },
        }).unwrap();
        onClose();
        return;
      }

      const fields: Record<string, string> = {
        course: String(courseId),
        title,
        resource_type: resourceType,
        external_link: isDrive ? externalLink : "",
      };
      if (initialSubjectId) fields.subject = String(initialSubjectId);
      const fd = body(fields);
      await createResource(
        fd ?? {
          course: courseId,
          title,
          subject: initialSubjectId ?? null,
          resource_type: resourceType,
          external_link: isDrive ? externalLink : "",
        },
      ).unwrap();
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
            <div className="grid grid-cols-3 gap-2">
              {resourceTypes.map((t) => {
                const isActive = resourceType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setResourceType(t.value)}
                    className={`cursor-pointer rounded-[10px] border px-3 py-2.5 text-xs font-bold transition ${
                      isActive
                        ? "border-blue-500 bg-blue-500/10 text-blue-100"
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">{activeType.hint}</p>
          </div>

          {/* One input, chosen by type — a Drive resource has no file to upload
              and a PDF has no link to paste, so showing both would only invite
              filling in the wrong one. */}
          {isDrive ? (
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">
                ড্রাইভ লিংক
              </label>
              <input
                type="url"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                লিংকটি &quot;Anyone with the link&quot; করে শেয়ার করুন, নইলে শিক্ষার্থী খুলতে পারবে না।
              </p>
            </div>
          ) : (
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">ফাইল</label>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-dashed border-white/15 bg-white/5 px-3.5 py-3 text-sm text-slate-300 hover:border-blue-500/50">
                <Upload size={16} className="shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate">
                  {file?.name || existingFileName || "ফাইল বেছে নিন"}
                </span>
                {file || existingFileName ? (
                  <span className="shrink-0 text-[11px] font-bold text-blue-300">পরিবর্তন</span>
                ) : null}
                <input
                  type="file"
                  accept={activeType.accept ?? undefined}
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {existingFileName && !file ? (
                <p className="mt-1.5 text-[11px] text-slate-500">
                  বর্তমান ফাইল রাখা হবে — নতুন ফাইল দিলে সেটি প্রতিস্থাপিত হবে।
                </p>
              ) : null}
            </div>
          )}

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
              disabled={isLoading || !title.trim() || !hasDeliverable}
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
