import type { PrincipleResult, Run } from "../apiClient";
import { ReportDocument } from "./ReportDocument";
import { Panel } from "./ui/Panel";
import { SectionHeader } from "./ui/SectionHeader";

export function ReportViewer({
  run,
  results,
  markdown
}: {
  run: Run | null | undefined;
  results: PrincipleResult[] | null | undefined;
  markdown: string | null | undefined;
}) {
  // Do not display the report UI until report generation is complete.
  if (!run || !markdown) return null;
  const runId = run.id;

  async function onDownloadPdf() {
    try {
      const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
      const res = await fetch(`${base}/api/runs/${runId}/report.pdf`);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = `assessment-report-${runId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  }

  return (
    <Panel className="report-shell" padding={false} focusWithinRing={false}>
      <div className="no-print border-b border-stone-100 px-7 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <SectionHeader
            title="Report"
            purpose="Narrative feedback on your assessment. Download as PDF or markdown below."
          />

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void onDownloadPdf()}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-warm-sm transition-all duration-200 hover:border-stone-300 hover:bg-stone-50 hover:shadow-warm focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700/20"
            >
              <svg className="h-4 w-4 text-stone-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              PDF
            </button>

            {markdown ? (
              <a
                href={`data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`}
                download="assessment-report.md"
                className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-warm-sm transition-all duration-200 hover:border-stone-300 hover:bg-stone-50 hover:shadow-warm focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700/20"
              >
                <svg className="h-4 w-4 text-stone-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                Markdown
              </a>
            ) : (
              <span className="inline-flex items-center rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-400">
                .md unavailable
              </span>
            )}
          </div>
        </div>
      </div>

      <article id="report" className="px-7 py-8">
        <ReportDocument run={run} results={results || []} />
      </article>
    </Panel>
  );
}
