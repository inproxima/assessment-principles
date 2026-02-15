import type { PrincipleResult } from "../apiClient";

function badgeClasses(level: string): string {
  switch (level) {
    case "meets":
      return "bg-green-100 text-green-800 border-green-200";
    case "partially_meets":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "does_not_meet":
      return "bg-rose-100 text-rose-800 border-rose-200";
    default:
      return "bg-stone-100 text-stone-700 border-stone-200";
  }
}

export function ResultsTable({ results }: { results: PrincipleResult[] }) {
  if (!results.length) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 shadow-warm-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50/60">
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Principle</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Rating</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Raw JSON</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, index) => (
            <tr key={r.id} className={index < results.length - 1 ? "border-b border-stone-100" : ""}>
              <td className="min-w-[280px] px-5 py-4">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-burgundy-50 font-display text-[10px] font-bold text-burgundy-900">
                    {r.principle_id.toUpperCase()}
                  </span>
                  <span className="font-medium text-stone-800">{r.principle_title}</span>
                </div>
              </td>
              <td className="min-w-[140px] px-5 py-4">
                <span
                  className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses(r.meets_level)}`}
                >
                  {r.meets_level.replace(/_/g, " ")}
                </span>
              </td>
              <td className="px-5 py-4">
                <pre className="m-0 max-w-md whitespace-pre-wrap break-words rounded-lg bg-stone-900 p-4 font-mono text-xs leading-relaxed text-stone-300">
                  {r.json_output}
                </pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
