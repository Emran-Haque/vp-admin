"use client";

import { Layers } from "lucide-react";
import BannerManager from "./banner-manager";
import ModalShell from "./modal-shell";

/**
 * The existing banner manager, in the shared modal chrome.
 *
 * It owns its own add/edit/delete flow (including its own form modal), so this
 * wrapper deliberately has no save button — there is nothing at this level to
 * save, and offering one would suggest the list below was a draft.
 */
export default function BannerModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell
      footerNote="হোমপেজের উপরের স্লাইড শো"
      icon={<Layers size={17} />}
      onClose={onClose}
      size="lg"
      subtitle="স্লাইড যোগ, এডিট ও ক্রম পরিবর্তন করুন"
      title="হোম ব্যানার"
    >
      <BannerManager embedded />
    </ModalShell>
  );
}
