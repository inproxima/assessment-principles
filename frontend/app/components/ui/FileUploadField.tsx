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

      <div className="group flex items-center justify-between gap-3 rounded-lg border-2 border-dashed border-stone-300 bg-stone-50/50 px-4 py-3.5 text-sm transition-colors duration-200 hover:border-burgundy-700/30 hover:bg-stone-50">
        <div className="flex min-w-0 items-center gap-2.5">
          <svg className="h-4.5 w-4.5 flex-shrink-0 text-stone-400 group-hover:text-burgundy-700/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <span className="min-w-0 truncate text-stone-600">{value?.name || placeholder}</span>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="shrink-0 rounded-md border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 shadow-warm-sm transition-all duration-200 hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
        >
          {buttonLabel}
        </button>
      </div>
    </Field>
  );
}
