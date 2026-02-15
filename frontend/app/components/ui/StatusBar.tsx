export function StatusBar({
  status,
  progress,
  runId
}: {
  status: string;
  progress?: { done: number; total: number } | null;
  runId?: string | null;
}) {
  const statusColor =
    status === "completed"
      ? "text-green-800"
      : status === "failed"
        ? "text-red-800"
        : status === "evaluating"
          ? "text-burgundy-900"
          : "text-stone-600";

  return (
    <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-stone-600">
      <span className="flex items-center gap-2">
        <span className="font-semibold uppercase tracking-wide text-stone-500">Status</span>
        <span className={`font-medium ${statusColor}`}>{status}</span>
      </span>
      {progress ? (
        <span className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wide text-stone-500">Progress</span>
          <span className="font-medium text-stone-800">
            {progress.done} <span className="text-stone-400">/</span> {progress.total}
          </span>
        </span>
      ) : null}
      {runId ? (
        <span className="flex min-w-0 items-center gap-2 truncate">
          <span className="font-semibold uppercase tracking-wide text-stone-500">Run</span>
          <code className="rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 font-mono text-[11px] text-stone-700">
            {runId}
          </code>
        </span>
      ) : null}
    </div>
  );
}
