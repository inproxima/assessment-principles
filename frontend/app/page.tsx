"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createReport, createRun, getPrinciples, getRun, startEvaluate, type GetRunResponse, type Principle } from "./apiClient";
import { PrincipleSelector } from "./components/PrincipleSelector";
import { AboutPanel } from "./components/AboutPanel";
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
    <main className="mx-auto max-w-4xl space-y-10 px-6 py-10 sm:py-14">
      {/* ─── Header ─── */}
      <header className="animate-fade-up stagger-1">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-burgundy-900/60">
              Assessment Principles
            </p>
            <h1 className="mt-2 font-display text-3xl tracking-tight text-stone-900 sm:text-4xl">
              Studio
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-stone-500">
              Welcome to the University of Calgary Assessment Principles Studio! This AI-powered online
              tool helps you explore how your assessment tasks align with UCalgary&rsquo;s Assessment
              Principles and generates a personalized feedback report with practical recommendations.
              The output from this tool is intended to offer an opportunity to reflect on your
              assessment design, purpose, and effectiveness.
            </p>
            <div className="mt-4 max-w-2xl rounded-lg border border-amber-200/80 bg-amber-50/50 px-4 py-3 text-[13px] leading-relaxed text-amber-900">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle" />
              This tool <span className="font-semibold">does not</span> store any information. If you
              want to keep a Feedback Report, please download it in PDF or Markdown format using the
              buttons just above your feedback report.
            </div>
          </div>
        </div>
      </header>

      {/* ─── Decorative divider ─── */}
      <div className="divider-diamond animate-fade-in stagger-2" aria-hidden="true">
        <span className="diamond" />
      </div>

      {/* ─── About / How it works ─── */}
      <div className="animate-fade-up stagger-2">
        <AboutPanel />
      </div>

      {/* ─── Section 1: Course Context ─── */}
      <div className="animate-fade-up stagger-2">
        <Panel>
          <SectionHeader title="Course Context" purpose="Provide details about the course to contextualize the evaluation." required />

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <SelectField
                label="Course level"
                value={courseLevel}
                onChange={(e) => setCourseLevel(e.target.value as CourseLevel | "")}
                disabled={busy}
              >
                <option value="">Select&hellip;</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate</option>
              </SelectField>

              <SelectField
                label="Modality"
                labelSuffix={
                  <span className="group/tip relative ml-2 inline-flex">
                    <a
                      href="https://www.ucalgary.ca/student-services/calendar-scheduling/scheduling/scheduling-guidelines/definitions-instruction-modes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-stone-300 text-[9px] font-bold leading-none text-stone-400 transition-colors group-hover/tip:border-burgundy-700 group-hover/tip:text-burgundy-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ?
                    </a>
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-stone-900 px-3 py-2 text-xs font-normal normal-case tracking-normal text-white opacity-0 shadow-warm-lg transition-opacity duration-200 group-hover/tip:opacity-100">
                      View modality definitions at UCalgary
                      <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-stone-900" />
                    </span>
                  </span>
                }
                value={modality}
                onChange={(e) => setModality(e.target.value as Modality | "")}
                disabled={busy}
              >
                <option value="">Select&hellip;</option>
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
                label="Assessment type"
                helperText="Choose 'Summative' for a graded assessment, or 'Formative' for an ungraded one."
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value as AssessmentType | "")}
                disabled={busy}
              >
                <option value="">Select&hellip;</option>
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
              <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-4 py-3 text-[13px] text-amber-900">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                {missingContext}
              </div>
            ) : null}
          </div>
        </Panel>
      </div>

      {/* ─── Section 2: Assessment Principles ─── */}
      <div className="animate-fade-up stagger-3">
        <Panel>
          <SectionHeader
            title="Assessment Principles"
            purpose="Select which principles to evaluate against. We suggest you focus on 2 or 3 rather than all 11. Expand each principle to read its description. There is no expectation that any single assessment task will meet all of these principles."
          />
          <PrincipleSelector
            principles={principles}
            selectedIds={selectedPrinciples}
            onChange={handlePrincipleChange}
            disabled={busy}
          />
          {selectedPrinciples.size === 0 ? (
            <div className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/50 px-4 py-3 text-[13px] text-amber-900">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              At least one assessment principle must be selected.
            </div>
          ) : null}
        </Panel>
      </div>

      {/* ─── Section 3: Assessment Input ─── */}
      <div className="animate-fade-up stagger-4">
        <Panel>
          <SectionHeader
            title="Assessment Input"
            purpose="Choose 'Task' if providing the original assessment, or 'Description' for your course outline description. Upload a document or paste text directly."
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
                  label="Upload document"
                  helperText="PDF or DOCX accepted."
                  value={file}
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  disabled={busy}
                  onChange={setFile}
                />
              </div>
            </div>

            <TextareaField
              label="Assessment text"
              helperText="You may paste text directly or upload a document above."
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the assessment task or description here."
              rows={8}
              serif
              disabled={busy}
            />

            <div className="flex flex-col gap-4 border-t border-stone-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <PrimaryButton onClick={onGenerateReport} disabled={busy || !!missingContext}>
                {busy ? (
                  <>
                    <span className="mr-2.5 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Generating&hellip;
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                    </svg>
                    Generate report
                  </>
                )}
              </PrimaryButton>

              <StatusBar status={status} progress={runId ? progress : null} runId={runId} />
            </div>

            {error ? (
              <div className="rounded-lg border border-rose-200/80 bg-rose-50/50 px-4 py-3 text-[13px] text-rose-900">
                <span className="mr-1.5 font-semibold">Error:</span>
                <span className="whitespace-pre-wrap">{error}</span>
              </div>
            ) : null}
            {data?.run?.status === "failed" ? (
              <div className="rounded-lg border border-rose-200/80 bg-rose-50/50 px-4 py-3 text-[13px] text-rose-900">
                <span className="mr-1.5 font-semibold">Backend error:</span>
                <span className="whitespace-pre-wrap">{data?.run?.error || "Unknown"}</span>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>

      {/* ─── Report ─── */}
      <div ref={reportTopRef} />
      {showReport ? (
        <div className="animate-fade-up">
          <ReportViewer run={data?.run} results={data?.principle_results} markdown={reportMarkdown} />
        </div>
      ) : runId ? (
        <div className="animate-fade-up">
          <Panel>
            {status === "failed" ? (
              <>
                <div className="font-display text-lg text-stone-900">Report unavailable</div>
                <p className="mt-2 text-sm text-stone-500">This run failed, so no report was generated.</p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="relative mb-5">
                  <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-stone-200 border-t-burgundy-900" />
                </div>
                <div className="font-display text-lg text-stone-800">Generating report&hellip;</div>
                <p className="mt-2 max-w-sm text-sm text-stone-500">
                  Your assessment is being evaluated against the selected principles. The report will appear here once complete.
                </p>
              </div>
            )}
          </Panel>
        </div>
      ) : null}

      {/* ─── Footer ─── */}
      <footer className="animate-fade-in stagger-6 space-y-6 pb-8">
        <div className="divider-diamond" aria-hidden="true">
          <span className="diamond" />
        </div>

        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-burgundy-900/50">
              Background
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-stone-500">
              In 2025, the University of Calgary endorsed 11 Principles for the Assessment of Student
              Learning to guide, clarify, and inspire assessment innovation across the institution.
              These Principles emerged from a two-year development process involving a comprehensive
              literature review, a nationwide environmental scan, and consultations with over 450
              university community members.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px]">
            <a
              href="https://teaching-learning.ucalgary.ca/resources-educators/assessment-principles"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-burgundy-900 underline decoration-burgundy-900/30 underline-offset-2 hover:decoration-burgundy-900"
            >
              About the Assessment Principles
            </a>
            <a
              href="https://taylorinstitute.ucalgary.ca/assessment-student-learning"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-burgundy-900 underline decoration-burgundy-900/30 underline-offset-2 hover:decoration-burgundy-900"
            >
              Strategies &amp; resources
            </a>
            <a
              href="https://taylorinstitute.ucalgary.ca/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-burgundy-900 underline decoration-burgundy-900/30 underline-offset-2 hover:decoration-burgundy-900"
            >
              Contact the Taylor Institute
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-stone-400">Assessment Principles Studio</p>
      </footer>
    </main>
  );
}
