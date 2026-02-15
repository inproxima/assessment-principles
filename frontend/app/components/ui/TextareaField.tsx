import { useId, type TextareaHTMLAttributes } from "react";
import { Field } from "./Field";
import { inputBase } from "./inputStyles";

export function TextareaField({
  label,
  helperText,
  required,
  requiredTone,
  serif = false,
  className = "",
  ...props
}: {
  label: string;
  helperText?: string;
  required?: boolean;
  requiredTone?: "muted" | "amber";
  serif?: boolean;
  className?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} helperText={helperText} required={required} requiredTone={requiredTone}>
      <textarea
        {...props}
        id={id}
        className={[
          inputBase,
          "min-h-[120px] resize-y leading-relaxed",
          serif ? "font-serif" : "",
          className
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </Field>
  );
}
