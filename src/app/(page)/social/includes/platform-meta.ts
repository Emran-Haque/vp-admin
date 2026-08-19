import type { CommunityPlatform } from "@/redux/api/communityLinksApi";

export const PLATFORM_META: Record<CommunityPlatform, { label: string; color: string }> = {
  facebook: { label: "Facebook", color: "#1877f2" },
  youtube: { label: "YouTube", color: "#ff0000" },
  telegram: { label: "Telegram", color: "#29a9eb" },
  whatsapp: { label: "WhatsApp", color: "#25d366" },
  instagram: { label: "Instagram", color: "#e1306c" },
  discord: { label: "Discord", color: "#5865f2" },
  website: { label: "Website", color: "#38bdf8" },
  other: { label: "অন্যান্য", color: "#94a3b8" },
};

export const PLATFORM_OPTIONS = Object.entries(PLATFORM_META).map(([value, meta]) => ({
  value: value as CommunityPlatform,
  label: meta.label,
}));

const API_ORIGIN = "https://api.vaiyaderpathshala.com";

export function resolveMediaUrl(value: string | null): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  try {
    return new URL(value.startsWith("/") ? value : `/${value}`, API_ORIGIN).toString();
  } catch {
    return value;
  }
}
