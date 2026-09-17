"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, KeyRound, Table2, Wallet } from "lucide-react";

const tabs = [
  { href: "/ledger", label: "সব লেজার", icon: Wallet },
  { href: "/ledger/entry", label: "দ্রুত এন্ট্রি", icon: Table2 },
  { href: "/ledger/overdue", label: "ওভারডিউ", icon: AlertTriangle },
  { href: "/ledger/codes", label: "কোড হিস্ট্রি", icon: KeyRound },
];

export default function LedgerTabs() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-800">
      {tabs.map((tab) => {
        // "/ledger" must not light up for every child route.
        const active = tab.href === "/ledger" ? pathname === "/ledger" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm no-underline ${
              active
                ? "border-b-2 border-sky-500 font-medium text-slate-100"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
