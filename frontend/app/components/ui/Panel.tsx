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
        "rounded-lg border border-slate-200 bg-white",
        padding ? "px-6 py-5" : "",
        focusWithinRing ? "focus-within:ring-1 focus-within:ring-slate-200" : "",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}

