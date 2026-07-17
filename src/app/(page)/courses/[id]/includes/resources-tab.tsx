"use client";

import { useState } from "react";
import { FileText, Plus, ExternalLink, Trash2 } from "lucide-react";
import { useGetResourcesQuery, useDeleteResourceMutation } from "@/redux/api/resourcesApi";
import { usePermissions } from "@/hooks/use-permissions";
import EmptyState from "./empty-state";
import AddResourceModal from "./add-resource-modal";

export default function ResourcesTab({ courseId }: { courseId: number }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const { data, isLoading } = useGetResourcesQuery({ course: courseId });
  const [deleteResource] = useDeleteResourceMutation();
  const { hasPermission } = usePermissions();

  const resources = data?.results ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-blue-50">রিসোর্স</h3>
        {hasPermission("can_manage_course_resources") && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            রিসোর্স যোগ করুন
          </button>
        )}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-400">লোড হচ্ছে…</p>
        ) : resources.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="এখনো কোনো রিসোর্স নেই"
            subtitle="এই কোর্সের রিসোর্স যুক্ত হলে এখানে দেখা যাবে।"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-gray-900/40 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <FileText size={18} className="text-blue-500" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-blue-50">{resource.title}</p>
                    <p className="text-xs text-slate-400">{resource.resource_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(resource.external_link || resource.file) && (
                    <a
                      href={resource.external_link || resource.file || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-9 items-center justify-center rounded-xl border border-slate-800 text-blue-50 hover:bg-white/5"
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}
                  {hasPermission("can_manage_course_resources") && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`"${resource.title}" মুছে ফেলতে চান?`)) deleteResource(resource.id);
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

      {showAddModal && <AddResourceModal courseId={courseId} onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
