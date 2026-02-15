import type { ButtonHTMLAttributes } from "react";

export function PrimaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold tracking-wide text-white",
        "bg-burgundy-900 shadow-warm-sm",
        "transition-all duration-200",
        "hover:bg-burgundy-800 hover:shadow-warm",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
        "active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:bg-stone-400 disabled:shadow-none",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
