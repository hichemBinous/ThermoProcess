import { useEffect, useState } from "react";
import {
  getPreviewLog,
  getAnalysisStats,
  getDfg,
  getEnergyTransitions,
  getTraceEnergies,
  getEntropy,
} from "../api/analysisApi";
import type {
  PreviewLogResponse,
  StatsResponse,
  DfgResponse,
  EnergyTransitionsResponse,
  TraceEnergiesResponse,
  EntropyResponse,
  EnergySummary,
  TraceAnomaliesResponse,
  EnergyDfgResponse
} from "../api/analysisApi";
import { getDataSources, applySourceMapping, getMappingStatus } from "../api/mappingApi";
import type { DataSourceItem, MappingStatusResponse } from "../api/mappingApi";

import MetricsDashboard from "../components/MetricsDashboard";
import PreviewTable from "../components/PreviewTable";
import ProcessGraph from "../components/ProcessGraph";
import MappingStatusCard from "../components/MappingStatutCard";
import EnergySummaryCard from "../components/EnergySummaryCard";
import EnergyTransitionsTable from "../components/EnergyTransitionTable";
import TopTraceEnergiesTable from "../components/TopTraceEnergiesTable";
import { getEnergySummary } from "../api/analysisApi";
import EnergySummaryAdvanced from "../components/EnergySummaryAdvanced";
import { getTraceAnomalies } from "../api/analysisApi";
import TraceAnomalyTable from "../components/TraceAnomalyTable";
import { getEnergyDfg } from "../api/analysisApi";
import EnergyProcessGraph from "../components/EnergyProcessGraph";
import CollapsibleSection from "../components/collapsibleSection";
import { Link } from "react-router-dom";

