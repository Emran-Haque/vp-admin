"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Bell, User, X, Mail, Phone, Shield, type LucideIcon } from "lucide-react";
import { navItems } from "./nav-items";
import { useAppSelector } from "@/redux/hooks";
import { useGetAdminDashboardQuery } from "@/redux/api/dashboardApi";
import { useGetProfileQuery } from "@/redux/api/authApi";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "সুপার অ্যাডমিন",
  admin: "অ্যাডমিন",
  moderator: "মডারেটর",
  student: "শিক্ষার্থী",
};

export default function Header() {
  const pathname = usePathname();
  const current = navItems.find((item) => item.href === pathname);
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === "super_admin";
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Live unread count (replaces the old hardcoded badge). Reuses the cached
  // admin-dashboard query the home page already loads.
  const { data: dashboard } = useGetAdminDashboardQuery();
  const unread = dashboard?.unread_notifications ?? 0;

  // Only the super admin's drawer needs the full profile (incl. phone).
  const { data: profile } = useGetProfileQuery(undefined, {
    skip: !isSuperAdmin || !drawerOpen,
  });

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/5 bg-gray-950/90 px-5">
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-[10px] border border-white/5 bg-white/5"
        >
          <Menu size={16} className="text-white" />
        </button>
        <div className="flex items-center gap-1.5 text-xs text-white">
          <span>ভাইয়াদের পাঠশালা</span>
          <span className="text-base">/</span>
          <span className="font-medium">{current?.label ?? "ড্যাশবোর্ড"}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-[10px] border border-white/5 bg-white/5"
        >
          <Bell size={16} className="text-white" />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 px-1 text-[10px] font-bold text-white">
              {unread.toLocaleString("bn-BD")}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => {
            if (isSuperAdmin) setDrawerOpen(true);
          }}
          className={`flex size-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-pink-500 to-blue-500 shadow-[0px_4px_12px_0px_rgba(0,200,150,0.20)] ${
            isSuperAdmin ? "cursor-pointer" : ""
          }`}
          aria-label="প্রোফাইল"
        >
          <User size={16} className="text-white" />
        </button>
      </div>

      {isSuperAdmin && drawerOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-50 flex h-full w-[320px] max-w-[85vw] flex-col border-l border-white/10 bg-gray-950 p-5 shadow-[-20px_0_60px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">প্রোফাইল</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg bg-white/5 text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center text-center">
              <span className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-pink-500 to-blue-500">
                <User size={26} className="text-white" />
              </span>
              <p className="mt-3 text-lg font-bold text-white">
                {profile?.full_name ?? user?.full_name}
              </p>
              <span className="mt-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-xs font-bold text-blue-300">
                {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
              </span>
            </div>

            <div className="mt-6 space-y-2.5">
              <InfoRow icon={Mail} label="ইমেইল" value={profile?.email ?? user?.email ?? "—"} />
              <InfoRow icon={Phone} label="মোবাইল" value={profile?.phone || "—"} />
              <InfoRow
                icon={Shield}
                label="ভূমিকা"
                value={ROLE_LABELS[user?.role ?? ""] ?? user?.role ?? "—"}
              />
            </div>
          </aside>
        </>
      ) : null}
    </header>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-blue-300">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-400">{label}</p>
        <p className="truncate text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
