import { useId, useRef } from "react";
import { Field } from "./Field";

export function FileUploadField({
  label,
  helperText,
  value,
  accept,
  disabled,
  onChange,
  buttonLabel = "Choose file",
  placeholder = "Upload assessment document (PDF or DOCX)",
  required,
  requiredTone
}: {
  label: string;
  helperText?: string;
  value: File | null;
  accept?: string;
  disabled?: boolean;
  onChange: (file: File | null) => void;
  buttonLabel?: string;
  placeholder?: string;
  required?: boolean;
  requiredTone?: "muted" | "amber";
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Field label={label} htmlFor={id} helperText={helperText} required={required} requiredTone={requiredTone}>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />

      <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span className="min-w-0 truncate">{value?.name || placeholder}</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {buttonLabel}
        </button>
      </div>
    </Field>
  );
}

