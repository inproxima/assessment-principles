import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  required = false,
  requiredTone = "muted",
  helperText,
  children
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  requiredTone?: "muted" | "amber";
  helperText?: string;
  children: ReactNode;
}) {
  const requiredClass = requiredTone === "amber" ? "text-amber-700" : "text-slate-400";
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-slate-700">
        {label}
        {required && <span className={`ml-1 text-xs ${requiredClass}`}>(required)</span>}
      </label>
      {children}
      {helperText ? <p className="mt-1 text-xs text-slate-500">{helperText}</p> : null}
    </div>
  );
}

