"use client";

import { useEffect, useRef, useState } from "react";
import { X, Save, AlertTriangle, Upload } from "lucide-react";
import { useCreateClassMutation } from "@/redux/api/classesApi";
import { extractErrorMessage } from "@/lib/api-error";

export default function AddLiveClassModal({ courseId, onClose }: { courseId: number; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [classDate, setClassDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!thumbnail) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(thumbnail);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnail]);

  const [createClass, { isLoading }] = useCreateClassMutation();

  const handleSave = async () => {
    setError(null);
    try {
      const formData = new FormData();
      formData.append("course", String(courseId));
      formData.append("title", title);
      formData.append("class_date", classDate);
      formData.append("start_time", startTime);
      formData.append("is_live", "true");
      formData.append("live_url", liveUrl);
      if (thumbnail) formData.append("thumbnail", thumbnail);

      await createClass(formData).unwrap();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="w-full max-w-[560px] rounded-[20px] border border-white/5 bg-gray-900/75 p-7 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-50">লাইভ ক্লাস যোগ করুন</h2>
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

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">ক্লাসের নাম</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: লাইভ সেশন - রসায়ন"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">তারিখ</label>
              <input
                type="date"
                value={classDate}
                onChange={(e) => setClassDate(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
              />
            </div>
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">শুরু সময়</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
              />
            </div>
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">লাইভ লিংক</label>
            <input
              type="text"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="Zoom / Google Meet / YouTube লাইভ লিংক"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">থাম্বনেইল</label>
            {previewUrl ? (
              <div className="relative overflow-hidden rounded-[10px] border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="থাম্বনেইল" className="h-32 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setThumbnail(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute right-2 top-2 flex size-7 cursor-pointer items-center justify-center rounded-lg bg-gray-900/80 text-slate-200"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-1 rounded-[10px] border-2 border-dashed border-white/10 bg-white/5 p-5 text-center">
                <Upload size={22} className="text-slate-400" strokeWidth={1.5} />
                <p className="pt-1 text-xs font-semibold text-slate-300">ছবি আপলোড করতে ক্লিক করুন</p>
                <p className="text-[11px] text-slate-500">PNG, JPG (সর্বোচ্চ 5MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
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
              disabled={isLoading || !title.trim() || !liveUrl.trim()}
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
