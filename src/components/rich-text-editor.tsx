"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Code, Italic,
  Link2, Link2Off, List, ListOrdered, Minus, Quote, Redo2, RemoveFormatting,
  Strikethrough, Subscript, Superscript, Underline, Undo2,
} from "lucide-react";
import { sanitizeRichHtml } from "@/lib/rich-text";

/**
 * A full rich text editor for long admin copy — course/batch/book descriptions.
 *
 * Reusable: drop it anywhere a textarea took a `value` / `onChange` pair. It
 * stores HTML, and everything it can produce is inside the allowlist the public
 * site parses, so what the admin sees here is what renders on the site.
 */

const HEADINGS = [
  { value: "p", label: "সাধারণ টেক্সট" },
  { value: "h2", label: "বড় শিরোনাম" },
  { value: "h3", label: "মাঝারি শিরোনাম" },
  { value: "h4", label: "ছোট শিরোনাম" },
];

const SIZES = [
  { value: "small", label: "ছোট" },
  { value: "medium", label: "স্বাভাবিক" },
  { value: "large", label: "বড়" },
  { value: "x-large", label: "আরও বড়" },
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 260,
  maxHeight = 620,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Mirrors what was last written to (or read from) the DOM. Without it,
  // echoing `value` back into innerHTML on each keystroke resets the caret.
  const lastHtml = useRef(value);
  const didPaint = useRef(false);
  const [isEmpty, setIsEmpty] = useState(() => !value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Always paint the first pass: React renders the div empty, so an existing
    // description loaded for editing would otherwise never appear.
    if (!didPaint.current || value !== lastHtml.current) {
      didPaint.current = true;
      lastHtml.current = value;
      el.innerHTML = value;
      setIsEmpty(!(el.textContent ?? "").trim());
    }
  }, [value]);

  const emit = useCallback(
    (html: string) => {
      lastHtml.current = html;
      onChange(html);
      setIsEmpty(!(ref.current?.textContent ?? "").trim());
    },
    [onChange],
  );

  const handleInput = () => emit(ref.current?.innerHTML ?? "");

  const handleBlur = () => {
    const el = ref.current;
    if (!el) return;
    const cleaned = sanitizeRichHtml(el.innerHTML);
    if (cleaned !== el.innerHTML) el.innerHTML = cleaned;
    emit(cleaned);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const plain = event.clipboardData.getData("text/plain");
    // Word/Docs/Facebook markup is filtered down to the allowlist; plain text
    // keeps its line breaks by becoming real paragraphs.
    const insert = html
      ? sanitizeRichHtml(html)
      : plain
          .split(/\r\n?|\n/)
          .map((line) =>
            line.trim()
              ? `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`
              : "<p><br></p>",
          )
          .join("");
    document.execCommand("insertHTML", false, insert);
    handleInput();
  };

  /** `useCss` picks between tag output (<b>) and inline styles (colour, align). */
  const run = (command: string, argument?: string, useCss = false) => {
    ref.current?.focus();
    document.execCommand("styleWithCSS", false, useCss ? "true" : "false");
    document.execCommand(command, false, argument);
    handleInput();
  };

  const addLink = () => {
    const url = window.prompt("লিংক (URL) দিন", "https://");
    if (!url) return;
    run("createLink", url);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-gray-800">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-800 bg-slate-900/60 p-2">
        <Btn label="বোল্ড" onClick={() => run("bold")}><Bold size={14} /></Btn>
        <Btn label="ইটালিক" onClick={() => run("italic")}><Italic size={14} /></Btn>
        <Btn label="আন্ডারলাইন" onClick={() => run("underline")}><Underline size={14} /></Btn>
        <Btn label="স্ট্রাইকথ্রু" onClick={() => run("strikeThrough")}><Strikethrough size={14} /></Btn>

        <Divider />

        <Select
          ariaLabel="শিরোনাম"
          onChange={(v) => run("formatBlock", `<${v}>`)}
          options={HEADINGS}
        />
        <Select
          ariaLabel="লেখার আকার"
          onChange={(v) => run("fontSize", sizeToLegacy(v), true)}
          options={SIZES}
        />

        <Divider />

        <Btn label="বুলেট লিস্ট" onClick={() => run("insertUnorderedList")}><List size={14} /></Btn>
        <Btn label="নাম্বার লিস্ট" onClick={() => run("insertOrderedList")}><ListOrdered size={14} /></Btn>
        <Btn label="উক্তি" onClick={() => run("formatBlock", "<blockquote>")}><Quote size={14} /></Btn>
        <Btn label="বিভাজক রেখা" onClick={() => run("insertHorizontalRule")}><Minus size={14} /></Btn>

        <Divider />

        <Btn label="বাঁয়ে" onClick={() => run("justifyLeft", undefined, true)}><AlignLeft size={14} /></Btn>
        <Btn label="মাঝে" onClick={() => run("justifyCenter", undefined, true)}><AlignCenter size={14} /></Btn>
        <Btn label="ডানে" onClick={() => run("justifyRight", undefined, true)}><AlignRight size={14} /></Btn>
        <Btn label="জাস্টিফাই" onClick={() => run("justifyFull", undefined, true)}><AlignJustify size={14} /></Btn>

        <Divider />

        <Btn label="লিংক যোগ করুন" onClick={addLink}><Link2 size={14} /></Btn>
        <Btn label="লিংক সরান" onClick={() => run("unlink")}><Link2Off size={14} /></Btn>
        <Btn label="সুপারস্ক্রিপ্ট" onClick={() => run("superscript")}><Superscript size={14} /></Btn>
        <Btn label="সাবস্ক্রিপ্ট" onClick={() => run("subscript")}><Subscript size={14} /></Btn>
        <Btn label="কোড" onClick={() => run("formatBlock", "<pre>")}><Code size={14} /></Btn>

        <Divider />

        <Btn label="ফরম্যাট মুছুন" onClick={() => run("removeFormat")}><RemoveFormatting size={14} /></Btn>
        <Btn label="আনডু" onClick={() => run("undo")}><Undo2 size={14} /></Btn>
        <Btn label="রিডু" onClick={() => run("redo")}><Redo2 size={14} /></Btn>
      </div>

      <div className="relative">
        <div
          className="overflow-y-auto px-4 py-3 text-base leading-[1.7] text-blue-50 focus:outline-none [&_a]:text-cyan-300 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-cyan-500/60 [&_blockquote]:pl-3 [&_blockquote]:italic [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold [&_h4]:text-lg [&_h4]:font-bold [&_hr]:my-3 [&_hr]:border-slate-700 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
          contentEditable
          onBlur={handleBlur}
          onInput={handleInput}
          onPaste={handlePaste}
          ref={ref}
          role="textbox"
          style={{ minHeight, maxHeight }}
          suppressContentEditableWarning
        />
        {isEmpty && placeholder ? (
          <span className="pointer-events-none absolute left-4 top-3 text-base text-slate-500">
            {placeholder}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** execCommand("fontSize") still speaks the legacy 1–7 scale. */
function sizeToLegacy(keyword: string): string {
  switch (keyword) {
    // The legacy scale maps 1..7 onto xx-small..xxx-large.
    case "small": return "2";
    case "large": return "4";
    case "x-large": return "5";
    default: return "3";
  }
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-slate-700" />;
}

function Btn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="flex size-7 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
      // `onMouseDown` keeps the caret in the editable while the button is used.
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function Select({
  ariaLabel,
  onChange,
  options,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      aria-label={ariaLabel}
      className="h-7 cursor-pointer rounded-md border border-white/10 bg-white/5 px-1.5 text-xs text-slate-300 focus:outline-none"
      // Reset to the prompt so the same option can be picked twice in a row.
      onChange={(event) => {
        const picked = event.target.value;
        event.target.selectedIndex = 0;
        if (picked) onChange(picked);
      }}
      onMouseDown={(event) => event.stopPropagation()}
      title={ariaLabel}
      value=""
    >
      <option value="">{ariaLabel}</option>
      {options.map((option) => (
        <option className="bg-slate-800" key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
