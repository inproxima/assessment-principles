import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { PrincipleResult, Run } from "../apiClient";
import { Panel } from "./ui/Panel";
import { SectionHeader } from "./ui/SectionHeader";

function formatDate(iso?: string): string {
  if (!iso) return "\u2014";
  const normalized = iso.includes("T") ? iso : iso.replace(" ", "T");
  const hasTimeZone = /[zZ]|[+\-]\d\d:?(\d\d)?$/.test(normalized);
  const d = new Date(hasTimeZone ? normalized : `${normalized}Z`);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function NarrativeSection({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-stone prose-sm max-w-none leading-relaxed text-stone-800 prose-headings:font-display prose-headings:tracking-tight prose-a:text-burgundy-900 prose-a:no-underline hover:prose-a:underline prose-strong:text-stone-900">
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
      {/* ─── Report Header ─── */}
      <header className="mb-10">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-burgundy-900/60">
              Assessment Principles Studio
            </p>
            <h1 className="mt-2 font-display text-3xl tracking-tight text-stone-900 sm:text-4xl">
              Feedback Report
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-stone-500">
              Narrative feedback highlighting strengths and opportunities for growth.
            </p>
          </div>
          <dl className="hidden min-w-[200px] rounded-xl border border-stone-200 bg-stone-50 px-5 py-4 text-xs shadow-warm-sm sm:block">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-semibold uppercase tracking-wide text-stone-400">Run ID</dt>
              <dd className="font-mono text-[11px] text-stone-700">{run.id}</dd>
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-stone-200 pt-3">
              <dt className="font-semibold uppercase tracking-wide text-stone-400">Created</dt>
              <dd className="text-stone-700">{formatDate(run.created_at)}</dd>
            </div>
          </dl>
        </div>
      </header>

      {/* ─── Course Context ─── */}
      <Panel className="mb-8">
        <SectionHeader title="Course Context" purpose="Used to contextualize the evaluation." />
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { label: "Course level", value: run.course_level },
            { label: "Modality", value: run.modality },
            { label: "Discipline", value: run.discipline },
            { label: "Assessment type", value: run.assessment_type },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-stone-100 bg-stone-50/60 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</div>
              <div className="mt-1.5 text-sm font-medium text-stone-800">{value || "\u2014"}</div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">Learning outcomes</div>
          <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
            {learningOutcomesLooksLikeAssessmentInput ? "\u2014" : learningOutcomes || "\u2014"}
          </div>
          {learningOutcomesLooksLikeAssessmentInput ? (
            <p className="mt-2.5 rounded-md border border-amber-200/60 bg-amber-50/40 px-3 py-2 text-xs text-amber-800">
              Note: learning outcomes appear to match the assessment text. Enter learning outcomes in the Course context section and regenerate the report.
            </p>
          ) : null}
        </div>
      </Panel>

      {/* ─── Assessment Input ─── */}
      <Panel className="mb-8">
        <SectionHeader title="Assessment Input" purpose="Original text provided (pasted or extracted from upload)." />
        <details className="group">
          <summary className="cursor-pointer select-none text-sm font-medium text-stone-700 transition-colors hover:text-burgundy-900">
            View assessment text
            <svg className="ml-2 inline h-4 w-4 text-stone-400 transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </summary>
          <div className="mt-4 max-h-[360px] overflow-auto rounded-lg border border-stone-200 bg-stone-50/60 p-5 text-sm leading-relaxed text-stone-700">
            <div className="whitespace-pre-wrap break-words font-serif">{originalText || "\u2014"}</div>
          </div>
        </details>
      </Panel>

      {/* ─── Principles at a Glance ─── */}
      {sorted.length > 0 && (
        <Panel className="mb-8">
          <SectionHeader
            title="Principles at a Glance"
            purpose="Which assessment principles are discussed in each section below."
          />
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Alignment column */}
            <div className="rounded-xl border border-green-200/60 bg-green-50/30 p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-4 w-4 text-green-700" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-green-800">Alignment</span>
                <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">{alignedPrinciples.length}</span>
              </div>
              {alignedPrinciples.length > 0 ? (
                <ul className="space-y-2.5">
                  {alignedPrinciples.map((r) => (
                    <li key={r.principle_id} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-200/70 font-display text-[10px] font-bold text-green-900">
                        {r.principle_id.toUpperCase()}
                      </span>
                      <span className="text-[13px] leading-5 text-stone-700">{r.principle_title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs italic text-stone-500">No principles fully met.</p>
              )}
            </div>

            {/* Continue the Journey column */}
            <div className="rounded-xl border border-teal-200/60 bg-teal-50/30 p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100">
                  <svg className="h-4 w-4 text-teal-700" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-800">Continue the Journey</span>
                <span className="ml-auto rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800">{journeyPrinciples.length}</span>
              </div>
              {journeyPrinciples.length > 0 ? (
                <ul className="space-y-2.5">
                  {journeyPrinciples.map((r) => {
                    const isNotObserved = r.meets_level === "insufficient_info";
                    return (
                      <li key={r.principle_id} className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full font-display text-[10px] font-bold ${isNotObserved ? "bg-stone-200 text-stone-600" : "bg-teal-200/70 text-teal-900"}`}>
                          {r.principle_id.toUpperCase()}
                        </span>
                        <span className="text-[13px] leading-5 text-stone-700">
                          {r.principle_title}
                          {isNotObserved && (
                            <span className="ml-2 inline-flex items-center rounded-md border border-stone-200 bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                              Not observed
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs italic text-stone-500">No principles in this category.</p>
              )}
            </div>
          </div>
        </Panel>
      )}

      {/* ─── Alignment Narrative ─── */}
      <Panel className="mb-8">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100/80">
            <svg className="h-4.5 w-4.5 text-green-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
        <div className="mt-4 rounded-xl border border-green-100/80 bg-green-50/30 p-6">
          {alignment ? (
            <NarrativeSection markdown={alignment} />
          ) : (
            <p className="text-sm italic text-stone-500">Narrative not yet generated.</p>
          )}
        </div>
      </Panel>

      {/* ─── Continue the Journey Narrative ─── */}
      <Panel>
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-teal-100/80">
            <svg className="h-4.5 w-4.5 text-teal-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
        <div className="mt-4 rounded-xl border border-teal-100/80 bg-teal-50/30 p-6">
          {continueJourney ? (
            <NarrativeSection markdown={continueJourney} />
          ) : (
            <p className="text-sm italic text-stone-500">Narrative not yet generated.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}
