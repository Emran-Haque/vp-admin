"use client";

import { X, LogOut } from "lucide-react";

type LogoutConfirmModalProps = {
  onConfirm: () => void;
  onCancel: () => void;
};

export default function LogoutConfirmModal({ onConfirm, onCancel }: LogoutConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="relative w-full max-w-[360px] rounded-[24px] border border-white/5 bg-gray-900/90 p-7 text-center shadow-[0px_15px_30px_0px_rgba(59,130,246,0.30)]">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-lg bg-white/5 text-slate-400"
        >
          <X size={16} />
        </button>

        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-blue-500 shadow-[0px_4px_12px_0px_rgba(0,200,150,0.20)]">
          <LogOut size={26} className="text-white" />
        </div>

        <h2 className="mt-5 text-lg font-bold text-slate-50">আপনি কি লগআউট করছেন?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          আপনি যেকোনো সময় আবার লগইন করতে পারবেন। আপনার সংরক্ষিত তথ্য নিরাপদ থাকবে।
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-200"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full bg-gradient-to-br from-red-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0px_4px_12px_0px_rgba(239,68,68,0.30)]"
          >
            লগআউট
          </button>
        </div>
      </div>
    </div>
  );
}
