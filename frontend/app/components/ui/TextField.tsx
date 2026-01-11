import { useId, type InputHTMLAttributes } from "react";
import { Field } from "./Field";
import { inputBase } from "./inputStyles";

export function TextField({
  label,
  helperText,
  required,
  requiredTone,
  className = "",
  ...props
}: {
  label: string;
  helperText?: string;
  required?: boolean;
  requiredTone?: "muted" | "amber";
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} helperText={helperText} required={required} requiredTone={requiredTone}>
      <input
        {...props}
        id={id}
        className={[inputBase, "placeholder:text-slate-400", className].filter(Boolean).join(" ")}
      />
    </Field>
  );
}

