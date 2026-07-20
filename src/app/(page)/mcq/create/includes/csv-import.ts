import Papa from "papaparse";
import type { Question } from "./types";

const HEADER_ALIASES: Record<string, string> = {
  question: "question",
  question_text: "question",
  "প্রশ্ন": "question",
  option_a: "option_a",
  optiona: "option_a",
  "option a": "option_a",
  "প্রশ্ন_ক": "option_a",
  option_b: "option_b",
  optionb: "option_b",
  "option b": "option_b",
  option_c: "option_c",
  optionc: "option_c",
  "option c": "option_c",
  option_d: "option_d",
  optiond: "option_d",
  "option d": "option_d",
  correct_option: "correct_option",
  correctoption: "correct_option",
  "correct option": "correct_option",
  answer: "correct_option",
  "সঠিক উত্তর": "correct_option",
  explanation: "explanation",
  "ব্যাখ্যা": "explanation",
};

const OPTION_LETTERS = ["A", "B", "C", "D"];

function normalizeHeader(header: string): string {
  const key = header.trim().toLowerCase();
  return HEADER_ALIASES[key] ?? key;
}

export type CsvImportResult = {
  questions: Question[];
  errors: string[];
};

export function parseQuestionsCsv(file: File): Promise<CsvImportResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: (results) => {
        const errors: string[] = [];
        const questions: Question[] = [];

        results.data.forEach((row, index) => {
          const rowNumber = index + 2; // header is row 1
          const text = (row.question ?? "").trim();
          const options = [
            (row.option_a ?? "").trim(),
            (row.option_b ?? "").trim(),
            (row.option_c ?? "").trim(),
            (row.option_d ?? "").trim(),
          ];
          const correctRaw = (row.correct_option ?? "").trim().toUpperCase();
          const explanation = (row.explanation ?? "").trim();

          const isBlankRow = !text && options.every((opt) => !opt) && !correctRaw;
          if (isBlankRow) return;

          if (!text) {
            errors.push(`সারি ${rowNumber}: প্রশ্নের লেখা নেই`);
            return;
          }
          if (options.some((opt) => !opt)) {
            errors.push(`সারি ${rowNumber}: চারটি অপশনই (option_a-option_d) আবশ্যক`);
            return;
          }

          const correctIndex = OPTION_LETTERS.indexOf(correctRaw);
          if (correctIndex === -1) {
            errors.push(`সারি ${rowNumber}: সঠিক উত্তর (correct_option) অবশ্যই A, B, C বা D হতে হবে`);
            return;
          }

          questions.push({
            id: crypto.randomUUID(),
            text,
            options,
            correctIndex,
            explanation,
          });
        });

        results.errors.forEach((e) => {
          errors.push(`পার্স ত্রুটি (সারি ${e.row != null ? e.row + 2 : "?"}): ${e.message}`);
        });

        resolve({ questions, errors });
      },
      error: (err) => reject(err),
    });
  });
}
