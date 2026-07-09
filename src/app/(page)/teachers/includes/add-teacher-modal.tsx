"use client";

import { useState } from "react";
import { X, Save, AlertTriangle, Upload, User } from "lucide-react";
import { useCreateTeacherMutation } from "@/redux/api/contentApi";

const socialFields = [
  { key: "facebook", label: "ফেসবুক", placeholder: "https://facebook.com/..." },
  { key: "youtube", label: "ইউটিউব", placeholder: "https://youtube.com/..." },
  { key: "linkedin", label: "লিংকডইন", placeholder: "https://linkedin.com/in/..." },
  { key: "website", label: "ওয়েবসাইট", placeholder: "https://..." },
];

export default function AddTeacherModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [subject, setSubject] = useState("");
  const [bio, setBio] = useState("");
  const [ordering, setOrdering] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [image, setImage] = useState<File | null>(null);

  const [createTeacher, { isLoading, isError }] = useCreateTeacherMutation();

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("designation", designation);
    formData.append("subject", subject);
    formData.append("bio", bio);
    formData.append("ordering", ordering || "0");
    formData.append("is_active", String(isActive));
    formData.append(
      "social_links",
      JSON.stringify(Object.fromEntries(Object.entries(socialLinks).filter(([, v]) => v)))
    );
    if (image) formData.append("image", image);

    try {
      await createTeacher(formData).unwrap();
      onClose();
    } catch {
      // error state shown inline below
    }
  };

  const canSave = name.trim() && designation.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="flex max-h-[85vh] w-full max-w-[560px] flex-col rounded-[20px] border border-white/5 bg-gray-900/75 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between p-7 pb-0">
          <h2 className="text-base font-bold text-slate-50">নতুন শিক্ষক যোগ করুন</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-7">
          {isError && (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-500">শিক্ষক তৈরি করা যায়নি। তথ্য ও API সার্ভার সংযোগ যাচাই করুন।</p>
            </div>
          )}

          <div className="flex items-center gap-4">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={URL.createObjectURL(image)} alt="preview" className="size-16 shrink-0 rounded-2xl object-cover" />
            ) : (
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/5">
                <User size={24} className="text-slate-400" />
              </span>
            )}
            <label className="flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-slate-200">
              <Upload size={14} />
              ছবি আপলোড করুন
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">নাম</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: করিম স্যার"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">পদবি</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="যেমন: সিনিয়র লেকচারার"
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">বিষয়</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="যেমন: পদার্থবিজ্ঞান"
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">সংক্ষিপ্ত পরিচিতি</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="শিক্ষকের অভিজ্ঞতা ও পরিচিতি লিখুন..."
              rows={3}
              className="w-full resize-none rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          <div>
            <p className="pb-1.5 text-xs font-semibold text-slate-400">সামাজিক যোগাযোগ মাধ্যম</p>
            <div className="grid grid-cols-2 gap-2.5">
              {socialFields.map((f) => (
                <input
                  key={f.key}
                  type="text"
                  value={socialLinks[f.key] ?? ""}
                  onChange={(e) => setSocialLinks((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">ক্রম</label>
              <input
                type="number"
                value={ordering}
                onChange={(e) => setOrdering(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 pt-6">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 cursor-pointer accent-blue-500"
              />
              <span className="text-xs font-medium text-slate-400">সাইটে প্রদর্শিত থাকুক</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 p-7 pt-0">
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
            disabled={isLoading || !canSave}
            className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0px_4px_12px_0px_rgba(0,200,150,0.19)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={14} />
            {isLoading ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
