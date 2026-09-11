export function getApiErrorStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null || !("status" in error)) return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : null;
}

export function extractErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "status" in error) {
    const err = error as {
      status: unknown;
      data?: unknown;
      error?: unknown;
      originalStatus?: unknown;
    };

    if (err.status === "FETCH_ERROR" || err.status === "TIMEOUT_ERROR" || err.status === "CUSTOM_ERROR") {
      return "সার্ভারে সংযোগ হচ্ছে না। backend চালু আছে কিনা দেখুন।";
    }

    if (err.status === "PARSING_ERROR") {
      return typeof err.originalStatus === "number"
        ? `ব্যাকএন্ড থেকে JSON response পাওয়া যায়নি (${err.originalStatus})। সর্বশেষ ব্যাকএন্ড কোড deploy করা আছে এবং migration run করা হয়েছে কিনা নিশ্চিত করুন।`
        : "ব্যাকএন্ড থেকে JSON response পাওয়া যায়নি। সর্বশেষ ব্যাকএন্ড কোড deploy করা আছে কিনা নিশ্চিত করুন।";
    }

    if (typeof err.status === "number") {
      if (err.status === 429) {
        return "একসঙ্গে অনেক অনুরোধ হয়েছে। একটু পরে আবার চেষ্টা করুন।";
      }
      const data = err.data;
      if (typeof data === "string" && data) return `(${err.status}) ${data}`;
      if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        if (typeof obj.detail === "string") return `(${err.status}) ${obj.detail}`;
        const fieldErrors = Object.entries(obj)
          .map(([field, val]) => {
            if (Array.isArray(val)) return `${field}: ${val.join(", ")}`;
            if (typeof val === "string") return `${field}: ${val}`;
            return null;
          })
          .filter((v): v is string => v !== null);
        if (fieldErrors.length) return `(${err.status}) ${fieldErrors.join(" | ")}`;
      }
      if (err.status >= 500) return "সার্ভারে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।";
      return `অনুরোধটি সম্পন্ন করা যায়নি (${err.status})।`;
    }
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      if (/failed to fetch|networkerror|load failed/i.test(message)) {
        return "সার্ভারে সংযোগ হচ্ছে না। backend চালু আছে কিনা দেখুন।";
      }
      return message;
    }
  }

  return "অনুরোধটি সম্পন্ন করা যায়নি।";
}
