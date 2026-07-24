"use client";

import { Save } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

type Props = {
  step: 1 | 2 | 3 | 4;
  isSaving: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSave: () => void;
  showSave?: boolean;
};

export default function EditWizardFooter({ step, isSaving, onPrev, onNext, onSave, showSave = true }: Props) {
  const { hasPermission } = usePermissions();

  return (
    <div className="flex items-center justify-between pt-7">
      <button
        type="button"
        onClick={onPrev}
        disabled={step === 1}
        className="rounded-2xl border border-slate-800 px-6 py-3 text-base font-semibold text-blue-50 disabled:opacity-40"
      >
        পূর্ববর্তী
      </button>

      <div className="flex items-center gap-3">
        {step < 4 && (
          <button
            type="button"
            onClick={onNext}
            className="rounded-2xl border border-slate-800 px-6 py-3 text-base font-semibold text-blue-50"
          >
            পরবর্তী
          </button>
        )}

        {showSave && hasPermission("can_edit_course") && (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-[0px_0px_40px_-10px_rgba(0,229,200,0.50)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} />
            {isSaving ? "সংরক্ষণ হচ্ছে…" : "পরিবর্তন সংরক্ষণ করুন"}
          </button>
        )}
      </div>
    </div>
  );
}
