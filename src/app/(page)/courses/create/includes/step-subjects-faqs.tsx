"use client";

import { useState } from "react";
import { Plus, Trash2, BookMarked, HelpCircle } from "lucide-react";
import type { SubjectDraft, FaqDraft } from "./types";

type Props = {
  subjects: SubjectDraft[];
  onSubjectsChange: (subjects: SubjectDraft[]) => void;
  faqs: FaqDraft[];
  onFaqsChange: (faqs: FaqDraft[]) => void;
};

export default function StepSubjectsFaqs({ subjects, onSubjectsChange, faqs, onFaqsChange }: Props) {
  const [subjectName, setSubjectName] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  const addSubject = () => {
    if (!subjectName.trim()) return;
    onSubjectsChange([
      ...subjects,
      { id: crypto.randomUUID(), name: subjectName.trim(), description: subjectDescription.trim() },
    ]);
    setSubjectName("");
    setSubjectDescription("");
  };

  const removeSubject = (id: string) => {
    onSubjectsChange(subjects.filter((s) => s.id !== id));
  };

  const addFaq = () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;
    onFaqsChange([...faqs, { id: crypto.randomUUID(), question: faqQuestion.trim(), answer: faqAnswer.trim() }]);
    setFaqQuestion("");
    setFaqAnswer("");
  };

  const removeFaq = (id: string) => {
    onFaqsChange(faqs.filter((f) => f.id !== id));
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <div className="flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20">
            <BookMarked size={24} className="text-blue-500" />
          </span>
          <div>
            <h2 className="text-xl font-bold leading-8 text-blue-50">কোর্স সাবজেক্ট</h2>
            <p className="mt-0.5 text-base text-slate-400">
              এই কোর্সের অধীনে থাকা বিষয়গুলো যোগ করুন — ক্লাস, পরীক্ষা ও অ্যাসাইনমেন্টের সাবজেক্ট ড্রপডাউনে এগুলো দেখাবে
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 rounded-2xl border border-slate-800 bg-gray-900/30 p-4">
          <input
            type="text"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="যেমন: পদার্থবিজ্ঞান"
            className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-2.5 text-sm text-blue-50 placeholder:text-slate-400 focus:outline-none"
          />
          <textarea
            value={subjectDescription}
            onChange={(e) => setSubjectDescription(e.target.value)}
            placeholder="বিষয়ের বিবরণ (ঐচ্ছিক)"
            rows={2}
            className="w-full resize-none rounded-xl border border-slate-800 bg-gray-800 px-4 py-2.5 text-sm text-blue-50 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={addSubject}
            className="flex w-fit items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            যোগ করুন
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {subjects.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-800 bg-gray-800 px-3.5 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-blue-50">{s.name}</p>
                <button type="button" onClick={() => removeSubject(s.id)} className="shrink-0 text-slate-400">
                  <Trash2 size={14} />
                </button>
              </div>
              {s.description && <p className="mt-1 text-sm text-slate-400">{s.description}</p>}
            </div>
          ))}
          {subjects.length === 0 && <p className="text-sm text-slate-400">এখনো কোনো সাবজেক্ট যোগ হয়নি</p>}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <div className="flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20">
            <HelpCircle size={24} className="text-blue-500" />
          </span>
          <div>
            <h2 className="text-xl font-bold leading-8 text-blue-50">সচরাচর জিজ্ঞাসা (FAQ)</h2>
            <p className="mt-0.5 text-base text-slate-400">এই কোর্স সম্পর্কে সাধারণ প্রশ্ন ও উত্তর যোগ করুন</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 rounded-2xl border border-slate-800 bg-gray-900/30 p-4">
          <input
            type="text"
            value={faqQuestion}
            onChange={(e) => setFaqQuestion(e.target.value)}
            placeholder="প্রশ্ন লিখুন"
            className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-2.5 text-sm text-blue-50 placeholder:text-slate-400 focus:outline-none"
          />
          <textarea
            value={faqAnswer}
            onChange={(e) => setFaqAnswer(e.target.value)}
            placeholder="উত্তর লিখুন"
            rows={2}
            className="w-full resize-none rounded-xl border border-slate-800 bg-gray-800 px-4 py-2.5 text-sm text-blue-50 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={addFaq}
            className="flex w-fit items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            FAQ যোগ করুন
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {faqs.map((f, index) => (
            <div key={f.id} className="rounded-xl border border-slate-800 bg-gray-900/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-blue-50">
                  {index + 1}. {f.question}
                </p>
                <button type="button" onClick={() => removeFaq(f.id)} className="shrink-0 text-slate-400">
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="mt-1.5 pl-5 text-sm text-slate-400">{f.answer}</p>
            </div>
          ))}
          {faqs.length === 0 && <p className="text-sm text-slate-400">এখনো কোনো FAQ যোগ হয়নি</p>}
        </div>
      </section>
    </div>
  );
}
