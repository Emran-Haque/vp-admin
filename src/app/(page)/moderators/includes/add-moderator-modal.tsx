"use client";

import { useState } from "react";
import { X, Save, AlertTriangle, Search, UserPlus, ShieldCheck } from "lucide-react";
import { useCreateModeratorMutation, usePromoteToModeratorMutation } from "@/redux/api/moderatorsApi";
import { useGetStudentsQuery } from "@/redux/api/studentsApi";

type Mode = "new" | "existing";

export default function AddModeratorModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("new");

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const [createModerator, { isLoading: isCreating, isError: isCreateError }] =
    useCreateModeratorMutation();
  const [promoteToModerator, { isLoading: isPromoting, isError: isPromoteError }] =
    usePromoteToModeratorMutation();

  const { data: studentsData, isFetching: isSearching } = useGetStudentsQuery(
    { search: studentSearch || undefined },
    { skip: mode !== "existing" }
  );
  const students = studentsData?.results ?? [];

  const handleCreate = async () => {
    try {
      await createModerator({ email, full_name: fullName, phone, password }).unwrap();
      onClose();
    } catch {
      // error state shown inline below
    }
  };

  const handlePromote = async () => {
    if (selectedStudentId == null) return;
    try {
      await promoteToModerator(selectedStudentId).unwrap();
      onClose();
    } catch {
      // error state shown inline below
    }
  };

  const canCreate = email.trim() && fullName.trim() && password.trim().length >= 8;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="flex max-h-[85vh] w-full max-w-[520px] flex-col rounded-[20px] border border-white/5 bg-gray-900/75 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between p-7 pb-0">
          <h2 className="text-base font-bold text-slate-50">নতুন মডারেটর যোগ করুন</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2 px-7 pt-5">
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] px-3.5 py-2.5 text-xs font-bold transition-colors duration-200 ${
              mode === "new" ? "bg-blue-500 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            <UserPlus size={14} />
            নতুন অ্যাকাউন্ট
          </button>
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] px-3.5 py-2.5 text-xs font-bold transition-colors duration-200 ${
              mode === "existing" ? "bg-blue-500 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            <ShieldCheck size={14} />
            বিদ্যমান শিক্ষার্থী
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-7">
          {mode === "new" ? (
            <>
              {isCreateError && (
                <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <p className="text-xs text-red-500">
                    মডারেটর তৈরি করা যায়নি। তথ্য ও API সার্ভার সংযোগ যাচাই করুন।
                  </p>
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
                <label className="block pb-1.5 text-xs font-semibold text-slate-400">ইমেইল</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mod@example.com"
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
                    placeholder="কমপক্ষে ৮ অক্ষর"
                    className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-400">
                তৈরি করার পর, তালিকায় &ldquo;অনুমতি পরিচালনা&rdquo; থেকে এই মডারেটরের নির্দিষ্ট অ্যাক্সেস (রোল)
                নির্ধারণ করুন।
              </p>
            </>
          ) : (
            <>
              {isPromoteError && (
                <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <p className="text-xs text-red-500">
                    এই শিক্ষার্থীকে মডারেটর করা যায়নি। তথ্য ও API সার্ভার সংযোগ যাচাই করুন।
                  </p>
                </div>
              )}

              <p className="text-xs text-slate-400">
                একজন বিদ্যমান শিক্ষার্থীকে খুঁজে বের করে সরাসরি মডারেটর হিসেবে অ্যাক্সেস দিন — তার লগইন
                (ইমেইল/পাসওয়ার্ড) অপরিবর্তিত থাকবে।
              </p>

              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setSelectedStudentId(null);
                  }}
                  placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
                  className="w-full rounded-[10px] border border-white/10 bg-white/5 py-2.5 pl-9 pr-3.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                {isSearching && <p className="py-3 text-center text-xs text-slate-400">খোঁজা হচ্ছে…</p>}

                {!isSearching && studentSearch && students.length === 0 && (
                  <p className="py-3 text-center text-xs text-slate-400">কোনো শিক্ষার্থী পাওয়া যায়নি।</p>
                )}

                {!isSearching &&
                  students.map((student) => (
                    <label
                      key={student.id}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5 transition-colors duration-200 ${
                        selectedStudentId === student.id
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="promote-student"
                        checked={selectedStudentId === student.id}
                        onChange={() => setSelectedStudentId(student.id)}
                        className="size-4 cursor-pointer accent-blue-500"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-200">{student.full_name}</p>
                        <p className="truncate text-xs text-slate-400">{student.email}</p>
                      </div>
                    </label>
                  ))}
              </div>
            </>
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
          {mode === "new" ? (
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating || !canCreate}
              className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0px_4px_12px_0px_rgba(0,200,150,0.19)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} />
              {isCreating ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePromote}
              disabled={isPromoting || selectedStudentId == null}
              className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0px_4px_12px_0px_rgba(0,200,150,0.19)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldCheck size={14} />
              {isPromoting ? "প্রক্রিয়াধীন…" : "মডারেটর করুন"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
