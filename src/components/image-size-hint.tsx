/**
 * Recommended upload sizes, in one place.
 *
 * Every figure is derived from how the image is actually rendered on the
 * student site, sized for **mobile first**: most students are on a 390–430px
 * phone at 2–3× device pixel ratio, so a picture that fills the width there
 * needs roughly 1200 real pixels to look sharp. Desktop is always the smaller
 * demand for these — a course card is wider on a phone (full-bleed) than in a
 * three-column grid.
 *
 * The aspect ratio matters more than the exact pixel count: every one of these
 * containers crops with `object-cover`, so an image at the wrong ratio loses
 * its edges rather than letterboxing.
 */
export type ImageKind =
  | "courseThumbnail"
  | "courseCover"
  | "bookCover"
  | "teacherPhoto"
  | "examBatchThumbnail"
  | "promoVideoThumbnail"
  | "liveClassThumbnail"
  | "classVideoThumbnail"
  | "communityBanner";

type Guidance = {
  /** Short line shown under the upload control. */
  text: string;
  /** Why this size — kept here rather than in the UI, for whoever edits next. */
  reason: string;
};

export const IMAGE_GUIDANCE: Record<ImageKind, Guidance> = {
  courseThumbnail: {
    text: "প্রস্তাবিত সাইজ: ১২৮০ × ৭২০ পিক্সেল (16:9) · সর্বোচ্চ ৫০০ KB",
    reason:
      "Course card is min-h-[247px] and goes full-bleed on mobile; the details hero renders up to 872px wide.",
  },
  courseCover: {
    text: "প্রস্তাবিত সাইজ: ১৯২০ × ১০৮০ পিক্সেল (16:9) · সর্বোচ্চ ৮০০ KB",
    reason:
      "Used as the wide banner on the course details page at calc(100vw - 32px), up to 872px on desktop.",
  },
  bookCover: {
    text: "প্রস্তাবিত সাইজ: ৯০০ × ১২০০ পিক্সেল (3:4, পোর্ট্রেট) · সর্বোচ্চ ৫০০ KB",
    reason:
      "BookCover renders at exactly 150×200 (md) and 210×280 (lg) — a strict 3:4 box.",
  },
  teacherPhoto: {
    text: "প্রস্তাবিত সাইজ: ৮০০ × ১০০০ পিক্সেল (4:5, পোর্ট্রেট) · ব্যাকগ্রাউন্ড ছাড়া PNG হলে ভালো",
    reason:
      "Team and mentor cards use object-contain object-bottom — cut-out portraits standing on the card edge, so a transparent PNG reads best.",
  },
  examBatchThumbnail: {
    text: "প্রস্তাবিত সাইজ: ১২৮০ × ৭২০ পিক্সেল (16:9) · সর্বোচ্চ ৫০০ KB",
    reason: "Batch details hero renders at 92vw on mobile, 620px on desktop.",
  },
  promoVideoThumbnail: {
    text: "প্রস্তাবিত সাইজ: ১২৮০ × ৭২০ পিক্সেল (16:9) · সর্বোচ্চ ৫০০ KB",
    reason:
      "PromoVideoTrigger box is min-h-[218px] at 92vw on mobile, 360px on desktop.",
  },
  liveClassThumbnail: {
    text: "প্রস্তাবিত সাইজ: ১২৮০ × ৭২০ পিক্সেল (16:9) · সর্বোচ্চ ৫০০ KB",
    reason:
      "Live and recording cards use an aspect-video box: 176px wide on desktop, full width below 860px.",
  },
  classVideoThumbnail: {
    text: "প্রস্তাবিত সাইজ: ৬৪০ × ৩৬০ পিক্সেল (16:9) · সর্বোচ্চ ২০০ KB",
    reason:
      "Rendered as a small 76×44 poster beside the video title, so a light file is worth more than resolution.",
  },
  communityBanner: {
    text: "প্রস্তাবিত সাইজ: ২৪০ × ২৪০ পিক্সেল (বর্গাকার) · সর্বোচ্চ ১০০ KB",
    reason:
      "Community links render the banner as a 44×44 rounded square icon (size-11, object-cover).",
  },
};

/**
 * One short line under an image upload telling the admin what to upload.
 *
 * Deliberately plain text rather than a tooltip or popover: it has to be
 * readable *before* picking a file, which is the only moment it helps.
 */
export default function ImageSizeHint({
  kind,
  className = "",
}: {
  kind: ImageKind;
  className?: string;
}) {
  return (
    <p className={`mt-1.5 text-[11px] leading-5 text-slate-500 ${className}`}>
      {IMAGE_GUIDANCE[kind].text}
    </p>
  );
}
