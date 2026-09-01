"use client";

import { useState } from "react";
import { X, Save, AlertTriangle } from "lucide-react";
import {
  useCreateClassMutation,
  useUpdateClassMutation,
  useCreateClassVideoMutation,
  useUpdateClassVideoMutation,
  useDeleteClassVideoMutation,
  type CourseClass,
} from "@/redux/api/classesApi";
import { useGetCourseSubjectsQuery } from "@/redux/api/courseSubjectsApi";
import { extractErrorMessage } from "@/lib/api-error";
import LectureVideoEditor, {
  blankVideoRow,
  isCompleteRow,
  toVideoRows,
  type VideoRow,
} from "./lecture-video-editor";

type AddRecordingModalProps = {
  courseId: number;
  initialSubjectId?: number;
  initialSubjectName?: string;
  editItem?: CourseClass;
  onClose: () => void;
};

/**
 * Create or edit one lecture and its video in a single form.
 *
 * A lecture holds one video: more videos means more lectures, which keeps the
 * student's list of what to watch flat and countable. Editing loads that video
 * into the same boxes used to create it, so correcting a title, a link or a
 * poster is one action — there is no read-only "current videos" list with empty
 * "new video" boxes beside it. Deletions are staged rather than applied on
 * click, so closing without saving leaves the lecture exactly as it was.
 */
export default function AddRecordingModal({
  courseId,
  initialSubjectId,
  initialSubjectName,
  editItem,
  onClose,
}: AddRecordingModalProps) {
  const isEdit = Boolean(editItem);
  const [sessionTitle, setSessionTitle] = useState(editItem?.title ?? "");
  const [subjectId, setSubjectId] = useState(
    editItem?.subject ? String(editItem.subject) : "",
  );
  // One lecture carries one video. `toVideoRows` still returns an array so
  // lectures created before that rule keep showing every video they have.
  const [rows, setRows] = useState<VideoRow[]>(() =>
    isEdit ? toVideoRows(editItem?.videos) : [blankVideoRow()],
  );
  const [removedVideoIds, setRemovedVideoIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: subjectsData } = useGetCourseSubjectsQuery({ course: courseId });
  const subjects = subjectsData?.results ?? [];

  const [createClass] = useCreateClassMutation();
  const [updateClass] = useUpdateClassMutation();
  const [createClassVideo] = useCreateClassVideoMutation();
  const [updateClassVideo] = useUpdateClassVideoMutation();
  const [deleteClassVideo] = useDeleteClassVideoMutation();

  const filledRows = rows.filter(isCompleteRow);
  // A half-typed row is a mistake worth catching before save, not something to
  // silently drop: it means the admin filled one box and forgot the other.
  const partialRow = rows.find(
    (row) => !isCompleteRow(row) && (row.title.trim() !== "" || row.video_url.trim() !== ""),
  );

  const canSave =
    sessionTitle.trim() !== "" &&
    !partialRow &&
    (isEdit || filledRows.length > 0) &&
    !isSaving;

  /** Body for one video: multipart only when a new poster file is attached. */
  const videoPayload = (row: VideoRow, courseClassId: number, order: number) => {
    const fields: Record<string, string> = {
      course_class: String(courseClassId),
      title: row.title.trim(),
      video_url: row.video_url.trim(),
      duration: row.duration.trim(),
      order: String(order),
    };
    if (!row.thumbnailFile) return fields;

    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
    formData.append("thumbnail", row.thumbnailFile);
    return formData;
  };

  const saveVideos = async (courseClassId: number) => {
    // A saved video whose boxes were emptied counts as a removal: with one
    // video per lecture, clearing the fields is the same intent as pressing
    // "সরান", and leaving the old row on the server would silently undo it.
    const clearedIds = rows
      .filter((row) => row.id !== null && !isCompleteRow(row))
      .map((row) => row.id as number);

    for (const id of [...new Set([...removedVideoIds, ...clearedIds])]) {
      await deleteClassVideo(id).unwrap();
    }
    for (const [index, row] of filledRows.entries()) {
      const payload = videoPayload(row, courseClassId, index + 1);
      if (row.id === null) {
        await createClassVideo(
          payload instanceof FormData
            ? payload
            : {
                course_class: courseClassId,
                title: row.title.trim(),
                video_url: row.video_url.trim(),
                duration: row.duration.trim(),
                order: index + 1,
              },
        ).unwrap();
      } else {
        await updateClassVideo({
          id: row.id,
          courseClassId,
          data:
            payload instanceof FormData
              ? payload
              : {
                  title: row.title.trim(),
                  video_url: row.video_url.trim(),
                  duration: row.duration.trim(),
                  order: index + 1,
                },
        }).unwrap();
      }
    }
  };

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      if (isEdit && editItem) {
        const data: Partial<
          Omit<CourseClass, "id" | "videos" | "class_materials" | "quizzes">
        > = { title: sessionTitle };
        if (subjectId) data.subject = subjectId;
        await updateClass({ id: editItem.id, data }).unwrap();
        await saveVideos(editItem.id);
      } else {
        const classData = new FormData();
        classData.append("course", String(courseId));
        classData.append("title", sessionTitle);
        if (initialSubjectId) classData.append("subject", String(initialSubjectId));
        const createdClass = await createClass(classData).unwrap();
        await saveVideos(createdClass.id);
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
      setIsSaving(false);
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
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">বিষয়</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              >
                <option value="">কোনো বিষয় নয়</option>
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

          <LectureVideoEditor
            rows={rows}
            onChange={setRows}
            onRemovePersisted={(id) => setRemovedVideoIds((prev) => [...prev, id])}
          />

          {partialRow ? (
            <p className="rounded-[10px] border border-amber-500/30 bg-amber-500/5 px-3.5 py-2 text-xs text-amber-200">
              ভিডিওর শিরোনাম ও লিংক দুটোই দিতে হবে।
            </p>
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
              disabled={!canSave}
              className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0px_4px_12px_0px_rgba(0,200,150,0.19)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} />
              {isSaving ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
