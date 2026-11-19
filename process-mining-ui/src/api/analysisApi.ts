const API_BASE_URL = "http://127.0.0.1:8000";

export type PreviewLogResponse = {
  message: string;
  rows: number;
  columns: string[];
  preview: Record<string, unknown>[];
};

export type StatsResponse = {
  num_events: number;
  num_cases: number;
  num_activities: number;
  activities: Record<string, number>;
  top_variants: Array<Record<string, unknown>>;
};

export type DfgEdge = {
  from: string;
  to: string;
  count: number;
};

export type DfgResponse = {
  edges: DfgEdge[];
};

export type EnergyTransition = {
  case_id: string;
  from_state: string;
  to_state: string;
  context: Record<string, unknown>;
  p_global: number;
  p_context: number;
  e_int: number;
  e_ext: number;
  e_total: number;
};

export type EnergyTransitionsResponse = {
  count: number;
  transitions: EnergyTransition[];
};

export type TraceEnergy = {
  case_id: string;
  trace_energy: number;
  avg_transition_energy: number;
  transition_count: number;
  transitions: EnergyTransition[];
};

export type TraceEnergiesResponse = {
  count: number;
  traces: TraceEnergy[];
};

export type EntropyResponse = {
  entropy: number;
  total_transitions: number;
  unique_transitions: number;
};

export async function getPreviewLog(datasourceId: number): Promise<PreviewLogResponse> {
  const response = await fetch(`${API_BASE_URL}/analysis/${datasourceId}/preview-log`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to load preview log");
  }

  return data;
}

export async function getAnalysisStats(datasourceId: number): Promise<StatsResponse> {
  const response = await fetch(`${API_BASE_URL}/analysis/${datasourceId}/stats`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to load analysis stats");
  }

  return data;
}

export async function getDfg(datasourceId: number): Promise<DfgResponse> {
  const response = await fetch(`${API_BASE_URL}/analysis/${datasourceId}/dfg`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to load DFG");
  }

  return data;
}

export async function getEnergyTransitions(datasourceId: number): Promise<EnergyTransitionsResponse> {
  const response = await fetch(`${API_BASE_URL}/analysis/${datasourceId}/energy/transitions`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to load energy transitions");
  }

  return data;
}

export async function getTraceEnergies(datasourceId: number): Promise<TraceEnergiesResponse> {
  const response = await fetch(`${API_BASE_URL}/analysis/${datasourceId}/energy/traces`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to load trace energies");
  }

  return data;
}

export async function getEntropy(datasourceId: number): Promise<EntropyResponse> {
  const response = await fetch(`${API_BASE_URL}/analysis/${datasourceId}/energy/entropy`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to load entropy");
  }

  return data;
}

export type EnergySummary = {
  total_transitions: number;
  avg_energy: number;
  max_energy: any;
  min_energy: any;
  reliable_context_ratio: number;
  top_transitions: any[];
  unreliable_count: number;
};

export async function getEnergySummary(datasourceId: number): Promise<EnergySummary> {
  const response = await fetch(`${API_BASE_URL}/analysis/${datasourceId}/energy/summary`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to load energy summary");
  }

  return data;
}

export type TraceAnomaly = {
  case_id: string;
  trace_energy: number;
  avg_transition_energy: number;
  transition_count: number;
  anomaly_score: number;
  label: "normal" | "medium_anomaly" | "high_anomaly";
};

export type TraceAnomaliesResponse = {
  mean_energy: number;
  std_energy: number;
  count: number;
  traces: TraceAnomaly[];
};

export async function getTraceAnomalies(
  datasourceId: number
): Promise<TraceAnomaliesResponse> {
  const response = await fetch(
    `${API_BASE_URL}/analysis/${datasourceId}/energy/anomalies`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to load trace anomalies");
  }

  return data;
}

export type EnergyDfgNode = {
  id: string;
  label: string;
};

export type EnergyDfgEdge = {
  from: string;
  to: string;
  count: number;
  avg_energy: number;
  max_energy: number;
};

export type EnergyDfgResponse = {
  nodes: EnergyDfgNode[];
  edges: EnergyDfgEdge[];
};

export async function getEnergyDfg(datasourceId: number): Promise<EnergyDfgResponse> {
  const response = await fetch(`${API_BASE_URL}/analysis/${datasourceId}/energy/dfg`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to load energy DFG");
  }

  return data;
}