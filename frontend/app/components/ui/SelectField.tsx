import { useId, type SelectHTMLAttributes } from "react";
import { Field } from "./Field";
import { inputBase } from "./inputStyles";

export function SelectField({
  label,
  helperText,
  required,
  requiredTone,
  className = "",
  children,
  ...props
}: {
  label: string;
  helperText?: string;
  required?: boolean;
  requiredTone?: "muted" | "amber";
  className?: string;
  children: React.ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} helperText={helperText} required={required} requiredTone={requiredTone}>
      <div className="relative">
        <select
          {...props}
          id={id}
          className={[
            inputBase,
            "appearance-none pr-8",
            className
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute right-3 top-2.5 text-slate-400">⌄</div>
      </div>
    </Field>
  );
}

