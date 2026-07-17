"use client";

import type { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-white/5">
        <Icon size={24} className="text-slate-400" />
      </span>
      <p className="text-base font-semibold text-blue-50">{title}</p>
      <p className="text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}
