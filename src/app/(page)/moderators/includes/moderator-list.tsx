"use client";

import { useState } from "react";
import { AlertTriangle, ShieldCheck, Mail, Phone, KeyRound, UserCheck, UserX } from "lucide-react";
import {
  useGetModeratorsQuery,
  useGetGroupedPermissionCatalogQuery,
  useDeactivateModeratorMutation,
  useReactivateModeratorMutation,
  type Moderator,
} from "@/redux/api/moderatorsApi";
import ErrorState from "@/components/error-state";
import ConfirmActionDialog from "@/components/confirm-action-dialog";
import { PageLoader } from "@/components/loaders";

type Props = {
  search: string;
  onManagePermissions: (moderator: Moderator) => void;
};

export default function ModeratorList({ search, onManagePermissions }: Props) {
  const { data, isLoading, isError, error } = useGetModeratorsQuery({ search: search || undefined });
  const { data: permissionCatalog } = useGetGroupedPermissionCatalogQuery();
  const [deactivateModerator, { isLoading: isDeactivating }] = useDeactivateModeratorMutation();
  const [reactivateModerator, { isLoading: isReactivating }] = useReactivateModeratorMutation();
  const [pending, setPending] = useState<Moderator | null>(null);
  const [actionError, setActionError] = useState("");

  if (isLoading) {
    return <PageLoader label="মডারেটরদের তালিকা লোড হচ্ছে…" />;
  }

  if (isError) {
    return <ErrorState message="মডারেটরদের তালিকা আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।" error={error} />;
  }

  const moderators = data?.results ?? [];

  return (
    <section className="flex flex-col gap-6">
      {actionError ? (
        <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {actionError}
        </div>
      ) : null}
      {moderators.map((moderator) => {
        const grantedCount =
          permissionCatalog?.groups.filter(({ permissions }) =>
            permissions.every((permission) =>
              moderator.permissions.granted.includes(permission),
            ),
          ).length ?? 0;
        return (
          <div
            key={moderator.id}
            className="flex flex-wrap items-center gap-6 rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]"
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <ShieldCheck size={28} className="text-white" strokeWidth={2} />
            </span>

            <div className="min-w-64 flex-1">
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold text-blue-50">{moderator.full_name}</p>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    moderator.is_active
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                      : "border-red-500/40 bg-red-500/10 text-red-500"
                  }`}
                >
                  {moderator.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail size={14} />
                  {moderator.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone size={14} />
                  {moderator.phone || "—"}
                </span>
                <span className="flex items-center gap-1">
                  <KeyRound size={14} />
                  {grantedCount > 0 ? `${grantedCount}টি ফিচার সক্রিয়` : "কোনো ফিচার অ্যাক্সেস নেই"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onManagePermissions(moderator)}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/5 px-4 py-2.5 text-sm font-semibold text-violet-400 transition-colors duration-200 hover:bg-violet-500/15"
              >
                <KeyRound size={16} />
                অনুমতি পরিচালনা
              </button>

              {moderator.is_active ? (
                <button
                  type="button"
                  onClick={() => setPending(moderator)}
                  title="নিষ্ক্রিয় করুন"
                  className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-500 transition-colors duration-200 hover:bg-amber-500/15"
                >
                  <UserX size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPending(moderator)}
                  title="সক্রিয় করুন"
                  className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-500 transition-colors duration-200 hover:bg-emerald-500/15"
                >
                  <UserCheck size={16} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {moderators.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
          কোনো মডারেটর পাওয়া যায়নি।
        </p>
      )}

      <ConfirmActionDialog
        open={Boolean(pending)}
        title={pending?.is_active ? "মডারেটর নিষ্ক্রিয় করবেন?" : "মডারেটর সক্রিয় করবেন?"}
        message={
          pending?.is_active
            ? `${pending.full_name} সঙ্গে সঙ্গে Admin Panel থেকে sign out হবে এবং পুনরায় সক্রিয় না করা পর্যন্ত কোনো access পাবে না।`
            : `${pending?.full_name ?? "এই মডারেটর"} আবার তার নির্ধারিত featureগুলো ব্যবহার করতে পারবে।`
        }
        confirmLabel={pending?.is_active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
        isLoading={isDeactivating || isReactivating}
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (!pending) return;
          setActionError("");
          try {
            if (pending.is_active) await deactivateModerator(pending.id).unwrap();
            else await reactivateModerator(pending.id).unwrap();
            setPending(null);
          } catch {
            setActionError("মডারেটরের অবস্থা পরিবর্তন করা যায়নি। আবার চেষ্টা করুন।");
          }
        }}
      />
    </section>
  );
}
