"use client";

import { useState } from "react";
import { X, Save, AlertTriangle } from "lucide-react";
import {
  useCreateClassMutation,
  useUpdateClassMutation,
  useCreateClassVideoMutation,
  type CourseClass,
} from "@/redux/api/classesApi";
import { extractErrorMessage } from "@/lib/api-error";

type AddRecordingModalProps = {
  courseId: number;
  initialSubjectId?: number;
  initialSubjectName?: string;
  editItem?: CourseClass;
  onClose: () => void;
};

export default function AddRecordingModal({
  courseId,
  initialSubjectId,
  initialSubjectName,
  editItem,
  onClose,
}: AddRecordingModalProps) {
  const isEdit = Boolean(editItem);
  const [sessionTitle, setSessionTitle] = useState(editItem?.title ?? "");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [createClass, { isLoading: isCreatingClass }] = useCreateClassMutation();
  const [updateClass, { isLoading: isUpdatingClass }] = useUpdateClassMutation();
  const [createClassVideo, { isLoading: isCreatingVideo }] = useCreateClassVideoMutation();
  const isLoading = isCreatingClass || isUpdatingClass || isCreatingVideo;

  const handleSave = async () => {
    setError(null);
    try {
      if (isEdit && editItem) {
        // Videos have no update endpoint; edit renames the lecture (class) only.
        await updateClass({ id: editItem.id, data: { title: sessionTitle } }).unwrap();
        onClose();
        return;
      }
      const classData = new FormData();
      classData.append("course", String(courseId));
      classData.append("title", sessionTitle);
      if (initialSubjectId) classData.append("subject", String(initialSubjectId));
      const createdClass = await createClass(classData).unwrap();
      await createClassVideo({
        course_class: createdClass.id,
        title: videoTitle,
        video_url: videoUrl,
        duration,
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
            {isEdit ? "লেকচার সম্পাদনা" : "ক্লাস রেকর্ডিং যোগ করুন"}
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

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">ক্লাসের নাম</label>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="যেমন: অধ্যায় ১ - পরিচিতি"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          {isEdit ? (
            <p className="rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-slate-400">
              ভিডিও যোগ বা মুছতে লেকচার তালিকা ব্যবহার করুন। এখানে শুধু লেকচারের নাম পরিবর্তন হয়।
            </p>
          ) : (
            <>
              <div>
                <label className="block pb-1.5 text-xs font-semibold text-slate-400">ভিডিওর শিরোনাম</label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="যেমন: রেকর্ডিং পার্ট ১"
                  className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block pb-1.5 text-xs font-semibold text-slate-400">ভিডিও লিংক</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="YouTube / Drive লিংক"
                  className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block pb-1.5 text-xs font-semibold text-slate-400">দৈর্ঘ্য</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="যেমন: 45:00"
                  className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
                />
              </div>
            </>
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
              disabled={
                isLoading ||
                !sessionTitle.trim() ||
                (!isEdit && (!videoTitle.trim() || !videoUrl.trim()))
              }
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
