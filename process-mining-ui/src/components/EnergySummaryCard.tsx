import type { EntropyResponse } from "../api/analysisApi";

type Props = {
  entropyData: EntropyResponse | null;
};

export default function EnergySummaryCard({ entropyData }: Props) {
  if (!entropyData) return null;

  return (
    <div style={cardStyle}>
      <h2>Energy Summary</h2>
      <div style={gridStyle}>
        <div style={itemStyle}>
          <strong>Entropy</strong>
          <div>{entropyData.entropy.toFixed(4)}</div>
        </div>

        <div style={itemStyle}>
          <strong>Total transitions</strong>
          <div>{entropyData.total_transitions}</div>
        </div>

        <div style={itemStyle}>
          <strong>Unique transitions</strong>
          <div>{entropyData.unique_transitions}</div>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  marginTop: "24px",
  backgroundColor: "#fafafa",
};

const gridStyle: React.CSSProperties = {
  display: "flex",
  gap: "16px",
  flexWrap: "wrap",
  marginTop: "12px",
};

const itemStyle: React.CSSProperties = {
  minWidth: "160px",
  padding: "12px",
  border: "1px solid #eee",
  borderRadius: "8px",
  backgroundColor: "#fff",
};