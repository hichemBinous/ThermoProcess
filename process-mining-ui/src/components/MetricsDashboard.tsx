type Props = {
  numEvents: number;
  numCases: number;
  numActivities: number;
};

export default function MetricsDashboard({ numEvents, numCases, numActivities }: Props) {
  return (
    <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
      <div style={cardStyle}>
        <h3>Events</h3>
        <p>{numEvents}</p>
      </div>

      <div style={cardStyle}>
        <h3>Cases</h3>
        <p>{numCases}</p>
      </div>

      <div style={cardStyle}>
        <h3>Activities</h3>
        <p>{numActivities}</p>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  minWidth: "140px",
  backgroundColor: "#fafafa",
};