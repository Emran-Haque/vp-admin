"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import { navItems } from "./nav-items";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import LogoutConfirmModal from "./logout-confirm-modal";

const ROLE_LABELS: Record<string, string> = {
  admin: "অ্যাডমিন",
  super_admin: "সুপার অ্যাডমিন",
  moderator: "মডারেটর",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/login");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-gray-950/95 border-r border-white/5 md:flex">
      <div className="flex h-24 items-center px-6">
        <Image src="/main_logo_white.png" alt="ভাইয়াদের পাঠশালা" width={188} height={64} className="h-16 w-auto object-contain" priority />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-white/60">
          মেনু
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-gradient-to-br from-teal-500/20 to-blue-500/10 font-semibold text-slate-200"
                  : "text-white/90 hover:bg-white/5"
              }`}
            >
              <span
                className={`flex size-8 items-center justify-center rounded-lg ${
                  isActive ? "bg-white" : "bg-white/5"
                }`}
              >
                <Icon size={16} className={isActive ? "text-blue-500" : "text-white"} />
              </span>
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2.5 border-t border-white/5 px-3 py-4">
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/5 bg-white/5 px-3.5 py-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-blue-500 shadow-[0px_4px_12px_0px_rgba(0,200,150,0.20)]">
            <User size={16} className="text-white" />
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-200">{user?.full_name ?? "—"}</p>
            <p className="text-xs text-white/70">{user ? (ROLE_LABELS[user.role] ?? user.role) : "—"}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="flex w-full items-center gap-2.5 rounded-[10px] border border-red-500/20 bg-red-500/5 px-3.5 py-2.5 text-xs font-medium text-red-500"
        >
          <LogOut size={14} />
          লগআউট
        </button>
      </div>

      {showLogoutConfirm && (
        <LogoutConfirmModal onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} />
      )}
    </aside>
  );
}
