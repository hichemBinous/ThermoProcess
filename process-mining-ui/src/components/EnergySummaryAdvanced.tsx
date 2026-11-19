import type { EnergySummary } from "../api/analysisApi";

type Props = {
  data: EnergySummary | null;
};

export default function EnergySummaryAdvanced({ data }: Props) {
  if (!data) return null;

  return (
    <div style={card}>
      <h2>Energy Overview</h2>

      <p><strong>Total transitions:</strong> {data.total_transitions}</p>
      <p><strong>Average energy:</strong> {data.avg_energy.toFixed(3)}</p>
      <p><strong>Reliable context ratio:</strong> {(data.reliable_context_ratio * 100).toFixed(1)}%</p>
      <p><strong>Unreliable contexts:</strong> {data.unreliable_count}</p>

      <h3>🔥 Highest Energy Transition</h3>
      <pre>{JSON.stringify(data.max_energy, null, 2)}</pre>

      <h3>Top 10 Critical Transitions</h3>
      <ul>
        {data.top_transitions.map((t, i) => (
          <li key={i}>
            {t.from_state} → {t.to_state} | E = {t.e_total.toFixed(3)}
          </li>
        ))}
      </ul>
    </div>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "16px",
  borderRadius: "8px",
  marginTop: "20px",
};