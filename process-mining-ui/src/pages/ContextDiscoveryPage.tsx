import { useEffect, useState } from "react";

import { getDataSources } from "../api/mappingApi";
import type { DataSourceItem } from "../api/mappingApi";

import { analyzeContexts } from "../api/contextDiscoveryApi";
import type {
  ContextDiscoveryResponse,
} from "../api/contextDiscoveryApi";

export default function ContextDiscoveryPage() {
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [result, setResult] = useState<ContextDiscoveryResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDataSources()
      .then(setDataSources)
      .catch((err) => setMessage(err.message || "Failed to load sources"));
  }, []);

  const handleAnalyze = async () => {
    if (!selectedSourceId) {
      setMessage("Please select a source.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const data = await analyzeContexts(selectedSourceId);
      setResult(data);
    } catch (err: any) {
      setMessage(err.message || "Failed to analyze contexts");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Context Discovery</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <select
          value={selectedSourceId ?? ""}
          onChange={(e) =>
            setSelectedSourceId(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">Choose a source</option>
          {dataSources.map((source) => (
            <option key={source.id} value={source.id}>
              #{source.id} - {source.name}
            </option>
          ))}
        </select>

        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Contexts"}
        </button>
      </div>

      {message && <p>{message}</p>}

      {result && (
        <>
          <h2>Recommended Contexts</h2>
          <p>
            {result.recommended_contexts.length
              ? result.recommended_contexts.join(", ")
              : "No strong context found"}
          </p>

          <h2>Context Ranking</h2>

          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={cell}>Rank</th>
                <th style={cell}>Column</th>
                <th style={cell}>Type</th>
                <th style={cell}>Cardinality</th>
                <th style={cell}>MI</th>
                <th style={cell}>Entropy Gain</th>
                <th style={cell}>CIS</th>
                <th style={cell}>Support</th>
                <th style={cell}>Final Score</th>
                <th style={cell}>Main Influence</th>
              </tr>
            </thead>
            <tbody>
              {result.results.map((r, index) => (
                <tr key={r.column}>
                  <td style={cell}>{index + 1}</td>
                  <td style={cell}>{r.column}</td>
                  <td style={cell}>{r.variable_type}</td>
                  <td style={cell}>{r.cardinality}</td>
                  <td style={cell}>{r.mutual_information.toFixed(4)}</td>
                  <td style={cell}>{r.entropy_gain.toFixed(4)}</td>
                  <td style={cell}>{r.context_impact_score.toFixed(4)}</td>
                  <td style={cell}>{(r.support_ratio * 100).toFixed(1)}%</td>
                  <td style={cell}>
                    <strong>{r.final_score.toFixed(4)}</strong>
                  </td>
                  <td style={cell}>
                    {r.influenced_transitions?.length ? (
                        <ul>
                        {r.influenced_transitions.slice(0, 3).map((t, i) => (
                            <li key={i}>
                            <strong>{t.context_value}</strong>{" "}
                            {t.effect === "increases" ? "increases" : "decreases"}{" "}
                            <strong>{t.transition}</strong>
                            <br />
                            <small>
                                P global: {t.p_global.toFixed(2)} | P context: {t.p_context.toFixed(2)} | support: {t.support}
                            </small>
                            </li>
                        ))}
                        </ul>
                    ) : (
                        "No clear influence"
                    )}
                    </td>
                                    </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

const cell: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
};