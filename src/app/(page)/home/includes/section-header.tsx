type SectionHeaderProps = {
  title: string;
  description: string;
};

export default function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-6">
      <div>
        <h2 className="text-2xl font-bold leading-8 text-blue-50">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-400">{description}</p>
      </div>
      <div className="h-px flex-1 bg-slate-800" />
    </div>
  );
}
