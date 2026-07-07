import { ChevronRight } from "lucide-react";

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
      <button
        type="button"
        onClick={onPrev}
        disabled={step === 1}
        className="rounded-2xl border border-slate-800 px-6 py-3 text-base font-semibold text-blue-50 disabled:opacity-40"
      >
        পূর্ববর্তী
      </button>

      {step < 3 ? (
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-[0px_0px_40px_-10px_rgba(0,229,200,0.50)]"
        >
          পরবর্তী
          <ChevronRight size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onPublish}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-[0px_0px_40px_-10px_rgba(0,229,200,0.50)]"
        >
          কোর্স প্রকাশ করুন
        </button>
      )}
    </div>
  );
}
