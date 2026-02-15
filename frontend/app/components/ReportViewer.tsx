import type { Run } from "../apiClient";
import { ReportDocument } from "./ReportDocument";
import { Panel } from "./ui/Panel";
import { SectionHeader } from "./ui/SectionHeader";

export function ReportViewer({
  run,
  markdown
}: {
  run: Run | null | undefined;
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
      // Avoid unhandled promise rejections in the console.
      alert(e?.message || String(e));
    }
  }

  return (
    <Panel className="report-shell" padding={false} focusWithinRing={false}>
      <div className="no-print border-b border-slate-100 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <SectionHeader
            title="Report"
            purpose="Narrative feedback on your assessment. Download PDF or markdown below."
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void onDownloadPdf()}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Download PDF
            </button>

            {markdown ? (
              <a
                href={`data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`}
                download="assessment-report.md"
                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                Download .md
              </a>
            ) : (
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500">
                .md unavailable
              </span>
            )}
          </div>
        </div>
      </div>

      <article id="report" className="px-6 py-6">
        <ReportDocument run={run} />
      </article>
    </Panel>
  );
}
