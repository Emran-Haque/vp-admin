import { ChevronRight, FileEdit, Send } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

type Props = {
  step: 1 | 2 | 3 | 4;
  published: boolean;
  isSubmitting?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
};

export default function WizardFooter({
  step,
  published,
  isSubmitting,
  onPrev,
  onNext,
  onSaveDraft,
  onPublish,
}: Props) {
  const { hasPermission } = usePermissions();

  if (published) return null;

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
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-2xl border border-slate-800 px-6 py-3 text-base font-semibold text-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FileEdit size={16} />
          খসড়া সংরক্ষণ করুন
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-[0px_0px_40px_-10px_rgba(0,229,200,0.50)]"
          >
            পরবর্তী
            <ChevronRight size={16} />
          </button>
        ) : (
          hasPermission("can_publish_course") && (
            <button
              type="button"
              onClick={onPublish}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-[0px_0px_40px_-10px_rgba(0,229,200,0.50)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={16} />
              কোর্স প্রকাশ করুন
            </button>
          )
        )}
      </div>
    </div>
  );
}
