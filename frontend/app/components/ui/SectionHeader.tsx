export function SectionHeader({
  title,
  purpose,
  required = false,
  requiredTone = "muted"
}: {
  title: string;
  purpose?: string;
  required?: boolean;
  requiredTone?: "muted" | "amber";
}) {
  const requiredClass = requiredTone === "amber" ? "text-amber-700" : "text-stone-400";
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        <div className="h-5 w-0.5 rounded-full bg-burgundy-900/70" />
        <h2 className="font-display text-lg font-normal tracking-tight text-stone-900">
          {title}
          {required && <span className={`ml-1.5 font-sans text-xs font-normal ${requiredClass}`}>(required)</span>}
        </h2>
      </div>
      {purpose ? <p className="mt-1.5 pl-[17px] text-[13px] leading-relaxed text-stone-500">{purpose}</p> : null}
    </div>
  );
}
