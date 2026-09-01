import { ListChecks, Trash2, CheckCircle2, HelpCircle } from "lucide-react";
import type { Question } from "./types";

const optionLabels = ["ক", "খ", "গ", "ঘ"];

type Props = {
  question: Question;
  index: number;
  /** The exam's default mark, shown as the placeholder when this question
   *  carries no override of its own. */
  defaultMarks: string;
  onChange: (question: Question) => void;
  onDelete: () => void;
};

export default function QuestionEditor({
  question,
  index,
  defaultMarks,
  onChange,
  onDelete,
}: Props) {
  const setText = (text: string) => onChange({ ...question, text });
  const setOption = (i: number, value: string) => {
    const options = [...question.options];
    options[i] = value;
    onChange({ ...question, options });
  };
  const setCorrect = (i: number) => onChange({ ...question, correctIndex: i });
  const setExplanation = (explanation: string) => onChange({ ...question, explanation });
  // Blank is meaningful — it means "inherit the exam default" — so the raw
  // string is kept rather than coerced to a number here.
  const setMarks = (marks: string) => onChange({ ...question, marks });

  const effectiveMarks = question.marks.trim() || defaultMarks;
  const isOverridden = question.marks.trim() !== "" && question.marks.trim() !== defaultMarks;

  return (
    <section className="flex-1 rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20">
            <ListChecks size={24} className="text-white" />
          </span>
          <div>
            <h2 className="text-xl font-bold leading-8 text-blue-50">প্রশ্ন #{index + 1}</h2>
            <p className="mt-0.5 text-base text-slate-400">
              প্রশ্ন, চারটি অপশন আর সঠিক উত্তর দিন · এই প্রশ্নটি {effectiveMarks} নম্বরের
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <label
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 ${
              isOverridden
                ? "border-amber-400/50 bg-amber-400/10"
                : "border-slate-800 bg-gray-800"
            }`}
            title="এই প্রশ্নের নম্বর। খালি রাখলে পরীক্ষার ডিফল্ট নম্বরটাই ধরা হবে।"
          >
            <span
              className={`text-sm font-medium ${
                isOverridden ? "text-amber-200" : "text-slate-400"
              }`}
            >
              নম্বর
            </span>
            <input
              type="number"
              min="1"
              step="1"
              value={question.marks}
              onChange={(e) => setMarks(e.target.value)}
              placeholder={defaultMarks}
              aria-label={`প্রশ্ন ${index + 1} এর নম্বর`}
              className="w-16 bg-transparent text-center text-base font-bold text-blue-50 placeholder:font-normal placeholder:text-slate-500 focus:outline-none"
            />
          </label>

          <button
            type="button"
            onClick={onDelete}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-red-600/40 bg-red-600/10 px-3.5 py-1.5 text-sm font-medium text-red-600"
          >
            <Trash2 size={16} />
            মুছুন
          </button>
        </div>
      </div>

      <div className="pt-6">
        <label className="block pb-2 text-base font-medium text-blue-50">
          প্রশ্ন<span className="text-red-600">*</span>
        </label>
        <textarea
          value={question.text}
          onChange={(e) => setText(e.target.value)}
          placeholder="যেমন: 'অগ্নিবীণা' কাব্যগ্রন্থটি কার রচনা?"
          rows={2}
          className="w-full resize-none rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <div className="pt-6">
        <label className="block pb-2 text-base font-medium text-blue-50">অপশনগুলো</label>
        <div className="flex flex-col gap-2.5">
          {question.options.map((option, i) => {
            const isCorrect = question.correctIndex === i;
            return (
              <div
                key={i}
                className={`flex items-center gap-3.5 rounded-xl border px-3.5 py-3 ${
                  isCorrect ? "border-emerald-500 bg-emerald-500/10" : "border-slate-800 bg-gray-800"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setCorrect(i)}
                  className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
                    isCorrect ? "bg-emerald-500" : "bg-gray-700 text-slate-400"
                  }`}
                >
                  {isCorrect ? <CheckCircle2 size={16} className="text-white" /> : optionLabels[i]}
                </button>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`অপশন ${optionLabels[i]}`}
                  className="flex-1 bg-transparent text-base text-blue-50 placeholder:text-slate-400 focus:outline-none"
                />
                {isCorrect && (
                  <span className="shrink-0 rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-500">
                    সঠিক উত্তর
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-400">
          <HelpCircle size={14} />
          বাম পাশের গোল বাটনে ক্লিক করে সঠিক উত্তরটা সিলেক্ট করুন
        </p>
      </div>

      <div className="pt-6">
        <label className="block pb-2 text-base font-medium text-blue-50">ব্যাখ্যা (অপশনাল)</label>
        <textarea
          value={question.explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="রেজাল্টে শিক্ষার্থী এই ব্যাখ্যাটা দেখতে পাবে"
          rows={2}
          className="w-full resize-none rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
    </section>
  );
}
