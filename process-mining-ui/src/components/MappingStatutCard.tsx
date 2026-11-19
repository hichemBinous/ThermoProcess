import type { MappingStatusResponse } from "../api/mappingApi";

type Props = {
  status: MappingStatusResponse | null;
};

export default function MappingStatusCard({ status }: Props) {
  if (!status) {
    return null;
  }

  const mapping = status.saved_mapping;

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", marginTop: "20px" }}>
      <h2>Mapping Status</h2>

      <p><strong>Applied:</strong> {status.applied ? "Yes" : "No"}</p>
      <p><strong>Last applied at:</strong> {status.last_applied_at || "Never"}</p>
      <p><strong>Raw events count:</strong> {status.raw_events_count}</p>
      <p><strong>Ready for analysis:</strong> {status.mapping_for_analysis ? "Yes" : "No"}</p>

      <h3>Saved Mapping</h3>
      <ul>
        <li><strong>Case ID:</strong> {mapping.case_id_column}</li>
        <li><strong>Activity:</strong> {mapping.activity_column}</li>
        <li><strong>Timestamp:</strong> {mapping.timestamp_column}</li>
        <li><strong>Resource:</strong> {mapping.resource_column || "None"}</li>
        <li><strong>Context:</strong> {mapping.context_columns.length ? mapping.context_columns.join(", ") : "None"}</li>
      </ul>

      <h3>Mapping used for analysis</h3>
      <p>
        {status.mapping_for_analysis
          ? "The currently applied mapping will be used for analysis."
          : "No applied mapping is currently ready for analysis."}
      </p>
    </div>
  );
}