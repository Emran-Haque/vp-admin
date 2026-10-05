import type { BasicInfo } from "./types";

function validUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateOfflineBatchInfo(
  value: BasicInfo,
  options: { requirePublishReady?: boolean } = {},
): string | null {
  if (value.deliveryMode !== "offline") return null;

  if (!validUrl(value.mapUrl)) return "Google Maps লিংকটি সঠিক URL হতে হবে।";
  if (value.contactPhone && !/^\+?[0-9 -]{7,20}$/.test(value.contactPhone.trim())) {
    return "যোগাযোগ নম্বরটি সঠিকভাবে লিখুন।";
  }
  if (value.classStartTime && value.classEndTime && value.classEndTime <= value.classStartTime) {
    return "ক্লাস শেষের সময় শুরুর সময়ের পরে হতে হবে।";
  }
  if (value.batchEndDate && value.classStartDate && value.batchEndDate < value.classStartDate) {
    return "ব্যাচ শেষের তারিখ ক্লাস শুরুর তারিখের আগে হতে পারবে না।";
  }
  if (
    value.enrollmentDeadline &&
    value.classStartDate &&
    value.enrollmentDeadline > value.classStartDate
  ) {
    return "ভর্তির শেষ তারিখ ক্লাস শুরুর তারিখের পরে হতে পারবে না।";
  }
  if (value.seatCapacity && Number(value.seatCapacity) < 1) {
    return "মোট আসন কমপক্ষে ১ হতে হবে।";
  }

  if (options.requirePublishReady) {
    if (!value.venue.trim()) return "প্রকাশ করার আগে অফলাইন ব্যাচের পূর্ণ ঠিকানা দিন।";
    if (!value.classStartDate) return "প্রকাশ করার আগে ক্লাস শুরুর তারিখ দিন।";
    if (!value.scheduleText.trim() && !(value.classDays.length && value.classStartTime)) {
      return "প্রকাশ করার আগে ক্লাসের দিন ও শুরুর সময় দিন।";
    }
  }

  return null;
}
