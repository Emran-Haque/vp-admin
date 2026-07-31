"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useLoginMutation } from "@/redux/api/authApi";
import { useAppDispatch } from "@/redux/hooks";
import { setCredentials } from "@/redux/slices/authSlice";

const ALLOWED_ROLES = ["admin", "super_admin", "moderator"];

const inputClass =
  "h-[50px] w-full rounded-[12px] border-2 border-[#3a3f50] bg-[#252a36]/72 px-4 text-[15px] font-semibold text-white outline-none transition placeholder:text-white/42 focus:border-[#3b82f6] focus:bg-[#252a36] focus:ring-4 focus:ring-[#3b82f6]/14";

const labelClass = "mb-1.5 block text-[14px] font-black text-white";

function EyeIcon({ isVisible }: { isVisible: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-[22px] w-[22px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round" 
    >
      {isVisible ? (
        <>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
          <circle cx="12" cy="12" r="3" />
          <path d="m4 20 16-16" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

function describeLoginError(error: unknown): string {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: unknown }).status;
    if (status === "FETCH_ERROR") return "সার্ভারে সংযোগ করা যায়নি। ইন্টারনেট সংযোগ করুন।";
    if (status === 400 || status === 401) return "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।";
  }
  return "লগইন করা যায়নি। আবার চেষ্টা করুন। ";
}

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("ইমেইল ও পাসওয়ার্ড দিন।");
      return;
    }

    try {
      const response = await login({ email: email.trim(), password }).unwrap();

      if (!ALLOWED_ROLES.includes(response.user.role)) {
        setError("এই প্যানেলে প্রবেশাধিকার শুধুমাত্র অ্যাডমিন ও মডারেটরদের জন্য।");
        return;
      }

      dispatch(setCredentials({ token: response.token, user: response.user }));
      router.push("/home");
    } catch (submitError) {
      setError(describeLoginError(submitError));
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="block">
        <span className={labelClass}>ইমেইল ঠিকানা</span>
        <input
          className={inputClass}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="your@email.com"
          autoComplete="email"
        />
      </label>

      <label className="block">
        <span className={labelClass}>পাসওয়ার্ড</span>
        <div className="relative">
          <input
            className={`${inputClass} pr-12`}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <button
            className={`absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full transition ${
              showPassword ? "text-[#3b82f6]" : "text-white/90"
            }`}
            type="button"
            aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
            aria-pressed={showPassword}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setShowPassword((current) => !current)}
          >
            <EyeIcon isVisible={showPassword} />
          </button>
        </div>
      </label>

      {error ? (
        <p className="rounded-lg border border-red-300/25 bg-red-500/14 px-3 py-2 text-[13px] font-bold leading-5 text-red-100">
          {error}
        </p>
      ) : null}

      <button
        className="!mt-4 flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#3b82f6] px-5 text-[17px] font-black text-white shadow-[0_18px_35px_rgba(59,130,246,0.22)] transition hover:bg-[#2f78ee] disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "লগইন করা হচ্ছে..." : "লগইন করুন →"}
      </button>
    </form>
  );
}
