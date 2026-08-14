"use client";

import { useState } from "react";
import {
  X,
  Save,
  Pencil,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  BookMarked,
  MapPin,
} from "lucide-react";
import {
  useGetStudentQuery,
  useUpdateStudentMutation,
  useGetStudentEnrollmentsQuery,
} from "@/redux/api/studentsApi";
import { usePermissions } from "@/hooks/use-permissions";
import { statusOf, studentStatusStyles } from "@/lib/student-status";

const PROFILE_FIELDS: { key: keyof ProfileFormState; label: string; placeholder: string }[] = [
  { key: "batch", label: "ব্যাচ", placeholder: "যেমন: HSC 26" },
  { key: "session", label: "সেশন", placeholder: "যেমন: ২০২৫-২৬" },
  { key: "institution", label: "প্রতিষ্ঠান", placeholder: "যেমন: ঢাকা কলেজ" },
  { key: "admission_unit", label: "ভর্তি ইউনিট", placeholder: "যেমন: বিজ্ঞান" },
  { key: "group", label: "গ্রুপ", placeholder: "যেমন: বিজ্ঞান" },
  { key: "guardian_phone", label: "অভিভাবকের ফোন", placeholder: "01700000000" },
];

type ProfileFormState = {
  batch: string;
  session: string;
  institution: string;
  admission_unit: string;
  group: string;
  address: string;
  guardian_phone: string;
};

