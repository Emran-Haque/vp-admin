"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Smartphone, Users } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { usePendingLoginRequests } from "@/hooks/use-pending-login-requests";

/**
 * "সব শিক্ষার্থী | লগইন রিকোয়েস্ট" at the top of the শিক্ষার্থী section. Hidden
 * entirely for staff who may not see login requests, so their students page
 * looks exactly as before.
 */
export default function StudentsTabs() {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();
  const pending = usePendingLoginRequests();

  if (!hasPermission("can_view_login_requests")) return null;

  const tabs = [
    { href: "/students", label: "সব শিক্ষার্থী", Icon: Users, badge: 0 },
    { href: "/students/login-requests", label: "লগইন রিকোয়েস্ট", Icon: Smartphone, badge: pending },
  ];

  return (
    <nav
      aria-label="শিক্ষার্থী বিভাগ"
      className="flex w-full gap-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 p-1 sm:w-fit"
    >
      {tabs.map(({ href, label, Icon, badge }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              isActive ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon size={15} />
            {label}
            {badge > 0 ? (
              <span className="min-w-5 rounded-full bg-amber-500 px-1.5 py-0.5 text-center text-[11px] font-bold text-gray-950">
                {badge.toLocaleString("bn-BD")}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
