"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { parseQuestionsCsv } from "./csv-import";
import type { Question } from "./types";

type Props = {
  onImport: (questions: Question[]) => void;
  onErrors: (errors: string[]) => void;
  className?: string;
};

const defaultClassName =
  "flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-700 px-3.5 py-3 text-base font-medium text-slate-200 hover:bg-white/5";

export default function CsvImportButton({ onImport, onErrors, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setIsParsing(true);
    try {
      const { questions, errors } = await parseQuestionsCsv(file);
      if (questions.length > 0) onImport(questions);
      onErrors(errors);
    } catch {
      onErrors(["CSV ফাইলটি পড়া যায়নি। ফাইলটি সঠিক ফরম্যাটে আছে কিনা যাচাই করুন।"]);
    } finally {
      setIsParsing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <label className={className ?? defaultClassName}>
      {isParsing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
      CSV আপলোড করুন
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        disabled={isParsing}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}
