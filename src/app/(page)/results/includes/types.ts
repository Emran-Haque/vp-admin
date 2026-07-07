export type ResultStatus = "passed" | "failed";

export type ResultItem = {
  id: string;
  rank: number;
  studentName: string;
  studentId: string;
  course: string;
  exam: string;
  score: number;
  maxScore: number;
  status: ResultStatus;
  date: string;
};

export const results: ResultItem[] = [
  {
    id: "1",
    rank: 1,
    studentName: "মোহাম্মদ রাকিব হাসান",
    studentId: "STU-1024",
    course: "HSC পদার্থবিজ্ঞান",
    exam: "অধ্যায় ৩ — গতি",
    score: 48,
    maxScore: 50,
    status: "passed",
    date: "২২ জুন, ২০২৬",
  },
  {
    id: "2",
    rank: 2,
    studentName: "সাদিয়া আক্তার",
    studentId: "STU-1031",
    course: "HSC রসায়ন",
    exam: "মৌলিক ধারণা",
    score: 46,
    maxScore: 50,
    status: "passed",
    date: "২১ জুন, ২০২৬",
  },
  {
    id: "3",
    rank: 3,
    studentName: "তানভীর আহমেদ",
    studentId: "STU-1009",
    course: "HSC গণিত",
    exam: "ত্রিকোণমিতি",
    score: 44,
    maxScore: 50,
    status: "passed",
    date: "২১ জুন, ২০২৬",
  },
  {
    id: "4",
    rank: 4,
    studentName: "নুসরাত জাহান",
    studentId: "STU-1042",
    course: "HSC জীববিজ্ঞান",
    exam: "কোষ বিভাজন",
    score: 41,
    maxScore: 50,
    status: "passed",
    date: "২০ জুন, ২০২৬",
  },
  {
    id: "5",
    rank: 5,
    studentName: "ইমরান হোসেন",
    studentId: "STU-1055",
    course: "HSC পদার্থবিজ্ঞান",
    exam: "তাপগতিবিদ্যা",
    score: 39,
    maxScore: 50,
    status: "passed",
    date: "১৯ জুন, ২০২৬",
  },
  {
    id: "6",
    rank: 6,
    studentName: "ফারহানা ইসলাম",
    studentId: "STU-1067",
    course: "HSC ইংরেজি",
    exam: "Grammar Test",
    score: 36,
    maxScore: 50,
    status: "passed",
    date: "১৯ জুন, ২০২৬",
  },
  {
    id: "7",
    rank: 7,
    studentName: "আরিফুল ইসলাম",
    studentId: "STU-1078",
    course: "HSC গণিত",
    exam: "ক্যালকুলাস",
    score: 33,
    maxScore: 50,
    status: "passed",
    date: "১৮ জুন, ২০২৬",
  },
  {
    id: "8",
    rank: 8,
    studentName: "মেহজাবিন চৌধুরী",
    studentId: "STU-1082",
    course: "HSC রসায়ন",
    exam: "জৈব রসায়ন",
    score: 22,
    maxScore: 50,
    status: "failed",
    date: "১৮ জুন, ২০২৬",
  },
  {
    id: "9",
    rank: 9,
    studentName: "শাকিল আহমেদ",
    studentId: "STU-1090",
    course: "HSC জীববিজ্ঞান",
    exam: "জিনতত্ত্ব",
    score: 19,
    maxScore: 50,
    status: "failed",
    date: "১৭ জুন, ২০২৬",
  },
];
