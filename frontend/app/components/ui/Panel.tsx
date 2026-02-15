import type { ReactNode } from "react";

export function Panel({
  children,
  className = "",
  padding = true,
  focusWithinRing = true
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  focusWithinRing?: boolean;
}) {
  return (
    <section
      className={[
        "rounded-xl border border-stone-200/80 bg-white shadow-warm transition-shadow duration-300",
        "hover:shadow-warm-lg",
        padding ? "px-7 py-6" : "",
        focusWithinRing ? "focus-within:ring-2 focus-within:ring-burgundy-700/5" : "",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
