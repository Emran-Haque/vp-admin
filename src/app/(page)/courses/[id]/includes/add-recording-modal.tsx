"use client";

import { useState } from "react";
import { X, Save, AlertTriangle, Trash2, Plus } from "lucide-react";
import {
  useCreateClassMutation,
  useUpdateClassMutation,
  useCreateClassVideoMutation,
  useDeleteClassVideoMutation,
  type CourseClass,
  type ClassVideo,
} from "@/redux/api/classesApi";
import { useGetCourseSubjectsQuery } from "@/redux/api/courseSubjectsApi";
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
  const [subjectId, setSubjectId] = useState(
    editItem?.subject ? String(editItem.subject) : "",
  );
  // Existing videos on the lecture (edit mode) — kept in local state so the
  // list updates immediately as videos are added/removed.
  const [videos, setVideos] = useState<ClassVideo[]>(editItem?.videos ?? []);

  const { data: subjectsData } = useGetCourseSubjectsQuery({ course: courseId });
  const subjects = subjectsData?.results ?? [];

  const [createClass, { isLoading: isCreatingClass }] = useCreateClassMutation();
  const [updateClass, { isLoading: isUpdatingClass }] = useUpdateClassMutation();
  const [createClassVideo, { isLoading: isCreatingVideo }] = useCreateClassVideoMutation();
  const [deleteClassVideo] = useDeleteClassVideoMutation();
  const isLoading = isCreatingClass || isUpdatingClass || isCreatingVideo;

  const hasNewVideo = videoTitle.trim() !== "" && videoUrl.trim() !== "";

  // Edit mode: add a video to the existing lecture right away.
  const handleAddVideo = async () => {
    if (!editItem || !hasNewVideo) return;
    setError(null);
    try {
      const created = await createClassVideo({
        course_class: editItem.id,
        title: videoTitle,
        video_url: videoUrl,
        duration,
      }).unwrap();
      setVideos((prev) => [...prev, created]);
      setVideoTitle("");
      setVideoUrl("");
      setDuration("");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleRemoveVideo = async (videoId: number) => {
    setError(null);
    try {
      await deleteClassVideo(videoId).unwrap();
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleSave = async () => {
    setError(null);
    try {
      if (isEdit && editItem) {
        // Rename the lecture (and re-home its subject); add the pending video too.
        const data: Partial<
          Omit<CourseClass, "id" | "videos" | "class_materials" | "quizzes">
        > = { title: sessionTitle };
        if (subjectId) data.subject = subjectId;
        await updateClass({ id: editItem.id, data }).unwrap();
        if (hasNewVideo) {
          await createClassVideo({
            course_class: editItem.id,
            title: videoTitle,
            video_url: videoUrl,
            duration,
          }).unwrap();
        }
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
      <div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-[20px] border border-white/5 bg-gray-900/75 p-7 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
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
              বিষয়: {initialSubjectName}
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
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">লেকচারের নাম</label>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="যেমন: অধ্যায় ১ - পরিচিতি"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          {/* Existing videos (edit mode) */}
          {isEdit && videos.length > 0 ? (
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">
                বর্তমান ভিডিও
              </label>
              <div className="flex flex-col gap-2">
                {videos.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-200">{v.title}</p>
                      <p className="truncate text-[11px] text-slate-500">{v.video_url}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(v.id)}
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-red-600/40 bg-red-600/10 text-red-500 hover:bg-red-600/20"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">
              {isEdit ? "নতুন ভিডিওর শিরোনাম (ঐচ্ছিক)" : "ভিডিওর শিরোনাম"}
            </label>
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

          {/* In edit mode, let admins add more than one video without closing. */}
          {isEdit ? (
            <button
              type="button"
              onClick={handleAddVideo}
              disabled={isLoading || !hasNewVideo}
              className="flex items-center justify-center gap-1.5 rounded-[10px] border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={14} />
              এই ভিডিওটি যোগ করুন
            </button>
          ) : null}

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
