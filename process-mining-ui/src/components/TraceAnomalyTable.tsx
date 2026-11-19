import type { TraceAnomaly } from "../api/analysisApi";

type Props = {
  traces: TraceAnomaly[];
};

export default function TraceAnomalyTable({ traces }: Props) {
  if (!traces.length) {
    return <p>No anomaly scores available.</p>;
  }

  return (
    <div style={{ marginTop: "24px", overflowX: "auto" }}>
      <h2>Trace Anomaly Scores</h2>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={cellStyle}>Case ID</th>
            <th style={cellStyle}>Label</th>
            <th style={cellStyle}>Anomaly Score</th>
            <th style={cellStyle}>Trace Energy</th>
            <th style={cellStyle}>Avg Transition Energy</th>
            <th style={cellStyle}>Transitions</th>
          </tr>
        </thead>

        <tbody>
          {traces.map((trace) => (
            <tr key={trace.case_id}>
              <td style={cellStyle}>{trace.case_id}</td>
              <td style={cellStyle}>{trace.label}</td>
              <td style={cellStyle}>{trace.anomaly_score.toFixed(3)}</td>
              <td style={cellStyle}>{trace.trace_energy.toFixed(3)}</td>
              <td style={cellStyle}>{trace.avg_transition_energy.toFixed(3)}</td>
              <td style={cellStyle}>{trace.transition_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const tableStyle: React.CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
};

const cellStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
  textAlign: "left",
};