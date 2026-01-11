import type { PrincipleResult } from "../apiClient";

function badgeColor(level: string): string {
  switch (level) {
    case "meets":
      return "#0f766e";
    case "partially_meets":
      return "#a16207";
    case "does_not_meet":
      return "#b91c1c";
    default:
      return "#374151";
  }
}

export function ResultsTable({ results }: { results: PrincipleResult[] }) {
  if (!results.length) return null;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Principle</th>
            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Rating</th>
            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Raw JSON</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id}>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", minWidth: 280 }}>
                <div style={{ fontWeight: 600 }}>
                  ({r.principle_id}) {r.principle_title}
                </div>
              </td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", minWidth: 140 }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "#f3f4f6",
                    color: badgeColor(r.meets_level),
                    fontWeight: 600
                  }}
                >
                  {r.meets_level}
                </span>
              </td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    background: "#0b1020",
                    color: "#e5e7eb",
                    padding: 10,
                    borderRadius: 8
                  }}
                >
                  {r.json_output}
                </pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