export default function StudentDetailModal({
  studentId,
  onClose,
}: {
  studentId: number;
  onClose: () => void;
}) {
  const { data: student, isLoading, isError } = useGetStudentQuery(studentId);
  const { data: enrollments } = useGetStudentEnrollmentsQuery(studentId);
  const [updateStudent, { isLoading: isSaving, isError: isSaveError }] = useUpdateStudentMutation();
  const { hasPermission } = usePermissions();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isVerified, setIsVerified] = useState(true);
  const [profile, setProfile] = useState<ProfileFormState>({
    batch: "",
    session: "",
    institution: "",
    admission_unit: "",
    group: "",
    address: "",
    guardian_phone: "",
  });

  const startEditing = () => {
    if (!student) return;
    setFullName(student.full_name);
    setEmail(student.email);
    setPhone(student.phone);
    setIsVerified(student.is_verified);
    setProfile({
      batch: student.student_profile?.batch ?? "",
      session: student.student_profile?.session ?? "",
      institution: student.student_profile?.institution ?? "",
      admission_unit: student.student_profile?.admission_unit ?? "",
      group: student.student_profile?.group ?? "",
      address: student.student_profile?.address ?? "",
      guardian_phone: student.student_profile?.guardian_phone ?? "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateStudent({
        id: studentId,
        data: {
          full_name: fullName,
          email,
          phone,
          is_verified: isVerified,
          student_profile: profile,
        },
      }).unwrap();
      setIsEditing(false);
    } catch {
      // error state shown inline below
    }
  };

  const canSave = fullName.trim() && email.trim() && phone.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="flex max-h-[85vh] w-full max-w-[640px] flex-col rounded-[20px] border border-white/5 bg-gray-900/75 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between p-7 pb-0">
          <h2 className="text-base font-bold text-slate-50">
            {isEditing ? "শিক্ষার্থী সম্পাদনা করুন" : "শিক্ষার্থীর বিস্তারিত তথ্য"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-7">
          {isLoading && <p className="text-center text-sm text-slate-400">তথ্য লোড হচ্ছে…</p>}

          {isError && (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-500">শিক্ষার্থীর তথ্য আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ যাচাই করুন।</p>
            </div>
          )}

          {isSaveError && (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-500">তথ্য সংরক্ষণ করা যায়নি। ইনপুট যাচাই করুন।</p>
            </div>
          )}

          {student && !isEditing && (
            <>
              <div className="flex items-center gap-4">
                <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500">
                  <GraduationCap size={28} className="text-white" strokeWidth={2} />
                </span>
                <div>
                  <div className="flex items-center gap-2.5">
                    <p className="text-lg font-semibold text-blue-50">{student.full_name}</p>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        studentStatusStyles[statusOf(student)].className
                      }`}
                    >
                      {studentStatusStyles[statusOf(student)].label}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    <Calendar size={12} />
                    যোগদান: {new Date(student.created_at).toLocaleDateString("bn-BD")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 rounded-[10px] border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <Mail size={13} /> ইমেইল
                  </p>
                  <p className="pt-1 text-sm text-slate-200">{student.email}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <Phone size={13} /> ফোন
                  </p>
                  <p className="pt-1 text-sm text-slate-200">{student.phone || "—"}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <BookMarked size={13} /> ব্যাচ
                  </p>
                  <p className="pt-1 text-sm text-slate-200">{student.student_profile?.batch || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">সেশন</p>
                  <p className="pt-1 text-sm text-slate-200">{student.student_profile?.session || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">প্রতিষ্ঠান</p>
                  <p className="pt-1 text-sm text-slate-200">{student.student_profile?.institution || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">ভর্তি ইউনিট</p>
                  <p className="pt-1 text-sm text-slate-200">{student.student_profile?.admission_unit || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">গ্রুপ</p>
                  <p className="pt-1 text-sm text-slate-200">{student.student_profile?.group || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">অভিভাবকের ফোন</p>
                  <p className="pt-1 text-sm text-slate-200">{student.student_profile?.guardian_phone || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <MapPin size={13} /> ঠিকানা
                  </p>
                  <p className="pt-1 text-sm text-slate-200">{student.student_profile?.address || "—"}</p>
                </div>
              </div>

              <div>
                <p className="pb-2 text-xs font-semibold text-slate-400">এনরোলকৃত কোর্সসমূহ</p>
                <div className="flex flex-col gap-2">
                  {(enrollments?.results ?? []).map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5"
                    >
                      <p className="text-sm text-slate-200">{enrollment.course_detail.title}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(enrollment.enrolled_at).toLocaleDateString("bn-BD")}
                      </p>
                    </div>
                  ))}
                  {enrollments && enrollments.results.length === 0 && (
                    <p className="rounded-[10px] border border-dashed border-slate-800 p-4 text-center text-xs text-slate-400">
                      কোনো কোর্সে এনরোল করা হয়নি।
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {student && isEditing && (
            <>
              <div>
                <label className="block pb-1.5 text-xs font-semibold text-slate-400">পূর্ণ নাম</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block pb-1.5 text-xs font-semibold text-slate-400">ইমেইল</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block pb-1.5 text-xs font-semibold text-slate-400">ফোন</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {PROFILE_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label className="block pb-1.5 text-xs font-semibold text-slate-400">{field.label}</label>
                    <input
                      type="text"
                      value={profile[field.key]}
                      onChange={(e) => setProfile((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block pb-1.5 text-xs font-semibold text-slate-400">ঠিকানা</label>
                <textarea
                  value={profile.address}
                  onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))}
                  rows={2}
                  className="w-full resize-none rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="size-4 cursor-pointer accent-blue-500"
                />
                <span className="text-xs font-medium text-slate-400">অ্যাকাউন্ট ভেরিফায়েড হিসেবে চিহ্নিত করুন</span>
              </label>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2.5 p-7 pt-0">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="cursor-pointer rounded-[10px] border border-slate-400/20 bg-slate-400/5 px-4 py-2 text-xs font-bold text-slate-400"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !canSave}
                className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0px_4px_12px_0px_rgba(0,200,150,0.19)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={14} />
                {isSaving ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-[10px] border border-slate-400/20 bg-slate-400/5 px-4 py-2 text-xs font-bold text-slate-400"
              >
                বন্ধ করুন
              </button>
              {hasPermission("can_edit_student") && student && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0px_4px_12px_0px_rgba(0,200,150,0.19)]"
                >
                  <Pencil size={14} />
                  সম্পাদনা করুন
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
