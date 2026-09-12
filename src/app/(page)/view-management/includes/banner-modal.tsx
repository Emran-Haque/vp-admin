"use client";

import { Layers } from "lucide-react";
import type { HeroPageKey } from "@/redux/api/contentApi";
import BannerManager from "./banner-manager";
import ModalShell from "./modal-shell";

/**
 * The existing banner manager, in the shared modal chrome.
 *
 * It owns its own add/edit/delete flow (including its own form modal), so this
 * wrapper deliberately has no save button — there is nothing at this level to
 * save, and offering one would suggest the list below was a draft.
 */
export default function BannerModal({
  onClose,
  pageKey = "home",
  pageLabel = "হোমপেজ",
}: {
  onClose: () => void;
  pageKey?: HeroPageKey;
  pageLabel?: string;
}) {
  return (
    <ModalShell
      footerNote={`${pageLabel}-এর উপরের স্লাইড শো`}
      icon={<Layers size={17} />}
      onClose={onClose}
      size="lg"
      subtitle="স্লাইড যোগ, এডিট ও ক্রম পরিবর্তন করুন"
      title={`${pageLabel} ব্যানার`}
    >
      <BannerManager embedded pageKey={pageKey} pageLabel={pageLabel} />
    </ModalShell>
  );
}
