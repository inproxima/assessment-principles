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
  const requiredClass = requiredTone === "amber" ? "text-amber-700" : "text-slate-400";
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-slate-900">
        {title}
        {required && <span className={`ml-1 text-xs ${requiredClass}`}>(required)</span>}
      </h2>
      {purpose ? <p className="text-xs text-slate-500">{purpose}</p> : null}
    </div>
  );
}

