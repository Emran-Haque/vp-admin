import type { Student } from "@/redux/api/studentsApi";

export type StudentStatus = "active" | "inactive" | "pending";

export function statusOf(student: Student): StudentStatus {
  if (!student.is_active) return "inactive";
  if (!student.is_verified) return "pending";
  return "active";
}

export const studentStatusStyles: Record<StudentStatus, { label: string; className: string }> = {
  active: { label: "সক্রিয়", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" },
  inactive: { label: "নিষ্ক্রিয়", className: "border-red-500/40 bg-red-500/10 text-red-500" },
  pending: { label: "পেন্ডিং", className: "border-amber-500/40 bg-amber-500/10 text-amber-500" },
};
