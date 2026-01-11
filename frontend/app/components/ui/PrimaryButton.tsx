import type { ButtonHTMLAttributes } from "react";

export function PrimaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white",
        "hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400",
        "disabled:cursor-not-allowed disabled:bg-slate-400",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

