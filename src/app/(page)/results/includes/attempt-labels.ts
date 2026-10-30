import type { EndedBy } from "./types";

export const endedByLabel: Record<Exclude<EndedBy, null>, { text: string; title: string; className: string }> = {
  time: {
    text: "সময় শেষ",
    title: "সময় শেষ হওয়ায় পরীক্ষাটি নিজে থেকে জমা হয়েছে",
    className: "bg-amber-500/10 text-amber-400",
  },
  left_screen: {
    text: "ট্যাব পরিবর্তন",
    title: "পরীক্ষার স্ক্রিন ছেড়ে অন্য ট্যাব/অ্যাপে যাওয়ায় পরীক্ষাটি নিজে থেকে জমা হয়েছে",
    className: "bg-orange-500/10 text-orange-400",
  },
  offline: {
    text: "অফলাইন",
    title: "অফলাইন (কাগজের) পরীক্ষা — নম্বর অ্যাডমিন দিয়েছেন",
    className: "bg-cyan-500/10 text-cyan-400",
  },
};

export const bnDigits = (value: number) => String(value).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

/** ১ম, ২য়, ৩য়, ৪র্থ, ৫ম, ৬ষ্ঠ, ৭ম … */
export function bnOrdinal(n: number) {
  const suffix: Record<number, string> = { 1: "ম", 2: "য়", 3: "য়", 4: "র্থ", 6: "ষ্ঠ" };
  return `${bnDigits(n)}${suffix[n] ?? (n <= 10 ? "ম" : "তম")}`;
}