export default function AnalysisPage() {
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);

  const [previewData, setPreviewData] = useState<PreviewLogResponse | null>(null);
  const [statsData, setStatsData] = useState<StatsResponse | null>(null);
  const [dfgData, setDfgData] = useState<DfgResponse | null>(null);
  const [mappingStatus, setMappingStatus] = useState<MappingStatusResponse | null>(null);

  const [energyTransitionsData, setEnergyTransitionsData] = useState<EnergyTransitionsResponse | null>(null);
  const [traceEnergiesData, setTraceEnergiesData] = useState<TraceEnergiesResponse | null>(null);
  const [entropyData, setEntropyData] = useState<EntropyResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("");
  const [energySummary, setEnergySummary] = useState<EnergySummary | null>(null);
  const [traceAnomalies, setTraceAnomalies] = useState<TraceAnomaliesResponse | null>(null);
  const [energyDfg, setEnergyDfg] = useState<EnergyDfgResponse | null>(null);
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

  useEffect(() => {
    const loadStatus = async () => {
      if (!selectedSourceId) {
        setMappingStatus(null);
        return;
      }

      try {
        const status = await getMappingStatus(selectedSourceId);
        setMappingStatus(status);
      } catch {
        setMappingStatus(null);
      }
    };

    loadStatus();
  }, [selectedSourceId]);

  const handleApplyMapping = async () => {
    if (!selectedSourceId) {
      setMessage("Please select a data source.");
      return;
    }

    try {
      setApplying(true);
      setMessage("");

      const result = await applySourceMapping(selectedSourceId);
      const status = await getMappingStatus(selectedSourceId);
      setMappingStatus(status);

      setMessage(
        `Mapping applied successfully. Inserted: ${result.inserted_count}, Skipped: ${result.skipped_count}`
      );
    } catch (error: any) {
      setMessage(error.message || "Failed to apply mapping");
    } finally {
      setApplying(false);
    }
  };

  const handleLoadAnalysis = async () => {
    
    if (!selectedSourceId) {
      setMessage("Please select a data source.");
      
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const [
        preview,
        stats,
        dfg,
        energyTransitions,
        traceEnergies,
        entropy,
        summary,
        anomalies,
        energyDfgResult
      ] = await Promise.all([
        getPreviewLog(selectedSourceId),
        getAnalysisStats(selectedSourceId),
        getDfg(selectedSourceId),
        getEnergyTransitions(selectedSourceId),
        getTraceEnergies(selectedSourceId),
        getEntropy(selectedSourceId),
        getEnergySummary(selectedSourceId),
        getTraceAnomalies(selectedSourceId),
        getEnergyDfg(selectedSourceId),
      ]);

      setPreviewData(preview);
      setStatsData(stats);
      setDfgData(dfg);
      setEnergyTransitionsData(energyTransitions);
      setTraceEnergiesData(traceEnergies);
      setEntropyData(entropy);
      setEnergySummary(summary);
      setTraceAnomalies(anomalies);
      setEnergyDfg(energyDfgResult)
    } catch (error: any) {
      setMessage(error.message || "Failed to load analysis");

      setPreviewData(null);
      setStatsData(null);
      setDfgData(null);
      setEnergyTransitionsData(null);
      setTraceEnergiesData(null);
      setEntropyData(null);
      setEnergySummary(null);
      setTraceAnomalies(null);
      setEnergyDfg(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Analysis</h1>

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

        <button
          onClick={handleApplyMapping}
          disabled={applying || !selectedSourceId}
          style={{ marginLeft: "12px" }}
        >
          {applying ? "Applying..." : "Apply Mapping"}
        </button>

        <button
          onClick={handleLoadAnalysis}
          disabled={loading || !selectedSourceId}
          style={{ marginLeft: "12px" }}
        >
          {loading ? "Loading..." : "Load Analysis"}
        </button>
      </div>
      {selectedSourceId && (
        <Link
          to={`/process-explorer?datasourceId=${selectedSourceId}`}
          style={{ marginLeft: "12px" }}
        >
          Open Process Explorer
        </Link>
      )}
      {message && <p>{message}</p>}
      <CollapsibleSection title="Mapping Status" defaultOpen>
        <MappingStatusCard status={mappingStatus} />
      </CollapsibleSection>

      <CollapsibleSection title="Metrics Dashboard" defaultOpen>
        {statsData && (
          <MetricsDashboard
            numEvents={statsData.num_events}
            numCases={statsData.num_cases}
            numActivities={statsData.num_activities}
          />
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Energy Summary">
        <EnergySummaryCard entropyData={entropyData} />
        <EnergySummaryAdvanced data={energySummary} />
      </CollapsibleSection>

      <CollapsibleSection title="Preview Log">
        {previewData && (
          <PreviewTable columns={previewData.columns} rows={previewData.preview} />
        )}
      </CollapsibleSection>

      <CollapsibleSection title="DFG">
        <EnergyProcessGraph data={energyDfg} />
        {dfgData && <ProcessGraph edges={dfgData.edges} />}
      </CollapsibleSection>

      <CollapsibleSection title="Energy Transitions">
        {energyTransitionsData && (
          <EnergyTransitionsTable
            transitions={energyTransitionsData.transitions.slice(0, 100)}
          />
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Trace Energies">
        {traceEnergiesData && (
          <TopTraceEnergiesTable traces={traceEnergiesData.traces.slice(0, 50)} />
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Trace Anomaly Scores">
        {traceAnomalies && (
          <TraceAnomalyTable traces={traceAnomalies.traces.slice(0, 50)} />
        )}
      </CollapsibleSection>
      <CollapsibleSection title="Top variants">
        {statsData && (
        <div style={{ marginTop: "24px" }}>
          <h2>Top Variants</h2>
          <pre style={preStyle}>{JSON.stringify(statsData.top_variants, null, 2)}</pre>
        </div>
      )}
      </CollapsibleSection>
      <CollapsibleSection title="Activities count">
        {statsData && (
        <div style={{ marginTop: "24px" }}>
          <h2>Activities</h2>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={cellStyle}>Activity</th>
                <th style={cellStyle}>Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(statsData.activities).map(([activity, count]) => (
                <tr key={activity}>
                  <td style={cellStyle}>{activity}</td>
                  <td style={cellStyle}>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </CollapsibleSection>

      

      

      

      
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
  textAlign: "left",
};

const preStyle: React.CSSProperties = {
  background: "#f5f5f5",
  padding: "12px",
  borderRadius: "8px",
  overflowX: "auto",
};