import type { DfgEdge } from "../api/analysisApi";

type Props = {
  edges: DfgEdge[];
};

export default function ProcessGraph({ edges }: Props) {
  if (!edges.length) {
    return <p>No DFG edges available.</p>;
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Directly-Follows Graph</h3>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={cellStyle}>From</th>
            <th style={cellStyle}>To</th>
            <th style={cellStyle}>Count</th>
          </tr>
        </thead>
        <tbody>
          {edges.map((edge, index) => (
            <tr key={index}>
              <td style={cellStyle}>{edge.from}</td>
              <td style={cellStyle}>{edge.to}</td>
              <td style={cellStyle}>{edge.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
};