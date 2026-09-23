import type { StudentProfile } from "@/redux/api/studentsApi";

/**
 * Shared shape and labels for the student profile fields.
 *
 * Mirrors `StudentProfile.REQUIRED_FIELDS` on the backend and the student app's
 * own copy, so the admin panel shows the same fields, the same Bangla labels and
 * the same year range the student saw when they signed up.
 */

// `batch` and `session` are deliberately absent: the admin no longer edits
// them. Leaving them out of the payload means an admin save never touches
// whatever the student entered, instead of blanking it.
export type ProfileFormState = {
  institution: string;
  admission_unit: string;
  group: string;
  address: string;
  guardian_phone: string;
  gender: string;
  /** Held as strings so a <select> can bind to them; converted back on save. */
  ssc_year: string;
  hsc_year: string;
};

export const emptyProfileForm: ProfileFormState = {
  institution: "",
  admission_unit: "",
  group: "",
  address: "",
  guardian_phone: "",
  gender: "",
  ssc_year: "",
  hsc_year: "",
};

export const GENDER_OPTIONS = [
  { value: "male", label: "ছেলে" },
  { value: "female", label: "মেয়ে" },
] as const;

export const genderLabel = (value: string | undefined) =>
  GENDER_OPTIONS.find((option) => option.value === value)?.label ?? "";

/** Selectable exam years, newest first — generated so the list never goes stale. */
export function examYearOptions(now: Date = new Date()): number[] {
  const current = now.getFullYear();
  const years: number[] = [];
  for (let year = current + 3; year >= current - 12; year -= 1) {
    years.push(year);
  }
  return years;
}

/** Bangla labels for the field keys `profile_completion.missing` reports. */
export const PROFILE_FIELD_LABELS: Record<string, string> = {
  full_name: "পূর্ণ নাম",
  phone: "ফোন নম্বর",
  institution: "প্রতিষ্ঠানের নাম",
  guardian_phone: "অভিভাবকের ফোন",
  gender: "জেন্ডার",
  ssc_year: "SSC বছর",
  hsc_year: "HSC বছর",
};

export const profileFieldLabel = (key: string) =>
  PROFILE_FIELD_LABELS[key] ?? key;

export function toProfileForm(
  profile: Partial<StudentProfile> | null | undefined,
): ProfileFormState {
  return {
    ...emptyProfileForm,
    institution: profile?.institution ?? "",
    admission_unit: profile?.admission_unit ?? "",
    group: profile?.group ?? "",
    address: profile?.address ?? "",
    guardian_phone: profile?.guardian_phone ?? "",
    gender: profile?.gender ?? "",
    ssc_year: profile?.ssc_year ? String(profile.ssc_year) : "",
    hsc_year: profile?.hsc_year ? String(profile.hsc_year) : "",
  };
}

/**
 * Form state -> API payload.
 *
 * An unchosen year is sent as `null`, never `""` — the column is an integer, so
 * an empty string would come back as a validation error instead of "blank".
 */
export function toProfilePayload(
  form: ProfileFormState,
): Partial<StudentProfile> {
  return {
    institution: form.institution,
    admission_unit: form.admission_unit,
    group: form.group,
    address: form.address,
    guardian_phone: form.guardian_phone,
    gender: form.gender as StudentProfile["gender"],
    ssc_year: form.ssc_year ? Number(form.ssc_year) : null,
    hsc_year: form.hsc_year ? Number(form.hsc_year) : null,
  };
}
