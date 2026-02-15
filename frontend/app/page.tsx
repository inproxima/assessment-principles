"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createReport, createRun, getPrinciples, getRun, startEvaluate, type GetRunResponse, type Principle } from "./apiClient";
import { PrincipleSelector } from "./components/PrincipleSelector";
import { ReportViewer } from "./components/ReportViewer";
import { Panel } from "./components/ui/Panel";
import { SectionHeader } from "./components/ui/SectionHeader";
import { SelectField } from "./components/ui/SelectField";
import { TextField } from "./components/ui/TextField";
import { TextareaField } from "./components/ui/TextareaField";
import { FileUploadField } from "./components/ui/FileUploadField";
import { PrimaryButton } from "./components/ui/PrimaryButton";
import { StatusBar } from "./components/ui/StatusBar";

type Mode = "task" | "description";
type CourseLevel = "undergraduate" | "graduate";
type Modality =
  | "in_person"
  | "blended_learning"
  | "web_based"
  | "field_school"
  | "practicum"
  | "field_placement"
  | "service_learning"
  | "internship"
  | "co_op"
  | "distance_education";
type AssessmentType = "formative" | "summative";

export default function Page() {
  const [mode, setMode] = useState<Mode>("task");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [courseLevel, setCourseLevel] = useState<CourseLevel | "">("");
  const [modality, setModality] = useState<Modality | "">("");
  const [discipline, setDiscipline] = useState("");
  const [assessmentType, setAssessmentType] = useState<AssessmentType | "">("");
  const [learningOutcomes, setLearningOutcomes] = useState("");
  const [principles, setPrinciples] = useState<Principle[]>([]);
  const [selectedPrinciples, setSelectedPrinciples] = useState<Set<string>>(new Set());
  const [runId, setRunId] = useState<string | null>(null);
  const [data, setData] = useState<GetRunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Fetch available principles on mount
  useEffect(() => {
    getPrinciples()
      .then((ps) => {
        setPrinciples(ps);
        setSelectedPrinciples(new Set(ps.map((p) => p.id)));
      })
      .catch(() => {
        // Fallback: use hardcoded IDs if API is unreachable
        const fallbackIds = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"];
        setSelectedPrinciples(new Set(fallbackIds));
      });
  }, []);

  const handlePrincipleChange = useCallback((ids: Set<string>) => {
    setSelectedPrinciples(ids);
  }, []);

  const progress = useMemo(() => {
    const total = selectedPrinciples.size;
    const done = data?.principle_results?.length || 0;
    return { done, total };
  }, [data, selectedPrinciples]);

  const missingContext =
    !courseLevel || !modality || !discipline.trim() || !assessmentType || !learningOutcomes.trim()
      ? "Course context is required: course level, modality, discipline, assessment type, and learning outcomes."
      : selectedPrinciples.size === 0
        ? "At least one assessment principle must be selected."
        : null;

  async function onGenerateReport() {
    setError(null);
    if (missingContext) {
      setError(missingContext);
      return;
    }
    setBusy(true);
    setData(null);
    try {
      const created = await createRun({
        mode,
        course_level: courseLevel as CourseLevel,
        modality: modality as Modality,
        discipline: discipline.trim(),
        assessment_type: assessmentType as AssessmentType,
        learning_outcome: learningOutcomes.trim(),
        text,
        file,
        selected_principles: Array.from(selectedPrinciples).join(","),
      });
      setRunId(created.run_id);
      await startEvaluate(created.run_id);
      // Wait for evaluation to finish before generating a report.
      const startedAt = Date.now();
      const timeoutMs = 5 * 60 * 1000;
      while (true) {
        const latest = await getRun(created.run_id);
        setData(latest);
        if (latest.run.status === "completed") break;
        if (latest.run.status === "failed") throw new Error(latest.run.error || "Run failed");
        if (Date.now() - startedAt > timeoutMs) throw new Error("Timed out waiting for evaluation to finish");
        await new Promise((r) => setTimeout(r, 1500));
      }

      await createReport(created.run_id);
      setData(await getRun(created.run_id));
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    const t = setInterval(async () => {
      try {
        const latest = await getRun(runId);
        if (!cancelled) setData(latest);
      } catch {
        // ignore polling errors
      }
    }, 1500);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [runId]);

  const status = data?.run?.status || (runId ? "evaluating" : "idle");
  const reportMarkdown = data?.report?.report_markdown || null;
  const showReport = !!reportMarkdown;
  const reportTopRef = useRef<HTMLDivElement | null>(null);
  const lastAutoScrolledRunIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!showReport || !runId) return;
    if (lastAutoScrolledRunIdRef.current === runId) return;
    lastAutoScrolledRunIdRef.current = runId;
    // Ensure the ReportViewer has mounted before scrolling.
    requestAnimationFrame(() => {
      reportTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [showReport, runId]);

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <header>
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-pretty text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Assessment Principles Application
            </h1>
            <p className="mt-2 max-w-3xl text-pretty text-sm leading-6 text-slate-600">
              Paste an assessment task/description (and/or upload a PDF/DOCX). Select the principles you would like the machine to use for the review and response.
            </p>
          </div>
        </div>
      </header>

      <Panel>
        <SectionHeader title="Course context" purpose="Used to contextualize the evaluation." required />

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <SelectField
              label="Course level"
              value={courseLevel}
              onChange={(e) => setCourseLevel(e.target.value as CourseLevel | "")}
              disabled={busy}
            >
              <option value="">Select…</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="graduate">Graduate</option>
            </SelectField>

            <SelectField
              label="Modality"
              labelSuffix={
                <a
                  href="https://www.ucalgary.ca/student-services/calendar-scheduling/scheduling/scheduling-guidelines/definitions-instruction-modes"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View modality definitions"
                  className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold leading-none text-slate-500 hover:border-slate-400 hover:text-slate-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  ?
                </a>
              }
              value={modality}
              onChange={(e) => setModality(e.target.value as Modality | "")}
              disabled={busy}
            >
              <option value="">Select…</option>
              <option value="in_person">In Person</option>
              <option value="blended_learning">Blended Learning</option>
              <option value="web_based">Web-based Instruction</option>
              <option value="field_school">Field School</option>
              <option value="practicum">Practicum</option>
              <option value="field_placement">Field Placement</option>
              <option value="service_learning">Service Learning</option>
              <option value="internship">Internship</option>
              <option value="co_op">Co-op</option>
              <option value="distance_education">Distance Education</option>
            </SelectField>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <TextField
              label="Discipline"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              placeholder="e.g., Biology, Computer Science, Economics"
              disabled={busy}
            />
            <SelectField
              label="Assessment Type"
              value={assessmentType}
              onChange={(e) => setAssessmentType(e.target.value as AssessmentType | "")}
              disabled={busy}
            >
              <option value="">Select…</option>
              <option value="formative">Formative</option>
              <option value="summative">Summative</option>
            </SelectField>
          </div>

          <TextareaField
            label="Learning outcomes"
            value={learningOutcomes}
            onChange={(e) => setLearningOutcomes(e.target.value)}
            placeholder="List intended learning outcomes. One per line is fine."
            rows={4}
            disabled={busy}
          />

          {missingContext ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              {missingContext}
            </div>
          ) : null}
        </div>
      </Panel>

      <Panel>
        <SectionHeader
          title="Assessment principles"
          purpose="Select which principles to evaluate against. Expand each principle to read its description."
        />
        <PrincipleSelector
          principles={principles}
          selectedIds={selectedPrinciples}
          onChange={handlePrincipleChange}
          disabled={busy}
        />
        {selectedPrinciples.size === 0 ? (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            At least one assessment principle must be selected.
          </div>
        ) : null}
      </Panel>

      <Panel>
        <SectionHeader
          title="Assessment input"
          purpose="Use Mode to indicate what you are providing: Choose 'Task' if you are providing the original assessment you will give to your students, or choose 'Description' if you are copying your assessment description from the course outline. Then, either upload a PDF/DOCX containing the assessment text or paste the assessment text directly."
        />

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <SelectField
                label="Mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                disabled={busy}
              >
                <option value="task">Task</option>
                <option value="description">Description</option>
              </SelectField>
            </div>

            <div className="sm:col-span-2">
              <FileUploadField
                label="Upload assessment document"
                helperText="PDF or DOCX."
                value={file}
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                disabled={busy}
                onChange={setFile}
              />
            </div>
          </div>

          <TextareaField
            label="Assessment text"
            helperText="You may paste text directly or upload a document."
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the assessment task/description here."
            rows={8}
            serif
            disabled={busy}
          />

          <div>
            <PrimaryButton onClick={onGenerateReport} disabled={busy || !!missingContext}>
              {busy ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Generating…
                </>
              ) : (
                "Generate report"
              )}
            </PrimaryButton>

            <StatusBar status={status} progress={runId ? progress : null} runId={runId} />
          </div>

          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-950">
              <span className="font-medium">Error:</span> <span className="whitespace-pre-wrap">{error}</span>
            </div>
          ) : null}
          {data?.run?.status === "failed" ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-950">
              <span className="font-medium">Backend error:</span>{" "}
              <span className="whitespace-pre-wrap">{data?.run?.error || "Unknown"}</span>
            </div>
          ) : null}
        </div>
      </Panel>

      <div ref={reportTopRef} />
      {showReport ? (
        <ReportViewer run={data?.run} results={data?.principle_results} markdown={reportMarkdown} />
      ) : runId ? (
        <Panel>
          {status === "failed" ? (
            <>
              <div className="text-sm font-semibold text-slate-900">Report unavailable</div>
              <p className="mt-2 text-xs text-slate-500">This run failed, so no report was generated.</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                <span>Generating report…</span>
              </div>
              <p className="mt-3 text-xs text-slate-500">The report will appear here once generation is complete.</p>
            </>
          )}
        </Panel>
      ) : null}
    </main>
  );
}

