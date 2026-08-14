"use client";

import { useState } from "react";
import { X, Save, AlertTriangle, CheckCircle2, Circle, Phone, MapPin, Tag } from "lucide-react";
import { useUpdateOrderStatusMutation, type Order } from "@/redux/api/ordersApi";
import { orderStatuses, paymentStatuses } from "./status-config";
import { usePermissions } from "@/hooks/use-permissions";

export default function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [orderStatus, setOrderStatus] = useState(order.order_status);
  const [transactionId, setTransactionId] = useState(order.transaction_id);
  const [adminNote, setAdminNote] = useState(order.admin_note);

  const [updateOrderStatus, { isLoading, isError }] = useUpdateOrderStatusMutation();
  const { hasPermission } = usePermissions();
  const canUpdateStatus = hasPermission("can_update_order_status");

  const handleSave = async () => {
    try {
      await updateOrderStatus({
        id: order.id,
        data: {
          payment_status: paymentStatus,
          order_status: orderStatus,
          transaction_id: transactionId,
          admin_note: adminNote,
        },
      }).unwrap();
      onClose();
    } catch {
      // error state shown inline below
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="flex max-h-[85vh] w-full max-w-[640px] flex-col rounded-[20px] border border-white/5 bg-gray-900/75 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between p-7 pb-0">
          <div>
            <h2 className="text-base font-bold text-slate-50">অর্ডার {order.order_number}</h2>
            <p className="mt-0.5 text-xs text-slate-400">{order.user_email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-7">
          {isError && (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-500">স্ট্যাটাস আপডেট করা যায়নি। তথ্য ও API সার্ভার সংযোগ যাচাই করুন।</p>
            </div>
          )}

          <div className="flex items-center justify-between rounded-[10px] border border-white/10 bg-white/5 p-3.5 overflow-x-auto">
            {orderStatuses.map((s, index) => {
              const timelineEntry = order.status_timeline.find((t) => t.status === s.value);
              const done = Boolean(timelineEntry?.at);
              return (
                <div key={s.value} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1">
                    {done ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <Circle size={16} className="text-slate-600" />
                    )}
                    <span className={`whitespace-nowrap text-[10px] ${done ? "text-emerald-500" : "text-slate-500"}`}>
                      {s.label}
                    </span>
                  </div>
                  {index < orderStatuses.length - 1 && (
                    <div className={`mx-1 h-px flex-1 ${done ? "bg-emerald-500/40" : "bg-slate-700"}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-[10px] border border-white/10 bg-white/5 p-3.5">
            <p className="pb-2 text-xs font-semibold text-slate-400">অর্ডারকৃত আইটেম</p>
            <div className="flex flex-col gap-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-slate-200">{item.title_snapshot}</p>
                    <p className="text-xs text-slate-500">
                      {item.item_type === "book" ? "বই" : "কোর্স"} • ৳{item.price} × {item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-blue-50">৳{item.line_total}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-1 border-t border-white/10 pt-3 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>সাবটোটাল</span>
                <span>৳{order.subtotal}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>ছাড়</span>
                  <span>-৳{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-blue-50">
                <span>মোট</span>
                <span>৳{order.total}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm text-slate-300 sm:grid-cols-2">
            {order.customer_phone && (
              <p className="flex items-center gap-1.5">
                <Phone size={14} className="text-slate-500" />
                {order.customer_phone}
              </p>
            )}
            {order.promo_code && (
              <p className="flex items-center gap-1.5">
                <Tag size={14} className="text-slate-500" />
                {order.promo_code}
              </p>
            )}
            {order.shipping_address && (
              <p className="col-span-full flex items-start gap-1.5">
                <MapPin size={14} className="mt-0.5 shrink-0 text-slate-500" />
                {order.shipping_address}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">পেমেন্ট স্ট্যাটাস</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                disabled={!canUpdateStatus}
                className="w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {paymentStatuses.map((s) => (
                  <option key={s.value} value={s.value} className="bg-slate-800 text-slate-200">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">অর্ডার স্ট্যাটাস</label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                disabled={!canUpdateStatus}
                className="w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {orderStatuses.map((s) => (
                  <option key={s.value} value={s.value} className="bg-slate-800 text-slate-200">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">ট্রানজেকশন আইডি</label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="যেমন: TXN123456"
              disabled={!canUpdateStatus}
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">অ্যাডমিন নোট</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="যেমন: বিকাশ স্টেটমেন্ট দিয়ে যাচাই করা হয়েছে"
              rows={2}
              disabled={!canUpdateStatus}
              className="w-full resize-none rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {paymentStatus === "paid" && order.payment_status !== "paid" && (
            <p className="text-xs text-amber-500">
              পেমেন্ট &quot;পেইড&quot; করলে কোর্স আইটেম স্বয়ংক্রিয়ভাবে এনরোল হবে এবং বইয়ের স্টক কমে যাবে।
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2.5 p-7 pt-0">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-[10px] border border-slate-400/20 bg-slate-400/5 px-4 py-2 text-xs font-bold text-slate-400"
          >
            বাতিল
          </button>
          {canUpdateStatus && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0px_4px_12px_0px_rgba(0,200,150,0.19)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} />
              {isLoading ? "সংরক্ষণ হচ্ছে…" : "স্ট্যাটাস আপডেট করুন"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
