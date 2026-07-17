function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Combines a date ("YYYY-MM-DD") and time ("HH:MM") into an ISO datetime string. */
export function combineDateTime(date: string, time: string): string | undefined {
  if (!date || !time) return undefined;
  const combined = new Date(`${date}T${time}:00`);
  return Number.isNaN(combined.getTime()) ? undefined : combined.toISOString();
}

/** Adds minutes to an ISO datetime string, returning a new ISO datetime string. */
export function addMinutes(iso: string | undefined, minutes: number): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Date(date.getTime() + minutes * 60000).toISOString();
}

/** Extracts the local "HH:MM" time-of-day from an ISO datetime string, for populating a time input. */
export function isoToTimeInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Formats an ISO datetime string as a local "HH:MM" time-of-day for display. */
export function formatTimeOfDay(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Converts a "YYYY-MM-DDTHH:MM" datetime-local input value into an ISO datetime string. */
export function localDateTimeToIso(localDateTime: string): string | undefined {
  if (!localDateTime) return undefined;
  const date = new Date(localDateTime);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Converts an ISO datetime string into a "YYYY-MM-DDTHH:MM" value for a datetime-local input. */
export function isoToLocalDateTimeInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
