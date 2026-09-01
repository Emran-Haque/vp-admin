"use client";

import { useState } from "react";
import { Check, Copy, Download, FileText, X } from "lucide-react";

/** The exact CSV an admin can copy or download — headers plus example rows.
 *  Kept in sync with the columns the parser (csv-import.ts) accepts. */
export const SAMPLE_CSV = `question,option_a,option_b,option_c,option_d,correct_option,explanation,marks
"বাংলাদেশের রাজধানী কোনটি?","ঢাকা","চট্টগ্রাম","খুলনা","রাজশাহী",A,"ঢাকা বাংলাদেশের রাজধানী।",1
"সূর্য কোন দিকে ওঠে?","উত্তর","দক্ষিণ","পূর্ব","পশ্চিম",C,"সূর্য পূর্ব দিকে ওঠে।",1
"২ + ৩ = কত?","৪","৫","৬","৭",B,,2
"নিচের কোনটি সঠিক?","ক","খ","গ","ঘ",D,"ব্যাখ্যা এখানে।",2
`;

type Props = {
  className?: string;
};

/** A "view sample CSV" button: opens a popup showing the required format so
 *  admins can copy the headers or download a ready-made sample file. */
export default function CsvSampleButton({ className }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copySample = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_CSV);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const downloadSample = () => {
    // Prepend a BOM so Excel opens the Bangla text correctly.
    const blob = new Blob([String.fromCharCode(0xFEFF) + SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mcq-sample.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const defaultClassName =
    "flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-700 px-3.5 py-3 text-base font-medium text-slate-200 hover:bg-white/5";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? defaultClassName}
        title="CSV ফরম্যাট দেখে কপি করুন"
      >
        <FileText size={16} />
        স্যাম্পল দেখুন
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-800/95 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-[640px] flex-col rounded-[20px] border border-white/5 bg-gray-900/95 p-6 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-50">CSV স্যাম্পল ও ফরম্যাট</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-3 text-xs leading-6 text-slate-400">
              প্রথম সারিতে হেডার (কলামের নাম), তারপর প্রতি সারিতে একটা করে প্রশ্ন।
              <br />
              প্রয়োজনীয় কলাম:{" "}
              <span className="font-semibold text-slate-200">
                question, option_a, option_b, option_c, option_d, correct_option
              </span>{" "}
              — আর <span className="font-semibold text-slate-200">explanation</span> (ব্যাখ্যা)
              ও <span className="font-semibold text-slate-200">marks</span> (নম্বর) অপশনাল।{" "}
              <span className="font-semibold text-slate-200">correct_option</span> অবশ্যই A/B/C/D
              হতে হবে।
            </p>

            <p className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2.5 text-xs leading-6 text-amber-200/90">
              <span className="font-semibold">চবি C ইউনিট (২ নম্বরের প্রশ্ন):</span>{" "}
              <span className="font-semibold text-amber-100">marks</span> কলামে ঐ প্রশ্নের নম্বর
              লিখুন — যেমন ২ নম্বরের প্রশ্নে <span className="font-semibold text-amber-100">2</span>।
              কলামটি ফাঁকা রাখলে বা বাদ দিলে পরীক্ষার ডিফল্ট নম্বর ধরা হবে, তাই সব প্রশ্ন ১ নম্বরের
              হলে কিছু লেখার দরকার নেই।
            </p>

            <div className="mt-4 overflow-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <pre className="whitespace-pre text-xs leading-6 text-slate-300">{SAMPLE_CSV}</pre>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={copySample}
                className="flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-slate-400/20 bg-slate-400/5 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/5"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? "কপি হয়েছে" : "ফরম্যাট কপি করুন"}
              </button>
              <button
                type="button"
                onClick={downloadSample}
                className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white"
              >
                <Download size={14} />
                স্যাম্পল CSV ডাউনলোড
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
