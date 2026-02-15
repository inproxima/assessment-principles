import { useId, type SelectHTMLAttributes } from "react";
import { Field } from "./Field";
import { inputBase } from "./inputStyles";

export function SelectField({
  label,
  helperText,
  required,
  requiredTone,
  labelSuffix,
  className = "",
  children,
  ...props
}: {
  label: string;
  helperText?: string;
  required?: boolean;
  requiredTone?: "muted" | "amber";
  labelSuffix?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} helperText={helperText} required={required} requiredTone={requiredTone} labelSuffix={labelSuffix}>
      <div className="relative">
        <select
          {...props}
          id={id}
          className={[
            inputBase,
            "cursor-pointer appearance-none pr-9",
            className
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>
    </Field>
  );
}
