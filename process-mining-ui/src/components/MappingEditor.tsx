import React, { useEffect, useState } from "react";

type MappingPayload = {
  case_id_column: string;
  activity_column: string;
  timestamp_column: string;
  resource_column: string | null;
  context_columns: string[];
};

type ExistingMapping = {
  id: number;
  datasource_id: number;
  case_id_column: string;
  activity_column: string;
  timestamp_column: string;
  resource_column: string | null;
  context_columns: string[];
};

type Props = {
  datasourceId: number | null;
};

const API_BASE_URL = "http://127.0.0.1:8000";

const MappingEditor: React.FC<Props> = ({ datasourceId }) => {
  const [columns, setColumns] = useState<string[]>([]);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [saving, setSaving] = useState(false);

  const [caseIdColumn, setCaseIdColumn] = useState("");
  const [activityColumn, setActivityColumn] = useState("");
  const [timestampColumn, setTimestampColumn] = useState("");
  const [resourceColumn, setResourceColumn] = useState("");
  const [contextColumns, setContextColumns] = useState<string[]>([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!datasourceId) return;

    setLoadingColumns(true);
    setError("");
    setMessage("");

    fetch(`${API_BASE_URL}/mapping/${datasourceId}/columns`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to load columns");
        }
        return res.json();
      })
      .then((data) => {
        setColumns(data.columns || []);
      })
      .catch((err) => {
        setError(err.message || "Error loading columns");
      })
      .finally(() => {
        setLoadingColumns(false);
      });
  }, [datasourceId]);

  useEffect(() => {
    if (!datasourceId) return;

    fetch(`${API_BASE_URL}/mapping/${datasourceId}`)
      .then(async (res) => {
        if (res.status === 404) return null;
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to load mapping");
        }
        return res.json();
      })
      .then((data: ExistingMapping | null) => {
        if (!data) return;

        setCaseIdColumn(data.case_id_column || "");
        setActivityColumn(data.activity_column || "");
        setTimestampColumn(data.timestamp_column || "");
        setResourceColumn(data.resource_column || "");
        setContextColumns(data.context_columns || []);
      })
      .catch((err) => {
        console.error("Error loading existing mapping:", err.message);
      });
  }, [datasourceId]);

  const handleContextChange = (column: string) => {
    setContextColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

  const handleSave = async () => {
    if (!datasourceId) return;

    setError("");
    setMessage("");

    if (!caseIdColumn || !activityColumn || !timestampColumn) {
      setError("Case ID, Activity and Timestamp are required.");
      return;
    }

    const payload: MappingPayload = {
      case_id_column: caseIdColumn,
      activity_column: activityColumn,
      timestamp_column: timestampColumn,
      resource_column: resourceColumn || null,
      context_columns: contextColumns,
    };

    try {
      setSaving(true);

      const res = await fetch(`${API_BASE_URL}/mapping/${datasourceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to save mapping");
      }

      setMessage("Mapping saved successfully.");
    } catch (err: any) {
      setError(err.message || "Error saving mapping");
    } finally {
      setSaving(false);
    }
  };

  if (!datasourceId) {
    return <p>Please select a datasource first.</p>;
  }

  return (
    <div style={styles.container}>
      <h2>Dynamic Mapping</h2>

      {loadingColumns ? <p>Loading columns...</p> : null}
      {error ? <p style={styles.error}>{error}</p> : null}
      {message ? <p style={styles.success}>{message}</p> : null}

      {!loadingColumns && columns.length > 0 && (
        <>
          <div style={styles.field}>
            <label>Case ID column</label>
            <select
              value={caseIdColumn}
              onChange={(e) => setCaseIdColumn(e.target.value)}
            >
              <option value="">Select a column</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label>Activity column</label>
            <select
              value={activityColumn}
              onChange={(e) => setActivityColumn(e.target.value)}
            >
              <option value="">Select a column</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label>Timestamp column</label>
            <select
              value={timestampColumn}
              onChange={(e) => setTimestampColumn(e.target.value)}
            >
              <option value="">Select a column</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label>Resource column (optional)</label>
            <select
              value={resourceColumn}
              onChange={(e) => setResourceColumn(e.target.value)}
            >
              <option value="">None</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label>Context columns</label>
            <div style={styles.checkboxContainer}>
              {columns.map((col) => (
                <label key={col} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={contextColumns.includes(col)}
                    onChange={() => handleContextChange(col)}
                  />
                  {col}
                </label>
              ))}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} style={styles.button}>
            {saving ? "Saving..." : "Save Mapping"}
          </button>
        </>
      )}

      {!loadingColumns && columns.length === 0 && (
        <p>No columns found for this datasource.</p>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    maxWidth: "700px",
    marginTop: "20px",
  },
  field: {
    marginBottom: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  checkboxContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(180px, 1fr))",
    gap: "8px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  button: {
    padding: "10px 16px",
    cursor: "pointer",
  },
  error: {
    color: "red",
  },
  success: {
    color: "green",
  },
};

export default MappingEditor;