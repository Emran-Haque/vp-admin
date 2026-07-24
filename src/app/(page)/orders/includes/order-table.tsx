"use client";

import { Eye } from "lucide-react";
import type { Order } from "@/redux/api/ordersApi";
import { orderStatuses, paymentStatuses, orderStatusBadge, paymentStatusBadge, statusLabel } from "./status-config";
import ErrorState from "@/components/error-state";

type Props = {
  orders: Order[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onView: (order: Order) => void;
};

export default function OrderTable({ orders, isLoading, isError, error, onView }: Props) {
  if (isLoading) {
    return <p className="p-8 text-center text-sm text-slate-400">অর্ডারের তালিকা লোড হচ্ছে…</p>;
  }

  if (isError) {
    return (
      <ErrorState message="অর্ডারের তালিকা আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।" error={error} />
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <table className="w-full min-w-[880px] border-collapse text-left">
        <thead>
          <tr className="bg-gray-900/50 text-xs font-medium text-slate-400">
            <th className="px-4 py-3">অর্ডার নং</th>
            <th className="px-4 py-3">গ্রাহক</th>
            <th className="px-4 py-3">আইটেম</th>
            <th className="px-4 py-3">মোট</th>
            <th className="px-4 py-3">পেমেন্ট</th>
            <th className="px-4 py-3">অর্ডার স্ট্যাটাস</th>
            <th className="px-4 py-3">তারিখ</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-t border-slate-800">
              <td className="px-4 py-3.5 text-sm font-semibold text-blue-50">{order.order_number}</td>
              <td className="px-4 py-3.5 text-sm text-slate-300">{order.user_email}</td>
              <td className="px-4 py-3.5 text-sm text-slate-400">
                {order.items.length} টি আইটেম
                {order.items[0] && (
                  <p className="mt-0.5 max-w-40 truncate text-xs text-slate-500">
                    {order.items[0].title_snapshot}
                    {order.items.length > 1 ? ` +${order.items.length - 1}` : ""}
                  </p>
                )}
              </td>
              <td className="px-4 py-3.5 text-sm font-semibold text-blue-50">৳{order.total}</td>
              <td className="px-4 py-3.5">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    paymentStatusBadge[order.payment_status] ?? "bg-slate-500/10 text-slate-400"
                  }`}
                >
                  {statusLabel(paymentStatuses, order.payment_status)}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    orderStatusBadge[order.order_status] ?? "bg-slate-500/10 text-slate-400"
                  }`}
                >
                  {statusLabel(orderStatuses, order.order_status)}
                </span>
              </td>
              <td className="px-4 py-3.5 text-sm text-slate-400">
                {new Date(order.created_at).toLocaleDateString("bn-BD")}
              </td>
              <td className="px-4 py-3.5">
                <button
                  type="button"
                  onClick={() => onView(order)}
                  className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-slate-800 text-blue-50 transition-colors duration-200 hover:bg-white/5"
                >
                  <Eye size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {orders.length === 0 && (
        <p className="p-8 text-center text-sm text-slate-400">কোনো অর্ডার পাওয়া যায়নি।</p>
      )}
    </div>
  );
}
