import { Sparkles } from "lucide-react";

const tips: Record<1 | 2 | 3, string> = {
  1: "পরীক্ষার নাম ছোট আর পরিষ্কার রাখুন — শিক্ষার্থীরা এই নাম দেখেই খুঁজে নেবে।",
  2: "প্রতিটি প্রশ্নে চারটি অপশন দিতেই হবে। সঠিক উত্তরটা সিলেক্ট করতে ভুলবেন না।",
  3: "পাবলিশ করার আগে সব প্রশ্ন আরেকবার চেক করুন। চাইলে ড্রাফট হিসেবেও সেভ করে রাখতে পারেন।",
};

export default function TipsBox({ step }: { step: 1 | 2 | 3 }) {
  return (
    <section className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6">
      <p className="flex items-center gap-1.5 text-base font-bold text-blue-500">
        <Sparkles size={16} />
        টিপস
      </p>
      <p className="mt-2 text-sm text-slate-300">{tips[step]}</p>
    </section>
  );
}
