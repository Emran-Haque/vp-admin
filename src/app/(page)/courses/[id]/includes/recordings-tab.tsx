"use client";

import { useState } from "react";
import { Play, Plus, ExternalLink, Trash2 } from "lucide-react";
import { useGetClassesQuery, useDeleteClassVideoMutation } from "@/redux/api/classesApi";
import { usePermissions } from "@/hooks/use-permissions";
import EmptyState from "./empty-state";
import AddRecordingModal from "./add-recording-modal";

export default function RecordingsTab({ courseId }: { courseId: number }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const { data, isLoading } = useGetClassesQuery({ course: courseId });
  const [deleteClassVideo] = useDeleteClassVideoMutation();
  const { hasPermission } = usePermissions();

  const recordings = (data?.results ?? []).flatMap((cls) =>
    cls.videos.map((video) => ({ ...video, className: cls.title }))
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-blue-50">ক্লাস রেকর্ডিং</h3>
        {hasPermission("can_create_live_class") && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            রেকর্ডিং যোগ করুন
          </button>
        )}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-400">লোড হচ্ছে…</p>
        ) : recordings.length === 0 ? (
          <EmptyState
            icon={Play}
            title="এখনো কোনো রেকর্ডিং নেই"
            subtitle="এই কোর্সের ক্লাস রেকর্ডিং যুক্ত হলে এখানে দেখা যাবে।"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {recordings.map((video) => (
              <div
                key={video.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-gray-900/40 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Play size={18} className="text-blue-500" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-blue-50">{video.title}</p>
                    <p className="text-xs text-slate-400">
                      {video.className}
                      {video.duration ? ` • ${video.duration}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {video.video_url && (
                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-9 items-center justify-center rounded-xl border border-slate-800 text-blue-50 hover:bg-white/5"
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}
                  {hasPermission("can_create_live_class") && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`"${video.title}" মুছে ফেলতে চান?`)) deleteClassVideo(video.id);
                      }}
                      className="flex size-9 items-center justify-center rounded-xl border border-red-600/40 bg-red-600/10 text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && <AddRecordingModal courseId={courseId} onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
