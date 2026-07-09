"use client";

import { ShoppingCart, CheckCircle2, Clock, Wallet, type LucideIcon } from "lucide-react";
import { useGetAdminDashboardQuery } from "@/redux/api/dashboardApi";

type Stat = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  card: string;
  text: string;
};

export default function Stats() {
  const { data, isLoading, isError } = useGetAdminDashboardQuery();
  const placeholder = isLoading ? "…" : isError ? "—" : 0;

  const stats: Stat[] = [
    {
      label: "মোট অর্ডার",
      value: data?.ecommerce.total_orders ?? placeholder,
      icon: ShoppingCart,
      card: "border-blue-500/40 bg-blue-500/10",
      text: "text-blue-500",
    },
    {
      label: "পরিশোধিত অর্ডার",
      value: data?.ecommerce.paid_orders ?? placeholder,
      icon: CheckCircle2,
      card: "border-emerald-500/40 bg-emerald-500/10",
      text: "text-emerald-500",
    },
    {
      label: "অপেক্ষমান অর্ডার",
      value: data?.ecommerce.pending_orders ?? placeholder,
      icon: Clock,
      card: "border-amber-500/40 bg-amber-500/10",
      text: "text-amber-500",
    },
    {
      label: "মোট আয়",
      value: data ? `৳${data.ecommerce.revenue}` : placeholder,
      icon: Wallet,
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
