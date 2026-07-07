"use client";

import { useState } from "react";
import QuestionSidebar from "./question-sidebar";
import QuestionEditor from "./question-editor";
import type { Question } from "./types";

type Props = {
  questions: Question[];
  onChange: (questions: Question[]) => void;
};

const createQuestion = (): Question => ({
  id: crypto.randomUUID(),
  text: "",
  options: ["", "", "", ""],
  correctIndex: null,
  explanation: "",
});

export default function StepQuestions({ questions, onChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(questions[0]?.id ?? null);

  const addQuestion = () => {
    const question = createQuestion();
    onChange([...questions, question]);
    setSelectedId(question.id);
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

  if (questions.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-800 p-10 text-center">
        <p className="text-base text-slate-400">এখনো কোনো প্রশ্ন যোগ হয়নি।</p>
        <button
          type="button"
          onClick={addQuestion}
          className="mt-4 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          প্রশ্ন যোগ করুন
        </button>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <QuestionSidebar
        questions={questions}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={addQuestion}
      />
      {selected && (
        <QuestionEditor
          key={selected.id}
          question={selected}
          index={selectedIndex}
          onChange={updateQuestion}
          onDelete={() => deleteQuestion(selected.id)}
        />
      )}
    </div>
  );
}
