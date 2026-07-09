export const orderStatuses = [
  { value: "pending", label: "অপেক্ষমান" },
  { value: "confirmed", label: "নিশ্চিত" },
  { value: "processing", label: "প্রক্রিয়াধীন" },
  { value: "shipped", label: "পাঠানো হয়েছে" },
  { value: "completed", label: "সম্পন্ন" },
];

export const paymentStatuses = [
  { value: "pending", label: "অপেক্ষমান" },
  { value: "paid", label: "পরিশোধিত" },
  { value: "failed", label: "ব্যর্থ" },
  { value: "refunded", label: "ফেরত" },
];

export const orderStatusBadge: Record<string, string> = {
  pending: "bg-slate-500/10 text-slate-400",
  confirmed: "bg-blue-500/10 text-blue-500",
  processing: "bg-amber-500/10 text-amber-500",
  shipped: "bg-cyan-500/10 text-cyan-500",
  completed: "bg-emerald-500/10 text-emerald-500",
};

export const paymentStatusBadge: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500",
  paid: "bg-emerald-500/10 text-emerald-500",
  failed: "bg-red-500/10 text-red-500",
  refunded: "bg-violet-500/10 text-violet-500",
};

export function statusLabel(list: { value: string; label: string }[], value: string): string {
  return list.find((s) => s.value === value)?.label ?? value;
}
