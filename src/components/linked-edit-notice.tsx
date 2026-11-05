import { Link2 } from "lucide-react";

/** Shown at the top of an edit form when the item is linked into other courses. */
export default function LinkedEditNotice({
  linked,
  noun,
}: {
  linked: { course_title: string }[] | undefined;
  noun: string;
}) {
  if (!linked || linked.length === 0) return null;
  return (
    <div className="flex items-start gap-2 rounded-[10px] border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2.5 text-xs leading-5 text-cyan-100">
      <Link2 size={14} className="mt-0.5 shrink-0" />
      <span>
        এই {noun} আরও {linked.length}টি কোর্সে যুক্ত ({linked.map((row) => row.course_title).join(", ")})। সেভ
        করলে সেগুলোতেও একসাথে বদলাবে।
      </span>
    </div>
  );
}
