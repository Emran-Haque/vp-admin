import Image from "next/image";
import type { ReactNode } from "react";

type LoginShellProps = {
  children: ReactNode;
};

const stats = [
  { value: "৫০০+", label: "শিক্ষার্থী" },
  { value: "২০০+", label: "ক্লাস" },
  { value: "৯৮%", label: "সাফল্যের হার" },
];

export function LoginShell({ children }: LoginShellProps) {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#eaf6ff] via-[#dcecff] to-[#eaf6ff] text-[#07111f] max-[980px]:bg-[#050912]">
      <section className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1920px] grid-cols-[auto_minmax(360px,1fr)] items-center gap-[clamp(56px,7vw,145px)] px-[clamp(36px,6.25vw,120px)] py-[clamp(16px,2.5vh,36px)] max-[1180px]:gap-10 max-[980px]:block max-[980px]:p-0">
        <div className="relative flex min-h-[clamp(680px,54vw,980px)] w-[clamp(560px,44vw,805px)] flex-col items-center justify-center overflow-hidden rounded-[clamp(32px,2.9vw,56px)] bg-[#151c27]/92 px-[clamp(38px,4vw,78px)] pb-[clamp(28px,3vw,60px)] pt-[clamp(34px,3vw,58px)] shadow-[0_28px_70px_rgba(10,24,40,0.16)] max-[980px]:min-h-screen max-[980px]:w-full max-[980px]:rounded-none max-[980px]:bg-[#050912]/98 max-[980px]:px-5 max-[980px]:py-6 max-[520px]:px-4">
          <Image
            className="relative z-10 h-auto w-[clamp(210px,14vw,270px)] max-[980px]:w-[170px] max-[520px]:w-[150px]"
            src="/main_logo_white.png"
            alt="ভাইয়াদের পাঠশালা"
            width={354}
            height={120}
            priority
          />

          <div className="relative z-10 mt-[clamp(28px,4vw,75px)] w-[clamp(416px,30.5vw,552px)] rounded-[clamp(22px,1.45vw,28px)] border border-[#303545] bg-[#111624]/96 px-[clamp(37px,2.5vw,48px)] pb-[clamp(32px,3vw,48px)] pt-[clamp(32px,3vw,48px)] text-white shadow-[0_22px_48px_rgba(0,0,0,0.16)] max-[980px]:mt-5 max-[980px]:w-full max-[980px]:max-w-[480px] max-[980px]:rounded-[22px] max-[980px]:border-2 max-[980px]:border-[#2d3242] max-[980px]:bg-[#111624] max-[980px]:px-5 max-[980px]:pb-5 max-[980px]:pt-5 max-[520px]:rounded-[18px] max-[520px]:px-4">
            <div className="mb-5 max-[980px]:mb-4">
              <h2 className="m-0 text-[26px] font-black leading-tight text-white max-[980px]:text-[24px] max-[520px]:text-[22px]">
                স্বাগতম! 👋
              </h2>
              <p className="mt-2 text-[16px] font-medium leading-6 text-white/86 max-[980px]:text-[15px]">
                আপনার অ্যাকাউন্টে লগইন করুন
              </p>
            </div>
            {children}
          </div>
        </div>

        <div className="max-[980px]:hidden">
          <div className="inline-flex h-10 items-center gap-3 rounded-full border-2 border-[#3c86ff] bg-white/25 px-4 text-[15px] font-black text-[#3c86ff]">
            <span aria-hidden="true">✧</span>
            বাংলাদেশের সেরা প্রস্তুতি প্ল্যাটফর্ম
          </div>
          <h1 className="m-0 mt-5 max-w-[600px] text-[clamp(32px,2.8vw,44px)] font-black leading-[1.18] tracking-normal text-[#0a1322]">
            চট্টগ্রাম বিশ্ববিদ্যালয়ে
            <span className="block text-[#3c86ff]">ভর্তির স্বপ্ন পূরণ করুন</span>
          </h1>
          <p className="m-0 mt-5 max-w-[620px] text-[clamp(16px,1.15vw,19px)] font-semibold leading-7 text-[#3c86ff]">
            লাইভ ক্লাস, MCQ পরীক্ষা, রিসোর্স এবং মেধা তালিকা — সব এক জায়গায়।
          </p>

          <div className="mt-8 grid max-w-[330px] grid-cols-3 gap-7">
            {stats.map((item) => (
              <div key={item.label}>
                <strong className="block text-[26px] font-black leading-none text-[#8b5cf6]">
                  {item.value}
                </strong>
                <span className="mt-2 block text-[14px] font-bold text-[#111827]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
