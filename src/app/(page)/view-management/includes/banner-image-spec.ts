import type { HeroPageKey } from "@/redux/api/contentApi";

const reducedHeightPages = new Set<HeroPageKey>([
  "course",
  "exam_batch",
  "book_store",
  "team",
  "success",
]);

const defaultSpec = {
  ratio: 16 / 9,
  ratioLabel: "16:9",
  recommendedWidth: 2560,
  recommendedHeight: 1440,
  minimumWidth: 1600,
  minimumHeight: 900,
  previewClass: "aspect-video",
  hintKind: "homeBanner" as const,
};

const reducedHeightSpec = {
  ratio: 320 / 153,
  ratioLabel: "320:153",
  recommendedWidth: 2560,
  recommendedHeight: 1224,
  minimumWidth: 1600,
  minimumHeight: 765,
  previewClass: "aspect-[320/153]",
  hintKind: "reducedHeroBanner" as const,
};

export function getBannerImageSpec(pageKey: HeroPageKey) {
  return reducedHeightPages.has(pageKey) ? reducedHeightSpec : defaultSpec;
}
