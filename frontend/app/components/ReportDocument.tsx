import type { PrincipleResult, Run } from "../apiClient";
import { Panel } from "./ui/Panel";
import { SectionHeader } from "./ui/SectionHeader";

type ParsedPrinciple = {
  id: string;
  title: string;
  meets_level: string;
  evidence?: string;
  gaps?: string;
  recommendation?: string;
};

function label(level: string): string {
  switch (level) {
    case "meets":
      return "Meets";
    case "partially_meets":
      return "Partially meets";
    case "does_not_meet":
      return "Does not meet";
    case "insufficient_info":
      return "Insufficient info";
    default:
      return level;
  }
}

function badgeClass(level: string): string {
  switch (level) {
    case "meets":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "partially_meets":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "does_not_meet":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "insufficient_info":
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function safeJsonParse(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

function normalizeText(v: unknown): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s || s === "N/A") return undefined;
  return s;
}

function toParsed(results: PrincipleResult[]): ParsedPrinciple[] {
  return results.map((r) => {
    const obj = safeJsonParse(r.json_output);
    return {
      id: r.principle_id,
      title: r.principle_title,
      meets_level: r.meets_level,
      evidence: normalizeText(obj?.evidence),
      gaps: normalizeText(obj?.gaps),
      recommendation: normalizeText(obj?.recommendation)
    };
  });
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  // Ensure we display in the user's local timezone, even if the backend returns a
  // timezone-less timestamp (common with some DBs/serializers). In that case we
  // treat it as UTC so local conversion is correct.
  const normalized = iso.includes("T") ? iso : iso.replace(" ", "T");
  const hasTimeZone = /[zZ]|[+\-]\d\d:?(\d\d)?$/.test(normalized);
  const d = new Date(hasTimeZone ? normalized : `${normalized}Z`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  });
}

export function ReportDocument({
  run,
  results
}: {
  run: Run;
  results: PrincipleResult[];
}) {
  const parsed = toParsed(results).sort((a, b) => a.id.localeCompare(b.id));
  const expectedTotal = 11;
  const learningOutcomes = (run.learning_outcome || "").trim();
  const originalText = (run.original_text || "").trim();
  const normalized = (s: string) => s.replace(/\s+/g, " ").trim();
  const learningOutcomesLooksLikeAssessmentInput =
    !!learningOutcomes && !!originalText && normalized(learningOutcomes) === normalized(originalText);

  const counts = parsed.reduce(
    (acc, r) => {
      acc[r.meets_level] = (acc[r.meets_level] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-600">Assessment Principles</p>
            <h1 className="mt-1 text-balance font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Report
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Generated for course context and assessment input. Use the summary to identify strengths and priorities for improvement.
            </p>
          </div>
          <dl className="hidden min-w-[220px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700 shadow-sm sm:block">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-slate-500">Run ID</dt>
              <dd className="font-mono text-[11px] text-slate-900">{run.id}</dd>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-3">
              <dt className="text-slate-500">Created</dt>
              <dd className="text-slate-900">{formatDate(run.created_at)}</dd>
            </div>
          </dl>
        </div>
      </header>

      <Panel className="mb-6">
        <SectionHeader title="Course context" purpose="Used to contextualize the evaluation." />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs font-medium text-slate-500">Course level</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{run.course_level || "—"}</div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs font-medium text-slate-500">Modality</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{run.modality || "—"}</div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs font-medium text-slate-500">Discipline</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{run.discipline || "—"}</div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs font-medium text-slate-500">Assessment type</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{run.assessment_type || "—"}</div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs font-medium text-slate-500">Input type</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{run.input_type}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs font-medium text-slate-500">Learning outcomes</div>
          <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-900">
            {learningOutcomesLooksLikeAssessmentInput ? "—" : learningOutcomes || "—"}
          </div>
          {learningOutcomesLooksLikeAssessmentInput ? (
            <p className="mt-2 text-xs text-slate-500">
              Note: learning outcomes appear to match the assessment text. Enter learning outcomes in the Course context section and regenerate the
              report.
            </p>
          ) : null}
        </div>
      </Panel>

      <Panel className="mb-6">
        <SectionHeader title="Assessment input" purpose="Original text provided (pasted or extracted from upload)." />
        <details className="group">
          <summary className="cursor-pointer select-none text-sm font-semibold text-slate-900">
            View assessment text <span className="ml-2 text-slate-400">⌄</span>
          </summary>
          <div className="mt-3 max-h-[360px] overflow-auto rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-900">
            <div className="whitespace-pre-wrap break-words">{(run.original_text || "").trim() || "—"}</div>
          </div>
        </details>
      </Panel>

      <Panel className="mb-6">
        <SectionHeader
          title="Executive summary"
          purpose={`Counts across all principles (expected ${expectedTotal}). If a principle is not judgeable from provided inputs, it is marked “Insufficient info”.`}
        />

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["meets", "Meets"],
            ["partially_meets", "Partially meets"],
            ["does_not_meet", "Does not meet"],
            ["insufficient_info", "Insufficient info"]
          ].map(([key, title]) => (
            <div key={key} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-medium text-slate-500">{title}</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {counts[key] || 0}
                <span className="text-sm font-medium text-slate-500"> / {expectedTotal}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="mb-6">
        <SectionHeader title="Summary table" purpose="A compact overview of ratings across all principles." />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <th className="whitespace-nowrap border border-slate-200 px-3 py-2">ID</th>
                <th className="whitespace-nowrap border border-slate-200 px-3 py-2">Rating</th>
                <th className="min-w-[360px] border border-slate-200 px-3 py-2">Principle</th>
              </tr>
            </thead>
            <tbody className="text-slate-900">
              {parsed.map((p) => (
                <tr key={p.id} className="align-top">
                  <td className="border border-slate-200 px-3 py-2 font-mono text-xs">{p.id}</td>
                  <td className="border border-slate-200 px-3 py-2">
                    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${badgeClass(p.meets_level)}`}>
                      {label(p.meets_level)}
                    </span>
                  </td>
                  <td className="border border-slate-200 px-3 py-2 leading-6">{p.title}</td>
                </tr>
              ))}
              {!parsed.length && (
                <tr>
                  <td colSpan={3} className="border border-slate-200 px-3 py-8 text-center text-sm text-slate-500">
                    No principle results available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <SectionHeader title="Principle-by-principle results" purpose="Evidence, gaps, and recommendations per principle." />
        <div className="mt-5 space-y-4">
          {parsed.map((p) => (
            <section key={p.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    <span className="font-mono text-xs text-slate-500">({p.id})</span> {p.title}
                  </h3>
                </div>
                <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${badgeClass(p.meets_level)}`}>
                  {label(p.meets_level)}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                {p.evidence && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600">Evidence</dt>
                    <dd className="mt-2 leading-6 text-slate-900">{p.evidence}</dd>
                  </div>
                )}
                {p.gaps && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600">Gaps</dt>
                    <dd className="mt-2 leading-6 text-slate-900">{p.gaps}</dd>
                  </div>
                )}
                {p.recommendation && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600">Recommendation</dt>
                    <dd className="mt-2 leading-6 text-slate-900">{p.recommendation}</dd>
                  </div>
                )}
                {!p.evidence && !p.gaps && !p.recommendation && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:col-span-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600">Notes</dt>
                    <dd className="mt-2 leading-6 text-slate-900">No additional details were provided for this principle.</dd>
                  </div>
                )}
              </dl>
            </section>
          ))}

          {!parsed.length && <p className="text-sm text-slate-600">No results to display yet.</p>}
        </div>
      </Panel>
    </div>
  );
}

