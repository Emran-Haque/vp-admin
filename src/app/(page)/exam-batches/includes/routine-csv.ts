import Papa from "papaparse";
import { combineDateTime, localDateTimeToIso } from "@/lib/exam-datetime";
import type { RoutineImportExam } from "@/redux/api/examsApi";

/** Header aliases so admins can use English or Bengali column names. One CSV
 *  row = one routine exam (schedule only; questions are added per tile later). */
const HEADER_ALIASES: Record<string, string> = {
  name: "name",
  exam_title: "name",
  title: "name",
  "নাম": "name",
  "পরীক্ষা": "name",
  subject: "subject",
  "বিষয়": "subject",
  date: "date",
  exam_date: "date",
  "তারিখ": "date",
  start_time: "start_time",
  start: "start_time",
  "শুরু": "start_time",
  end_time: "end_time",
  deadline: "end_time",
  end: "end_time",
  "শেষ": "end_time",
  "ডেডলাইন": "end_time",
  duration_minutes: "duration_minutes",
  duration: "duration_minutes",
  "সময়": "duration_minutes",
  mark: "mark",
  marks: "mark",
  marks_per_question: "mark",
  "মার্ক": "mark",
  "নম্বর": "mark",
  questions: "questions",
  number_of_questions: "questions",
  question_count: "questions",
  "প্রশ্ন সংখ্যা": "questions",
};

function normalizeHeader(header: string): string {
  const key = header.trim().toLowerCase();
  return HEADER_ALIASES[key] ?? key;
}

/** Ready-to-copy sample: one row per exam, schedule only. */
export const ROUTINE_SAMPLE_CSV = `name,subject,date,start_time,end_time,duration_minutes,mark,questions
মডেল টেস্ট-১,পদার্থবিজ্ঞান,2026-09-01,10:00,2026-09-01 22:00,30,1,30
মডেল টেস্ট-২,রসায়ন,2026-09-02,10:00,2026-09-02 22:00,30,1,30
মডেল টেস্ট-৩,গণিত,2026-09-03,10:00,,25,1,25
`;

export type RoutineParseResult = {
  exams: RoutineImportExam[];
  errors: string[];
};

/** Convert a schedule-only routine CSV into exam shells (questions added later). */
export function parseRoutineCsv(file: File): Promise<RoutineParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: (results) => {
        const errors: string[] = [];
        const fields = new Set(results.meta.fields ?? []);
        if (!fields.has("name")) {
          resolve({ exams: [], errors: ['প্রয়োজনীয় কলাম পাওয়া যায়নি: "name" (পরীক্ষার নাম)।'] });
          return;
        }

        const exams: RoutineImportExam[] = [];
        results.data.forEach((row, index) => {
          const title = (row.name || "").trim();
          if (!title) {
            errors.push(`সারি ${index + 2}: পরীক্ষার নাম খালি।`);
            return;
          }
          const date = (row.date || "").trim();
          const startTime = (row.start_time || "").trim();
          const endRaw = (row.end_time || "").trim();
          exams.push({
            title,
            subject_label: (row.subject || "").trim(),
            exam_date: date || null,
            start_time: date && startTime ? combineDateTime(date, startTime) ?? null : null,
            end_time: endRaw ? localDateTimeToIso(endRaw.replace(" ", "T")) ?? null : null,
            duration_minutes: Number(row.duration_minutes) || 30,
            marks_per_question: (row.mark || "1").trim() || "1",
            planned_questions: Number(row.questions) || 0,
            questions: [],
          });
        });

        resolve({ exams, errors });
      },
      error: (error) => reject(error),
    });
  });
}
