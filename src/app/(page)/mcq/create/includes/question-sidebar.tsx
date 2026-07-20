import { Plus } from "lucide-react";
import CsvImportButton from "./csv-import-button";
import type { Question } from "./types";

type Props = {
  questions: Question[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onImport: (questions: Question[]) => void;
  onImportErrors: (errors: string[]) => void;
};

export default function QuestionSidebar({
  questions,
  selectedId,
  onSelect,
  onAdd,
  onImport,
  onImportErrors,
}: Props) {
  return (
    <div className="flex w-60 shrink-0 flex-col rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-blue-50">প্রশ্নসমূহ</p>
        <p className="text-sm text-slate-400">{questions.length} টি</p>
      </div>

      <div className="mt-3.5 flex max-h-96 flex-col gap-1.5 overflow-y-auto pr-1">
        {questions.map((question, index) => {
          const isActive = question.id === selectedId;
          return (
            <button
              key={question.id}
              type="button"
              onClick={() => onSelect(question.id)}
              className={`flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-left ${
                isActive ? "border border-cyan-500/40 bg-cyan-500/20" : "hover:bg-white/5"
              }`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gray-800 text-sm font-bold text-slate-400">
                {index + 1}
              </span>
              <span className={`truncate text-base ${isActive ? "text-blue-50" : "text-slate-400"}`}>
                {question.text.trim() || "নতুন প্রশ্ন"}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-3.5 flex items-center justify-center gap-2 rounded-xl border border-blue-500 px-3.5 py-3 text-base font-medium text-white"
      >
        <Plus size={16} />
        প্রশ্ন যোগ করুন
      </button>

      <CsvImportButton
        onImport={onImport}
        onErrors={onImportErrors}
        className="mt-2.5 flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-3.5 py-3 text-base font-medium text-slate-200 hover:bg-white/5"
      />
    </div>
  );
}
