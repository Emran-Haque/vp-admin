"use client";

import { Package, Plus, FolderCog } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

type Props = {
  onAddClick: () => void;
  onManageCategoriesClick: () => void;
};

export default function OverviewBanner({ onAddClick, onManageCategoriesClick }: Props) {
  const { hasPermission } = usePermissions();
  const canManageCategories =
    hasPermission("can_create_book") || hasPermission("can_edit_book") || hasPermission("can_delete_book");

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-fuchsia-500" />

      <div className="flex flex-wrap items-center justify-between gap-4 p-7">
        <div className="flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-cyan-500/20">
            <Package size={32} className="text-cyan-500" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-9 text-blue-50">বই ব্যবস্থাপনা</h1>
            <p className="mt-1 text-base text-slate-400">সকল বইয়ের তথ্য, মূল্য ও স্টক এক জায়গায় পরিচালনা করুন</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canManageCategories && (
            <button
              type="button"
              onClick={onManageCategoriesClick}
              className="flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-800 px-5 py-3.5 text-base font-semibold text-blue-50 transition-colors duration-200 hover:bg-white/5"
            >
              <FolderCog size={16} />
              ক্যাটাগরি
            </button>
          )}
          {hasPermission("can_create_book") && (
            <button
              type="button"
              onClick={onAddClick}
              className="flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-3.5 text-lg font-semibold text-white shadow-[0px_0px_40px_-10px_rgba(0,229,200,0.50)]"
            >
              <Plus size={16} />
              নতুন বই
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
