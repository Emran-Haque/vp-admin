export function extractErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "status" in error) {
    const err = error as {
      status: unknown;
      data?: unknown;
      error?: unknown;
      originalStatus?: unknown;
    };

    if (err.status === "FETCH_ERROR" || err.status === "TIMEOUT_ERROR" || err.status === "CUSTOM_ERROR") {
      return typeof err.error === "string" ? err.error : "Could not connect to the server.";
    }

    if (err.status === "PARSING_ERROR") {
      return typeof err.originalStatus === "number"
        ? `Backend returned a non-JSON response (${err.originalStatus}). Please make sure the latest backend code is deployed and migrations are run.`
        : "Backend returned a non-JSON response. Please make sure the latest backend code is deployed.";
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

  return "Unknown error";
}
