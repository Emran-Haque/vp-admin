export type NoticePriority = "urgent" | "important" | "general";

export type Notice = {
  id: string;
  title: string;
  description: string;
  priority: NoticePriority;
  category: string;
  date: string;
  visible: boolean;
};

export const notices: Notice[] = [
  {
    id: "1",
    title: "চট্টগ্রাম বিশ্ববিদ্যালয়ে ভর্তি পরীক্ষার তারিখ ঘোষণা",
    description:
      "চট্টগ্রাম বিশ্ববিদ্যালয় কর্তৃপক্ষ ২০২৪-২৫ শিক্ষাবর্ষের ভর্তি পরীক্ষার তারিখ ঘোষণা করেছে। বিজ্ঞান অনুষদের পরীক্ষা অক্টোবরে অনুষ্ঠিত হবে।",
    priority: "urgent",
    category: "পরীক্ষা",
    date: "১৫ জুন",
    visible: true,
  },
  {
    id: "2",
    title: "সাপ্তাহিক MCQ পরীক্ষার সময়সূচি পরিবর্তন",
    description:
      "আগামী সপ্তাহের MCQ পরীক্ষা শনিবার বিকাল ৪টার পরিবর্তে রবিবার সকাল ১০টায় অনুষ্ঠিত হবে।",
    priority: "important",
    category: "সময়সূচি",
    date: "১৪ জুন",
    visible: true,
  },
  {
    id: "3",
    title: "নতুন PDF রিসোর্স যোগ হয়েছে",
    description: "রসায়নের জন্য সম্পূর্ণ নতুন শর্ট নোট এবং পদার্থবিজ্ঞানের ফর্মুলা সিট আপলোড করা হয়েছে।",
    priority: "general",
    category: "রিসোর্স",
    date: "১৩ জুন",
    visible: false,
  },
];
