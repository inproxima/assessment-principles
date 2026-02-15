import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  required = false,
  requiredTone = "muted",
  helperText,
  labelSuffix,
  children
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  requiredTone?: "muted" | "amber";
  helperText?: string;
  labelSuffix?: ReactNode;
  children: ReactNode;
}) {
  const requiredClass = requiredTone === "amber" ? "text-amber-700" : "text-stone-400";
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wide text-stone-600">
        {label}
        {required && <span className={`ml-1.5 text-xs font-normal normal-case tracking-normal ${requiredClass}`}>(required)</span>}
        {labelSuffix}
      </label>
      {children}
      {helperText ? <p className="text-xs text-stone-500">{helperText}</p> : null}
    </div>
  );
}
