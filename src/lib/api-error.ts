export function extractErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "status" in error) {
    const err = error as {
      status: unknown;
      data?: unknown;
      error?: unknown;
      originalStatus?: unknown;
    };

    if (err.status === "FETCH_ERROR" || err.status === "TIMEOUT_ERROR" || err.status === "CUSTOM_ERROR") {
      return typeof err.error === "string" ? err.error : "সার্ভারের সাথে সংযোগ করা যায়নি।";
    }

    if (err.status === "PARSING_ERROR") {
      return typeof err.originalStatus === "number"
        ? `ব্যাকএন্ড থেকে JSON response পাওয়া যায়নি (${err.originalStatus})। সর্বশেষ ব্যাকএন্ড কোড deploy করা আছে এবং migration run করা হয়েছে কিনা নিশ্চিত করুন।`
        : "ব্যাকএন্ড থেকে JSON response পাওয়া যায়নি। সর্বশেষ ব্যাকএন্ড কোড deploy করা আছে কিনা নিশ্চিত করুন।";
    }

    if (typeof err.status === "number") {
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
      return `HTTP ${err.status}`;
    }
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }

  return "অজানা সমস্যা হয়েছে।";
}
