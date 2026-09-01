"use client";

import { useState } from "react";
import { X, Save, AlertTriangle, CheckCircle2, Circle, Phone, MapPin, Tag, XCircle } from "lucide-react";
import { useUpdateOrderStatusMutation, type Order } from "@/redux/api/ordersApi";
import { CANCELLED_STATUS, orderStatuses, orderStatusLabel, paymentStatuses } from "./status-config";
import { usePermissions } from "@/hooks/use-permissions";

function itemTypeLabel(itemType: string) {
  if (itemType === "course") return "কোর্স";
  if (itemType === "mcq_batch") return "পরীক্ষা ব্যাচ";
  return "বই";
}

export default function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [orderStatus, setOrderStatus] = useState(order.order_status);
  const [transactionId, setTransactionId] = useState(order.transaction_id);
  const [adminNote, setAdminNote] = useState(order.admin_note);

  const [updateOrderStatus, { isLoading, isError }] = useUpdateOrderStatusMutation();
  const { hasPermission } = usePermissions();
  const canUpdateStatus = hasPermission("can_update_order_status");

  // The API decides which moves are legal and sends them with the order, so the
  // dropdown can never offer something that would come back as a 400.
  const options = [
    { value: order.order_status, label: orderStatusLabel(order.order_status) },
    ...(order.allowed_transitions ?? []).map((value) => ({
      value,
      label: orderStatusLabel(value),
    })),
  ];
  const isCancelling = orderStatus === CANCELLED_STATUS.value;
  const isFinal = (order.allowed_transitions ?? []).length === 0;

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-800/95 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-[640px] flex-col rounded-t-[20px] border border-white/5 bg-gray-900/75 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)] sm:max-h-[85vh] sm:rounded-[20px]">
        <div className="flex items-center justify-between gap-3 p-5 pb-0 sm:p-7 sm:pb-0">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-slate-50">অর্ডার {order.order_number}</h2>
            <p className="mt-0.5 truncate text-xs text-slate-400">{order.user_email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5 sm:p-7">
          {isError && (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-500">স্ট্যাটাস আপডেট করা যায়নি। তথ্য ও API সার্ভার সংযোগ যাচাই করুন।</p>
            </div>
          )}

          {order.order_status === CANCELLED_STATUS.value ? (
            // A cancelled order half-way along the rail reads as "in progress",
            // so it gets its own banner instead of the stepper.
            <div className="flex shrink-0 items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3.5">
              <XCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-red-300">এই অর্ডারটি বাতিল করা হয়েছে</p>
                {order.admin_note ? (
                  <p className="mt-0.5 break-words text-xs text-slate-400">{order.admin_note}</p>
                ) : null}
              </div>
            </div>
          ) : (
          <div className="-mx-1 flex min-w-0 shrink-0 items-start justify-between gap-1 overflow-x-auto rounded-[10px] border border-white/10 bg-white/5 p-3.5">
            {orderStatuses.map((s, index) => {
              const timelineEntry = order.status_timeline.find((t) => t.status === s.value);
              const done = Boolean(timelineEntry?.at);
              return (
                <div key={s.value} className="flex min-w-0 flex-1 items-center">
                  <div className="flex min-w-[52px] flex-col items-center gap-1">
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
          )}

          <div className="rounded-[10px] border border-white/10 bg-white/5 p-3.5">
            <p className="pb-2 text-xs font-semibold text-slate-400">অর্ডারকৃত আইটেম</p>
            <div className="flex flex-col gap-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-slate-200">{item.title_snapshot}</p>
                    <p className="text-xs text-slate-500">
                      {itemTypeLabel(item.item_type)} • ৳{item.price} × {item.quantity}
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

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
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
                {options.map((s) => (
                  <option key={s.value} value={s.value} className="bg-slate-800 text-slate-200">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isFinal ? (
            <p className="rounded-[10px] border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
              এই অর্ডারটি চূড়ান্ত — স্ট্যাটাস আর পরিবর্তন করা যাবে না।
            </p>
          ) : null}

          {isCancelling ? (
            <div className="flex items-start gap-2 rounded-[10px] border border-amber-500/30 bg-amber-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
              <p className="text-xs leading-relaxed text-amber-300">
                বাতিল করলে বইয়ের স্টক ফেরত যাবে এবং এই অর্ডারে দেওয়া কোর্স/ব্যাচের
                অ্যাক্সেস বন্ধ হবে। ক্রেতাকে জানানো হবে — নিচের নোটটি কারণ হিসেবে যাবে।
              </p>
            </div>
          ) : null}

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
              পেমেন্ট &quot;পেইড&quot; করলে কোর্স/পরীক্ষা ব্যাচের অ্যাক্সেস স্বয়ংক্রিয়ভাবে চালু হবে এবং বইয়ের স্টক কমে যাবে।
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2.5 p-5 pt-0 sm:flex-row sm:justify-end sm:p-7 sm:pt-0">
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
