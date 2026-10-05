"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { getMediaUrl } from "@/redux/api/baseApi";

/**
 * A student's profile photo (uploaded from the student site), or the old
 * graduation-cap tile when there is none or it fails to load. Size and
 * rounding come from `className`.
 */
export default function StudentAvatar({
  name,
  image,
  className = "size-14 rounded-2xl",
  iconSize = 28,
}: {
  name: string;
  image?: string | null;
  className?: string;
  iconSize?: number;
}) {
  const url = getMediaUrl(image);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = Boolean(url) && failedUrl !== url;

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-500 to-sky-500 ${className}`}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url ?? undefined}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <GraduationCap size={iconSize} className="text-white" strokeWidth={2} />
      )}
    </span>
  );
}
