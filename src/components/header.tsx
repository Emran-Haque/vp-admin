"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell, User } from "lucide-react";
import { navItems } from "./nav-items";

export default function Header() {
  const pathname = usePathname();
  const current = navItems.find((item) => item.href === pathname);

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
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-[10px] font-bold text-white">
            ৮
          </span>
        </button>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-pink-500 to-blue-500 shadow-[0px_4px_12px_0px_rgba(0,200,150,0.20)]"
        >
          <User size={16} className="text-white" />
        </button>
      </div>
    </header>
  );
}
