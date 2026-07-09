export function extractErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (typeof obj.detail === "string") return obj.detail;
      const fieldErrors = Object.entries(obj)
        .map(([field, val]) => {
          if (Array.isArray(val)) return `${field}: ${val.join(", ")}`;
          if (typeof val === "string") return `${field}: ${val}`;
          return null;
        })
        .filter((v): v is string => v !== null);
      if (fieldErrors.length) return fieldErrors.join(" | ");
    }
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "অজানা ত্রুটি";
}
