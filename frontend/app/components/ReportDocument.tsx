import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { PrincipleResult, Run } from "../apiClient";
import { Panel } from "./ui/Panel";
import { SectionHeader } from "./ui/SectionHeader";

function formatDate(iso?: string): string {
  if (!iso) return "—";
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

function NarrativeSection({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-slate prose-sm max-w-none leading-relaxed text-slate-800">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}

export function ReportDocument({
  run,
  results
}: {
  run: Run;
  results: PrincipleResult[];
}) {
  const learningOutcomes = (run.learning_outcome || "").trim();
  const originalText = (run.original_text || "").trim();
  const normalized = (s: string) => s.replace(/\s+/g, " ").trim();
  const learningOutcomesLooksLikeAssessmentInput =
    !!learningOutcomes && !!originalText && normalized(learningOutcomes) === normalized(originalText);

  const alignment = (run.narrative_alignment || "").trim();
  const continueJourney = (run.narrative_continue_journey || "").trim();

  // Group principles by section
  const sorted = [...results].sort((a, b) => a.principle_id.localeCompare(b.principle_id));
  const alignedPrinciples = sorted.filter((r) => r.meets_level === "meets");
  const improvePrinciples = sorted.filter(
    (r) => r.meets_level === "partially_meets" || r.meets_level === "does_not_meet"
  );
  const notObserved = sorted.filter((r) => r.meets_level === "insufficient_info");
  // All non-aligned principles appear in the Continue the Journey column
  const journeyPrinciples = [...improvePrinciples, ...notObserved];

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-600">Assessment Principles</p>
            <h1 className="mt-1 text-balance font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Feedback Report
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Narrative feedback on your assessment, highlighting strengths and opportunities for growth.
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
            <div className="whitespace-pre-wrap break-words">{originalText || "—"}</div>
          </div>
        </details>
      </Panel>

      {sorted.length > 0 && (
        <Panel className="mb-6">
          <SectionHeader
            title="Principles at a glance"
            purpose="Which assessment principles are discussed in each section below."
          />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Alignment column */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Alignment</span>
                <span className="ml-auto text-xs font-medium text-emerald-600">{alignedPrinciples.length}</span>
              </div>
              {alignedPrinciples.length > 0 ? (
                <ul className="space-y-2">
                  {alignedPrinciples.map((r) => (
                    <li key={r.principle_id} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-800">
                        {r.principle_id}
                      </span>
                      <span className="text-xs leading-5 text-slate-800">{r.principle_title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No principles fully met.</p>
              )}
            </div>

            {/* Continue the Journey column */}
            <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100">
                  <svg className="h-3.5 w-3.5 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-sky-700">Continue the Journey</span>
                <span className="ml-auto text-xs font-medium text-sky-600">{journeyPrinciples.length}</span>
              </div>
              {journeyPrinciples.length > 0 ? (
                <ul className="space-y-2">
                  {journeyPrinciples.map((r) => {
                    const isNotObserved = r.meets_level === "insufficient_info";
                    return (
                      <li key={r.principle_id} className="flex items-start gap-2.5">
                        <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isNotObserved ? "bg-slate-200 text-slate-600" : "bg-sky-200 text-sky-800"}`}>
                          {r.principle_id}
                        </span>
                        <span className="text-xs leading-5 text-slate-800">
                          {r.principle_title}
                          {isNotObserved && (
                            <span className="ml-1.5 inline-flex items-center rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                              Not observed
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No principles in this category.</p>
              )}
            </div>
          </div>
        </Panel>
      )}

      <Panel className="mb-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <SectionHeader
              title="Alignment"
              purpose="Assessment principles that are well represented, with reasoning."
            />
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-5">
          {alignment ? (
            <NarrativeSection markdown={alignment} />
          ) : (
            <p className="text-sm text-slate-500 italic">Narrative not yet generated.</p>
          )}
        </div>
      </Panel>

      <Panel>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-100">
            <svg className="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <div>
            <SectionHeader
              title="Continue the Journey"
              purpose="Recommendations to further strengthen your assessment, with examples."
            />
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/50 p-5">
          {continueJourney ? (
            <NarrativeSection markdown={continueJourney} />
          ) : (
            <p className="text-sm text-slate-500 italic">Narrative not yet generated.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}
