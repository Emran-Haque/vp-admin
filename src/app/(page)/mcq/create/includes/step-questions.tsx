"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import QuestionSidebar from "./question-sidebar";
import QuestionEditor from "./question-editor";
import CsvImportButton from "./csv-import-button";
import CsvSampleButton from "./csv-sample";
import { tallyMarks } from "./marks";
import type { Question } from "./types";

type Props = {
  questions: Question[];
  /** The exam's default mark — what a question with no override is worth. */
  defaultMarks?: string;
  onChange: (questions: Question[]) => void;
};

const createQuestion = (): Question => ({
  id: crypto.randomUUID(),
  text: "",
  options: ["", "", "", ""],
  correctIndex: null,
  explanation: "",
  marks: "",
});

export default function StepQuestions({
  questions,
  defaultMarks = "1",
  onChange,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(questions[0]?.id ?? null);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const addQuestion = () => {
    const question = createQuestion();
    onChange([...questions, question]);
    setSelectedId(question.id);
  };

  const importQuestions = (imported: Question[]) => {
    onChange([...questions, ...imported]);
    setSelectedId(imported[0]?.id ?? selectedId);
  };

  const updateQuestion = (updated: Question) => {
    onChange(questions.map((q) => (q.id === updated.id ? updated : q)));
  };

  const deleteQuestion = (id: string) => {
    const next = questions.filter((q) => q.id !== id);
    onChange(next);
    if (selectedId === id) {
      setSelectedId(next[0]?.id ?? null);
    }
  };

  const selected = questions.find((q) => q.id === selectedId) ?? null;
  const selectedIndex = questions.findIndex((q) => q.id === selectedId);

  const tally = tallyMarks(questions, defaultMarks);

  const errorBanner = importErrors.length > 0 && (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
        <div>
          <p className="text-sm font-semibold text-amber-500">
            {importErrors.length} টি সারি CSV থেকে আনা যায়নি
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-sm text-slate-400">
            {importErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setImportErrors([])}
        className="shrink-0 text-slate-400 hover:text-slate-200"
      >
        <X size={16} />
      </button>
    </div>
  );

  if (questions.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {errorBanner}
        <section className="rounded-3xl border border-dashed border-slate-800 p-10 text-center">
          <p className="text-base text-slate-400">এখনো কোনো প্রশ্ন অ্যাড করা হয়নি।</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={addQuestion}
              className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white"
            >
              প্রশ্ন অ্যাড করুন
            </button>
            <CsvImportButton
              onImport={importQuestions}
              onErrors={setImportErrors}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"
            />
            <CsvSampleButton className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700/60 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5" />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {errorBanner}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
        <p className="text-sm text-slate-400">
          <span className="font-semibold text-blue-50">{questions.length}</span> টি প্রশ্ন ·
          মোট <span className="font-semibold text-blue-50">{tally.total}</span> নম্বর
          {tally.isMixed ? (
            <span className="ml-1.5 text-slate-500">({tally.summary})</span>
          ) : null}
        </p>
        {tally.isMixed ? (
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
            মিশ্র নম্বর — ভুল উত্তরে নেগেটিভ প্রশ্নের নিজের নম্বর অনুযায়ী কাটা হবে
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <QuestionSidebar
          questions={questions}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={addQuestion}
          onImport={importQuestions}
          onImportErrors={setImportErrors}
          defaultMarks={defaultMarks}
        />
        {selected && (
          <QuestionEditor
            key={selected.id}
            question={selected}
            index={selectedIndex}
            defaultMarks={defaultMarks}
            onChange={updateQuestion}
            onDelete={() => deleteQuestion(selected.id)}
          />
        )}
      </div>
    </div>
  );
}
