"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * A textarea that grows with its content instead of trapping long copy in a
 * fixed 3-row box. Course descriptions run to thousands of characters, and the
 * admin needs to see what they pasted.
 *
 * It fits the content between `minRows` and `maxRows`, then scrolls internally.
 * Manual drag-resizing stays available (`resize-y`) for anything taller.
 */
export default function AutoTextarea({
  value,
  onChange,
  className = "",
  placeholder,
  minRows = 3,
  maxRows = 18,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  id?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const style = window.getComputedStyle(el);
    const lineHeight = Number.parseFloat(style.lineHeight) || 24;
    const paddingY =
      Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
    const borderY =
      Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth);

    // Tailwind sets box-sizing: border-box, so an explicit height must include
    // padding and border — scrollHeight already covers padding but not border.
    const min = minRows * lineHeight + paddingY + borderY;
    const max = maxRows * lineHeight + paddingY + borderY;

    el.style.height = "auto";
    const content = el.scrollHeight + borderY;
    el.style.height = `${Math.max(min, Math.min(content, max))}px`;
    el.style.overflowY = content > max ? "auto" : "hidden";
  }, [maxRows, minRows]);

  // Re-fit when the value changes from anywhere — typing, or an edit form
  // hydrating an existing record after its API call resolves.
  useEffect(fit, [fit, value]);

  // A narrower window rewraps the text, which changes the height it needs.
  useEffect(() => {
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [fit]);

  return (
    <textarea
      className={`${className} resize-y`}
      id={id}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      ref={ref}
      rows={minRows}
      value={value}
    />
  );
}
