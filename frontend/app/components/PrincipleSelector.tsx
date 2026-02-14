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
      <div className="mb-3 flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-600 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = !allSelected && !noneSelected;
            }}
            onChange={toggleSelectAll}
            disabled={disabled}
            className="h-3.5 w-3.5 rounded border-slate-300 text-slate-800 focus:ring-slate-400 disabled:opacity-50"
          />
          Select all
        </label>
        <span className="text-xs text-slate-400">
          {selectedIds.size} / {principles.length} selected
        </span>
      </div>

      {/* Accordion */}
      <div className="divide-y divide-slate-200 rounded-md border border-slate-200">
        {principles.map((p) => {
          const isExpanded = expandedIds.has(p.id);
          const isChecked = selectedIds.has(p.id);

          return (
            <div key={p.id}>
              {/* Header row */}
              <div className="flex items-start gap-3 px-4 py-3">
                {/* Checkbox – stops click propagation so it doesn't toggle accordion */}
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => togglePrinciple(p.id)}
                  disabled={disabled}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-slate-800 focus:ring-slate-400 disabled:opacity-50"
                />

                {/* Clickable area toggles accordion */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(p.id)}
                  className="flex min-w-0 flex-1 items-start gap-2 text-left"
                >
                  <span className="shrink-0 mt-px text-xs font-semibold uppercase text-slate-400 w-4">
                    {p.id}
                  </span>
                  <span className="min-w-0 text-xs leading-snug text-slate-700 line-clamp-2">
                    {p.title}
                  </span>
                  <svg
                    className={`ml-auto mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
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
                className={`overflow-hidden transition-all duration-200 ${
                  isExpanded ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-4 pb-4 pl-11">
                  <p className="text-xs leading-relaxed text-slate-500">{p.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
