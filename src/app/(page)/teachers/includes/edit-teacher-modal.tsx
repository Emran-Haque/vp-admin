"use client";

import { useState } from "react";
import ImageSizeHint from "@/components/image-size-hint";
import { X, Save, AlertTriangle, Upload, User } from "lucide-react";
import { useUpdateTeacherMutation, type Teacher } from "@/redux/api/contentApi";

const fieldClass = "w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none";
const areaClass = `${fieldClass} resize-none leading-6`;

export default function EditTeacherModal({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) {
  const [name, setName] = useState(teacher.name || "");
  const [designation, setDesignation] = useState(teacher.designation || "");
  const [subject, setSubject] = useState(teacher.subject || "");
  const [shortDescription, setShortDescription] = useState(teacher.short_description || teacher.bio || "");
  const [longDescription, setLongDescription] = useState(teacher.long_description || teacher.bio || "");
  const [ordering, setOrdering] = useState(String(teacher.ordering ?? 0));
  const [isActive, setIsActive] = useState(teacher.is_active);
  const [image, setImage] = useState<File | null>(null);

  const [updateTeacher, { isLoading, isError }] = useUpdateTeacherMutation();

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("designation", designation.trim());
    formData.append("subject", subject.trim());
    formData.append("short_description", shortDescription.trim());
    formData.append("long_description", longDescription.trim());
    formData.append("bio", shortDescription.trim());
    formData.append("ordering", ordering || "0");
    formData.append("is_active", String(isActive));
    if (image) formData.append("image", image);

    try {
      await updateTeacher({ id: teacher.id, data: formData }).unwrap();
      onClose();
    } catch {
      // error state shown inline below
    }
  };

  const canSave = name.trim() && designation.trim();
  const previewUrl = image ? URL.createObjectURL(image) : teacher.image;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="flex max-h-[88vh] w-full max-w-[640px] flex-col rounded-[20px] border border-white/5 bg-gray-900/75 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between p-7 pb-0">
          <div>
            <h2 className="text-base font-bold text-slate-50">শিক্ষক সম্পাদনা করুন</h2>
            <p className="mt-1 text-xs text-slate-400">কার্ড, মেন্টর পেজ এবং শিক্ষক প্রোফাইলের তথ্য এখান থেকে যাবে।</p>
          </div>
          <button type="button" onClick={onClose} className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-7">
          {isError && (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-500">শিক্ষক সংরক্ষণ করা যায়নি। তথ্য ও API সার্ভার সংযোগ যাচাই করুন।</p>
            </div>
          )}

          <div className="flex flex-wrap items-start gap-4">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="preview" className="h-24 w-20 shrink-0 rounded-2xl bg-white/5 object-contain object-bottom" />
            ) : (
              <span className="flex h-24 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/5">
                <User size={24} className="text-slate-400" />
              </span>
            )}
            <div className="min-w-[220px] flex-1">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-slate-200">
                <Upload size={14} />
                শিক্ষক ছবি পরিবর্তন করুন
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
              </label>
              <ImageSizeHint kind="teacherPhoto" />
            </div>
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">শিক্ষকের নাম</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: ফাহিম উদ্দিন" className={fieldClass} />
          </div>

          <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">পদবি / ভূমিকা</label>
              <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="যেমন: রসায়ন মেন্টর" className={fieldClass} />
            </div>
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">বিষয়</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="যেমন: রসায়ন" className={fieldClass} />
            </div>
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">কার্ডে দেখানোর ছোট পরিচিতি</label>
            <textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="যেমন: চট্টগ্রাম বিশ্ববিদ্যালয়ে রসায়নে অনার্স। ৫+ বছরের অভিজ্ঞতা।" rows={3} maxLength={300} className={areaClass} />
            <p className="mt-1 text-[11px] text-slate-500">মেন্টর কার্ডে ২-৩ লাইনে দেখা যাবে। সর্বোচ্চ ৩০০ অক্ষর।</p>
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">প্রোফাইলে দেখানোর বিস্তারিত পরিচিতি</label>
            <textarea value={longDescription} onChange={(e) => setLongDescription(e.target.value)} placeholder="শিক্ষকের অভিজ্ঞতা, পড়ানোর ধরন, সাফল্য এবং শিক্ষার্থীদের কীভাবে গাইড করেন তা লিখুন..." rows={6} className={areaClass} />
          </div>

          <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">দেখানোর ক্রম</label>
              <input type="number" value={ordering} onChange={(e) => setOrdering(e.target.value)} className={fieldClass} />
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 pt-6 max-sm:pt-0">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4 cursor-pointer accent-blue-500" />
              <span className="text-xs font-medium text-slate-400">ওয়েবসাইটে দেখান</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 p-7 pt-0">
          <button type="button" onClick={onClose} className="cursor-pointer rounded-[10px] border border-slate-400/20 bg-slate-400/5 px-4 py-2 text-xs font-bold text-slate-400">বাতিল</button>
          <button type="button" onClick={handleSave} disabled={isLoading || !canSave} className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0px_4px_12px_0px_rgba(0,200,150,0.19)] disabled:cursor-not-allowed disabled:opacity-50">
            <Save size={14} />
            {isLoading ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
