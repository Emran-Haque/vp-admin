"use client";

import { useMemo, useState } from "react";
import { X, ShieldCheck, AlertTriangle } from "lucide-react";
import {
  useGetGroupedPermissionCatalogQuery,
  useUpdateModeratorPermissionsMutation,
  type Moderator,
  type ModeratorPermissions,
} from "@/redux/api/moderatorsApi";
import { groupLabels, permissionLabels } from "./permission-labels";
import ErrorState from "@/components/error-state";

type Props = {
  moderator: Moderator;
  onClose: () => void;
};

type FlagState = Record<string, boolean>;

function toFlagState(permissions: ModeratorPermissions): FlagState {
  const flags: FlagState = {};
  for (const [key, value] of Object.entries(permissions)) {
    if (key === "user" || key === "granted") continue;
    flags[key] = value as boolean;
  }
  return flags;
}

export default function PermissionsModal({ moderator, onClose }: Props) {
  const { data: catalog, isLoading, isError, error } = useGetGroupedPermissionCatalogQuery();
  const [updatePermissions, { isLoading: isSaving, isError: isSaveError }] =
    useUpdateModeratorPermissionsMutation();

  const [flags, setFlags] = useState<FlagState>(() => toFlagState(moderator.permissions));

  const grantedCount = useMemo(() => Object.values(flags).filter(Boolean).length, [flags]);

  const toggle = (key: string) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGroup = (permissions: string[], enable: boolean) => {
    setFlags((prev) => {
      const next = { ...prev };
      permissions.forEach((key) => {
        next[key] = enable;
      });
      return next;
    });
  };

  const handleSave = async () => {
    try {
      await updatePermissions({ id: moderator.id, data: flags }).unwrap();
      onClose();
    } catch {
      // error state shown inline below
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-[20px] border border-white/5 bg-gray-900/95 shadow-[0px_15px_30px_0px_rgba(139,92,246,0.35)]">
        <div className="flex items-center justify-between border-b border-white/5 p-7 pb-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/20">
              <ShieldCheck size={22} className="text-violet-400" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-50">{moderator.full_name}-এর অনুমতি</h2>
              <p className="mt-0.5 text-xs text-slate-400">{grantedCount}টি অনুমতি নির্বাচিত</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-7 py-5">
          {isLoading && <p className="text-center text-sm text-slate-400">অনুমতির তালিকা লোড হচ্ছে…</p>}

          {isError && (
            <ErrorState message="অনুমতির তালিকা আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।" error={error} />
          )}

          {isSaveError && (
            <div className="mb-4 flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-500">অনুমতি সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {catalog?.groups.map(({ group, permissions }) => {
              const allChecked = permissions.every((key) => flags[key]);
              return (
                <div key={group} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between pb-3">
                    <p className="text-sm font-semibold text-blue-50">{groupLabels[group] ?? group}</p>
                    <button
                      type="button"
                      onClick={() => toggleGroup(permissions, !allChecked)}
                      className="cursor-pointer text-xs font-medium text-blue-400 hover:underline"
                    >
                      {allChecked ? "সব বাতিল করুন" : "সব নির্বাচন করুন"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {permissions.map((key) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-800 bg-gray-900/50 px-3 py-2.5"
                      >
                        <input
                          type="checkbox"
                          checked={!!flags[key]}
                          onChange={() => toggle(key)}
                          className="size-4 cursor-pointer accent-violet-500"
                        />
                        <span className="text-xs font-medium text-slate-300">
                          {permissionLabels[key] ?? key}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 border-t border-white/5 p-7 pt-5">
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
            disabled={isSaving || isLoading}
            className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-violet-500 to-fuchsia-500 px-4 py-2 text-xs font-bold text-white shadow-[0px_4px_12px_0px_rgba(139,92,246,0.30)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShieldCheck size={14} />
            {isSaving ? "সংরক্ষণ হচ্ছে…" : "অনুমতি সংরক্ষণ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
