"use client";

import { Users, Award, type LucideIcon } from "lucide-react";
import { useGetAdminDashboardQuery } from "@/redux/api/dashboardApi";
import { useGetStudentsQuery } from "@/redux/api/studentsApi";

type Stat = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  card: string;
  iconColor: string;
  valueColor: string;
};

/** The two student counts as compact chips, shown inside the page's header card. */
export default function Stats() {
  const { data: dashboardData, isLoading: isLoadingDashboard } = useGetAdminDashboardQuery();
  const { data: allStudentsData, isLoading: isLoadingAll } = useGetStudentsQuery();
  const { data: activeStudentsData, isLoading: isLoadingActive } = useGetStudentsQuery({
    is_active: true,
    is_verified: true,
  });

  const isLoading = isLoadingDashboard && isLoadingAll && isLoadingActive;

  const totalStudents = allStudentsData?.count ?? dashboardData?.students.total ?? (isLoading ? "…" : 0);
  const activeStudents = activeStudentsData?.count ?? dashboardData?.students.active ?? (isLoading ? "…" : 0);

  const stats: Stat[] = [
    {
      label: "মোট শিক্ষার্থী",
      value: totalStudents,
      icon: Users,
      card: "border-cyan-500/30 bg-cyan-500/10",
      iconColor: "text-cyan-400",
      valueColor: "text-cyan-300",
    },
    {
      label: "সক্রিয়",
      value: activeStudents,
      icon: Award,
      card: "border-emerald-500/30 bg-emerald-500/10",
      iconColor: "text-emerald-400",
      valueColor: "text-emerald-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 lg:flex lg:gap-3">
      {stats.map(({ label, value, icon: Icon, card, iconColor, valueColor }) => (
        <div
          key={label}
          className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 lg:min-w-[150px] ${card}`}
        >
          <Icon className={`size-4 shrink-0 ${iconColor}`} />
          <span className="min-w-0 truncate text-xs font-medium text-slate-300">{label}</span>
          <span className={`ml-auto text-lg font-bold leading-6 tabular-nums ${valueColor}`}>{value}</span>
        </div>
      ))}
    </div>
  );
}
