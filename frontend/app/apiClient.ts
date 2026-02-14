export type Principle = {
  id: string;
  title: string;
  description: string;
};

export type Run = {
  id: string;
  created_at: string;
  input_type: "task" | "description";
  source: "text" | "upload";
  course_level?: "undergraduate" | "graduate" | null;
  modality?: "online" | "in_person" | "hybrid" | null;
  discipline?: string | null;
  assessment_type?: "formative" | "summative" | null;
  learning_outcome?: string | null;
  original_text: string;
  generated_description?: string | null;
  model: string;
  status: "created" | "evaluating" | "completed" | "failed";
  error?: string | null;
};

export type PrincipleResult = {
  id: string;
  created_at: string;
  run_id: string;
  principle_id: string;
  principle_title: string;
  json_output: string;
  meets_level: string;
};

export type Report = {
  id: string;
  created_at: string;
  run_id: string;
  report_markdown: string;
};

export type GetRunResponse = {
  run: Run;
  principle_results: PrincipleResult[];
  report: Report | null;
};

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
}

export async function getPrinciples(): Promise<Principle[]> {
  const res = await fetch(`${apiBase()}/api/principles`, { method: "GET" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createRun(params: {
  mode: "task" | "description";
  course_level: "undergraduate" | "graduate";
  modality: "online" | "in_person" | "hybrid";
  discipline: string;
  assessment_type: "formative" | "summative";
  learning_outcome: string;
  text?: string;
  file?: File | null;
  selected_principles?: string;
}): Promise<{ run_id: string }> {
  const form = new FormData();
  form.append("mode", params.mode);
  form.append("course_level", params.course_level);
  form.append("modality", params.modality);
  form.append("discipline", params.discipline);
  form.append("assessment_type", params.assessment_type);
  form.append("learning_outcome", params.learning_outcome);
  if (params.text) form.append("text", params.text);
  if (params.file) form.append("file", params.file);
  if (params.selected_principles) form.append("selected_principles", params.selected_principles);

  const res = await fetch(`${apiBase()}/api/runs`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function startEvaluate(runId: string): Promise<{ status: string }> {
  const res = await fetch(`${apiBase()}/api/runs/${runId}/evaluate`, { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getRun(runId: string): Promise<GetRunResponse> {
  const res = await fetch(`${apiBase()}/api/runs/${runId}`, { method: "GET" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createReport(runId: string): Promise<{ report_markdown: string }> {
  const res = await fetch(`${apiBase()}/api/runs/${runId}/report`, { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

