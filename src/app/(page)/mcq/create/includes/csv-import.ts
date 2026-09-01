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
  marks: "marks",
  mark: "marks",
  score: "marks",
  "নম্বর": "marks",
  "মার্ক": "marks",
};

const OPTION_LETTERS = ["A", "B", "C", "D"];

const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Accept "২" as readily as "2" — admins type marks in either script. */
function toEnglishDigits(value: string): string {
  return value.replace(/[০-৯]/g, (digit) => String(BENGALI_DIGITS.indexOf(digit)));
}

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

        const fields = new Set(results.meta.fields ?? []);
        const requiredColumns = [
          "question",
          "option_a",
          "option_b",
          "option_c",
          "option_d",
          "correct_option",
        ];
        const missingColumns = requiredColumns.filter((col) => !fields.has(col));

        if (missingColumns.length > 0) {
          errors.push(
            `CSV ফাইলের প্রথম সারিতে প্রয়োজনীয় কলাম পাওয়া যায়নি: ${missingColumns.join(", ")}। ` +
              `কলামের নাম অবশ্যই এভাবে দিতে হবে: question, option_a, option_b, option_c, option_d, correct_option, explanation (অপশনাল), marks (অপশনাল)।`
          );
          resolve({ questions, errors });
          return;
        }

        if (results.data.length === 0) {
          errors.push("CSV ফাইলে কোনো প্রশ্নের সারি পাওয়া যায়নি (শুধু হেডার সারি আছে)।");
          resolve({ questions, errors });
          return;
        }

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
          const marksRaw = (row.marks ?? "").trim();

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

          // `marks` is optional: a blank cell (or no column at all) means this
          // question takes the exam's default, so an ordinary 1-mark paper
          // needs no extra column. Only C-unit style papers fill it in.
          let marks = "";
          if (marksRaw) {
            const parsed = Number(toEnglishDigits(marksRaw));
            if (!Number.isFinite(parsed) || parsed <= 0) {
              errors.push(`সারি ${rowNumber}: নম্বর (marks) অবশ্যই ০ এর বড় একটি সংখ্যা হতে হবে`);
              return;
            }
            marks = String(parsed);
          }

          questions.push({
            id: crypto.randomUUID(),
            text,
            options,
            correctIndex,
            explanation,
            marks,
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
