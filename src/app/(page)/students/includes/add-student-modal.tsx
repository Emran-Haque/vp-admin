"use client";

import { useState } from "react";
import { X, Save, AlertTriangle } from "lucide-react";
import { useCreateStudentMutation } from "@/redux/api/studentsApi";
import {
  emptyProfileForm,
  examYearOptions,
  GENDER_OPTIONS,
  toProfilePayload,
  type ProfileFormState,
} from "@/lib/student-profile";

const fieldClass =
  "w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none";
const YEARS = examYearOptions();

export default function AddStudentModal({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isVerified, setIsVerified] = useState(true);
  const [profile, setProfile] = useState<ProfileFormState>(emptyProfileForm);

  const [createStudent, { isLoading, isError }] = useCreateStudentMutation();

  const updateProfile = (field: keyof ProfileFormState, value: string) =>
    setProfile((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    try {
      await createStudent({
        full_name: fullName,
        email: email.trim() || null,
        phone,
        password,
        is_verified: isVerified,
        student_profile: toProfilePayload(profile),
      }).unwrap();
      onClose();
    } catch {
      // error state shown inline below
    }
  };

  const canSave = fullName.trim() && phone.trim() && password.length >= 8;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      {/* The form grew past one screen once the profile fields were added, so it
          scrolls rather than overflowing on a laptop or phone. */}
      <div className="max-h-[88vh] w-full max-w-[520px] overflow-y-auto rounded-[20px] border border-white/5 bg-gray-900/75 p-7 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-50">নতুন শিক্ষার্থী যোগ করুন</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 pt-6">
          {isError && (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-500">শিক্ষার্থী তৈরি করা যায়নি। তথ্য ও API সার্ভার সংযোগ যাচাই করুন।</p>
            </div>
          )}

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">পূর্ণ নাম</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="যেমন: করিম আহমেদ"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">ইমেইল (ঐচ্ছিক)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">ফোন</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01700000000"
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">পাসওয়ার্ড</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="৮ বা তার বেশি অক্ষর"
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
              />
              <p className="mt-1.5 text-[11px] text-slate-500">কমপক্ষে ৮ অক্ষর।</p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-3.5">
            <p className="pb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              প্রোফাইল তথ্য (ঐচ্ছিক)
            </p>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block pb-1.5 text-xs font-semibold text-slate-400">
                  অভিভাবকের ফোন
                </label>
                <input
                  type="text"
                  value={profile.guardian_phone}
                  onChange={(e) => updateProfile("guardian_phone", e.target.value)}
                  placeholder="01700000000"
                  className={fieldClass}
                />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  এই নম্বরেই রেজাল্টের SMS যাবে।
                </p>
              </div>

              <div>
                <label className="block pb-1.5 text-xs font-semibold text-slate-400">
                  প্রতিষ্ঠানের নাম
                </label>
                <input
                  type="text"
                  value={profile.institution}
                  onChange={(e) => updateProfile("institution", e.target.value)}
                  placeholder="যেমন: ঢাকা কলেজ"
                  className={fieldClass}
                />
              </div>

              <div>
                <label className="block pb-1.5 text-xs font-semibold text-slate-400">জেন্ডার</label>
                <select
                  value={profile.gender}
                  onChange={(e) => updateProfile("gender", e.target.value)}
                  className={fieldClass}
                >
                  <option value="">নির্বাচন করুন</option>
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block pb-1.5 text-xs font-semibold text-slate-400">
                  HSC পরীক্ষার বছর
                </label>
                <select
                  value={profile.hsc_year}
                  onChange={(e) => updateProfile("hsc_year", e.target.value)}
                  className={fieldClass}
                >
                  <option value="">নির্বাচন করুন</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-[10px] border border-slate-400/20 bg-slate-400/5 px-4 py-2 text-xs font-bold text-slate-400"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || !canSave}
              className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0px_4px_12px_0px_rgba(0,200,150,0.19)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} />
              {isLoading ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
