"use client";

import { Sparkles } from "lucide-react";
import ModalShell from "./modal-shell";
import WhyPlatformManager from "./why-platform-manager";

/** The existing "why platform" manager, in the shared modal chrome. */
export default function WhyPlatformModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell
      footerNote="হোমপেজের সুবিধার কার্ডগুলো"
      icon={<Sparkles size={17} />}
      onClose={onClose}
      size="lg"
      subtitle="সেকশনের শিরোনাম ও কার্ডগুলো"
      title="কেন ভাইয়াদের পাঠশালা"
    >
      <WhyPlatformManager embedded />
    </ModalShell>
  );
}
