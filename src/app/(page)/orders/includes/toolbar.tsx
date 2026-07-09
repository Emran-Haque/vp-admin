"use client";

import { Search } from "lucide-react";
import { orderStatuses, paymentStatuses } from "./status-config";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  paymentStatus: string;
  onPaymentStatusChange: (value: string) => void;
  orderStatus: string;
  onOrderStatusChange: (value: string) => void;
};

export default function Toolbar({
  search,
  onSearchChange,
  paymentStatus,
  onPaymentStatusChange,
  orderStatus,
  onOrderStatusChange,
}: Props) {
  return (
    <section className="flex flex-wrap items-center gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="relative min-w-64 flex-1">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="অর্ডার নং বা ইমেইল দিয়ে খুঁজুন..."
          className="w-full rounded-xl border border-slate-800 bg-gray-800 py-3 pl-11 pr-4 text-base text-white placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <select
        value={paymentStatus}
        onChange={(e) => onPaymentStatusChange(e.target.value)}
        className="cursor-pointer rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-white focus:outline-none"
      >
        <option value="">সব পেমেন্ট স্ট্যাটাস</option>
        {paymentStatuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        value={orderStatus}
        onChange={(e) => onOrderStatusChange(e.target.value)}
        className="cursor-pointer rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-white focus:outline-none"
      >
        <option value="">সব অর্ডার স্ট্যাটাস</option>
        {orderStatuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </section>
  );
}
