"use client";

import { ShieldCheck, UserCheck, KeyRound, type LucideIcon } from "lucide-react";
import { useGetModeratorsQuery } from "@/redux/api/moderatorsApi";

type Stat = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  card: string;
  text: string;
};

export default function Stats() {
  const { data, isLoading, isError } = useGetModeratorsQuery();
  const placeholder = isLoading ? "…" : isError ? "—" : 0;

  const moderators = data?.results ?? [];
  const activeCount = moderators.filter((m) => m.is_active).length;
  const withAccessCount = moderators.filter((m) => m.permissions.granted.length > 0).length;

  const stats: Stat[] = [
    {
      label: "মোট মডারেটর",
      value: data?.count ?? placeholder,
      icon: ShieldCheck,
      card: "border-violet-500/40 bg-violet-500/10",
      text: "text-violet-500",
    },
    {
      label: "সক্রিয়",
      value: data ? activeCount : placeholder,
      icon: UserCheck,
      card: "border-emerald-500/40 bg-emerald-500/10",
      text: "text-emerald-500",
    },
    {
      label: "অনুমতিপ্রাপ্ত",
      value: data ? withAccessCount : placeholder,
      icon: KeyRound,
      card: "border-cyan-500/40 bg-cyan-500/10",
      text: "text-cyan-500",
    },
  ];

  return (
    <section className="flex flex-wrap gap-6">
      {stats.map(({ label, value, icon: Icon, card, text }) => (
        <div key={label} className={`w-64 rounded-3xl border p-4 ${card}`}>
          <div className="flex items-center justify-between opacity-80">
            <Icon size={24} className={text} />
            <span className={`text-2xl font-bold leading-7 ${text}`}>{value}</span>
          </div>
          <p className={`mt-2 text-xs opacity-80 ${text}`}>{label}</p>
        </div>
      ))}
    </section>
  );
}
