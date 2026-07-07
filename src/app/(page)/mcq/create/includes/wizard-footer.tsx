import Link from "next/link";
import { Save, ArrowRight, Check } from "lucide-react";

type Props = {
  step: 1 | 2 | 3;
  published: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPublish: () => void;
};

export default function WizardFooter({ step, published, onPrev, onNext, onPublish }: Props) {
  if (published) return null;

  return (
    <div className="flex items-center justify-between pt-7">
      {step === 1 ? (
        <Link
          href="/mcq"
          className="rounded-2xl border border-slate-800 px-6 py-3 text-base font-semibold text-blue-50"
        >
          বাতিল করুন
        </Link>
      ) : (
        <button
          type="button"
          onClick={onPrev}
          className="rounded-2xl border border-slate-800 px-6 py-3 text-base font-semibold text-blue-50"
        >
          পূর্ববর্তী
        </button>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-2xl border border-slate-800 px-6 py-3 text-base font-semibold text-blue-50"
        >
          <Save size={16} />
          ড্রাফট সংরক্ষণ
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-[0px_0px_40px_-10px_rgba(0,229,200,0.50)]"
          >
            পরবর্তী ধাপ
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onPublish}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-[0px_0px_40px_-10px_rgba(0,229,200,0.50)]"
          >
            <Check size={16} />
            পরীক্ষা প্রকাশ করুন
          </button>
        )}
      </div>
    </div>
  );
}
