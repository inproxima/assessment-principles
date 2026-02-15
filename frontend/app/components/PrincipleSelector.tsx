"use client";

import { useCallback, useState } from "react";
import type { Principle } from "../apiClient";

export function PrincipleSelector({
  principles,
  selectedIds,
  onChange,
  disabled = false,
}: {
  principles: Principle[];
  selectedIds: Set<string>;
  onChange: (ids: Set<string>) => void;
  disabled?: boolean;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const allSelected = principles.length > 0 && principles.every((p) => selectedIds.has(p.id));
  const noneSelected = principles.length > 0 && principles.every((p) => !selectedIds.has(p.id));

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      onChange(new Set());
    } else {
      onChange(new Set(principles.map((p) => p.id)));
    }
  }, [allSelected, principles, onChange]);

  const togglePrinciple = useCallback(
    (id: string) => {
      const next = new Set(selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      onChange(next);
    },
    [selectedIds, onChange],
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-3 flex items-center gap-4">
        <label className="flex cursor-pointer select-none items-center gap-2.5 text-xs font-medium text-stone-600 transition-colors hover:text-stone-900">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = !allSelected && !noneSelected;
            }}
            onChange={toggleSelectAll}
            disabled={disabled}
            className="h-4 w-4 rounded border-stone-300 text-burgundy-900 transition-colors focus:ring-burgundy-700/20 disabled:opacity-50"
          />
          Select all
        </label>
        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-500">
          {selectedIds.size} / {principles.length}
        </span>
      </div>

      {/* Accordion */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-warm-sm">
        {principles.map((p, index) => {
          const isExpanded = expandedIds.has(p.id);
          const isChecked = selectedIds.has(p.id);
          const isLast = index === principles.length - 1;

          return (
            <div key={p.id} className={!isLast ? "border-b border-stone-100" : ""}>
              {/* Header row */}
              <div className={`flex items-start gap-3 px-4 py-3.5 transition-colors duration-150 ${isChecked ? "bg-burgundy-50/30" : "hover:bg-stone-50"}`}>
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => togglePrinciple(p.id)}
                  disabled={disabled}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-burgundy-900 transition-colors focus:ring-burgundy-700/20 disabled:opacity-50"
                />

                {/* Clickable area toggles accordion */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(p.id)}
                  className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                >
                  <span className="mt-px w-5 shrink-0 text-center font-display text-xs font-semibold text-burgundy-900/50">
                    {p.id.toUpperCase()}
                  </span>
                  <span className="min-w-0 text-[13px] leading-snug text-stone-700 line-clamp-2">
                    {p.title}
                  </span>
                  <svg
                    className={`ml-auto mt-0.5 h-4 w-4 shrink-0 text-stone-400 transition-transform duration-300 ease-out ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>

              {/* Expanded content */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="border-t border-stone-100 bg-stone-50/50 px-4 pb-4 pl-[52px] pt-3">
                  <p className="text-[13px] leading-relaxed text-stone-500">{p.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
