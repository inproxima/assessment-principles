export function StatusBar({
  status,
  progress,
  runId
}: {
  status: string;
  progress?: { done: number; total: number } | null;
  runId?: string | null;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-slate-600">
      <span>
        <span className="font-medium text-slate-700">Status:</span> {status}
      </span>
      {progress ? (
        <span>
          <span className="font-medium text-slate-700">Progress:</span> {progress.done} / {progress.total}
        </span>
      ) : null}
      {runId ? (
        <span className="min-w-0 truncate">
          <span className="font-medium text-slate-700">Run ID:</span>{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-800">{runId}</code>
        </span>
      ) : null}
    </div>
  );
}

