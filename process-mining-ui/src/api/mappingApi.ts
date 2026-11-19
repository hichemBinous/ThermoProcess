const API_BASE_URL = "http://127.0.0.1:8000";

export type DataSourceItem = {
  id: number;
  name: string;
  source_type: string;
  domain_id: number;
};

export type MappingPayload = {
  case_id_column: string;
  activity_column: string;
  timestamp_column: string;
  resource_column: string | null;
  context_columns: string[];
};

export type MappingResponse = {
  id: number;
  datasource_id: number;
  case_id_column: string;
  activity_column: string;
  timestamp_column: string;
  resource_column: string | null;
  context_columns: string[];
};

export async function getDataSources(): Promise<DataSourceItem[]> {
  const response = await fetch(`${API_BASE_URL}/sources`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to load data sources");
  }

  return data;
}

export async function getSourceColumns(datasourceId: number): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/mapping/${datasourceId}/columns`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to load source columns");
  }

  return data.columns || [];
}

export async function getSourceMapping(datasourceId: number): Promise<MappingResponse | null> {
  const response = await fetch(`${API_BASE_URL}/mapping/${datasourceId}`);

  if (response.status === 404) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to load mapping");
  }

  return data;
}

export async function saveSourceMapping(
  datasourceId: number,
  payload: MappingPayload
): Promise<MappingResponse> {
  const response = await fetch(`${API_BASE_URL}/mapping/${datasourceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to save mapping");
  }

  return data;
}
export async function applySourceMapping(datasourceId: number) {
  const response = await fetch(`${API_BASE_URL}/mapping/${datasourceId}/apply`, {
    method: "POST",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to apply mapping");
  }

  return data;
}
export type MappingStatusResponse = {
  datasource_id: number;
  saved_mapping: {
    case_id_column: string;
    activity_column: string;
    timestamp_column: string;
    resource_column: string | null;
    context_columns: string[];
  };
  applied: boolean;
  last_applied_at: string | null;
  raw_events_count: number;
  mapping_for_analysis: boolean;
};

export async function getMappingStatus(datasourceId: number): Promise<MappingStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/mapping/${datasourceId}/status`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to load mapping status");
  }

  return data;
}