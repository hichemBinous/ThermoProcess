import { useEffect, useState } from "react";
import { getDataSources } from "../api/mappingApi";
import type { DataSourceItem } from "../api/mappingApi";

import MappingEditor from "../components/MappingEditor";

export default function MappingPage() {
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadSources = async () => {
      try {
        const sources = await getDataSources();
        setDataSources(sources);
      } catch (error: any) {
        setMessage(error.message || "Failed to load data sources");
      }
    };

    loadSources();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Mapping Configuration</h1>

      {message && <p>{message}</p>}

      <div style={{ marginBottom: "20px" }}>
        <label>Select a data source</label>
        <br />
        <select
          value={selectedSourceId ?? ""}
          onChange={(e) =>
            setSelectedSourceId(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">Choose a source</option>
          {dataSources.map((source) => (
            <option key={source.id} value={source.id}>
              #{source.id} - {source.name} ({source.source_type})
            </option>
          ))}
        </select>
      </div>

      <MappingEditor datasourceId={selectedSourceId} />
    </div>
  );
}