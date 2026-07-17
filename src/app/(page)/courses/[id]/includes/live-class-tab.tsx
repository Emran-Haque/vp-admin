"use client";

import { useState } from "react";
import { Radio, Plus, ExternalLink, Trash2 } from "lucide-react";
import { useGetClassesQuery, useDeleteClassMutation } from "@/redux/api/classesApi";
import { usePermissions } from "@/hooks/use-permissions";
import EmptyState from "./empty-state";
import AddLiveClassModal from "./add-live-class-modal";

export default function LiveClassTab({ courseId }: { courseId: number }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const { data, isLoading } = useGetClassesQuery({ course: courseId, is_live: true });
  const [deleteClass] = useDeleteClassMutation();
  const { hasPermission } = usePermissions();

  const liveClasses = data?.results ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-blue-50">লাইভ ক্লাস</h3>
        {hasPermission("can_create_live_class") && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            লাইভ ক্লাস যোগ করুন
          </button>
        )}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-400">লোড হচ্ছে…</p>
        ) : liveClasses.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="এখনো কোনো লাইভ ক্লাস নেই"
            subtitle="এই কোর্সের লাইভ ক্লাস যুক্ত হলে এখানে দেখা যাবে।"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {liveClasses.map((cls) => (
              <div
                key={cls.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-gray-900/40 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Radio size={18} className="text-emerald-500" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-blue-50">{cls.title}</p>
                    <p className="text-xs text-slate-400">
                      {cls.class_date}
                      {cls.start_time ? ` • ${cls.start_time}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cls.live_url && (
                    <a
                      href={cls.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-blue-50 hover:bg-white/5"
                    >
                      <ExternalLink size={14} />
                      যোগ দিন
                    </a>
                  )}
                  {hasPermission("can_delete_live_class") && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`"${cls.title}" মুছে ফেলতে চান?`)) deleteClass(cls.id);
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

      {showAddModal && <AddLiveClassModal courseId={courseId} onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
