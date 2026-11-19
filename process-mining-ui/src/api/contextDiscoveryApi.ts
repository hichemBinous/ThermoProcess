const API_BASE_URL = "http://127.0.0.1:8000";

export type ContextDiscoveryResult = {
    influenced_transitions: {
    transition: string;
    context_value: string;
    p_global: number;
    p_context: number;
    e_ext: number;
    effect: "increases" | "decreases" | "neutral";
    support: number;
    }[];
  column: string;
  variable_type: string;
  cardinality: number;
  mutual_information: number;
  entropy_gain: number;
  context_impact_score: number;
  avg_abs_e_ext: number;
  support_ratio: number;
  valid_samples: number;
  final_score: number;
};

export type ContextDiscoveryResponse = {
  datasource_id: number;
  candidate_count: number;
  results: ContextDiscoveryResult[];
  recommended_contexts: string[];
};

export async function analyzeContexts(
  datasourceId: number
): Promise<ContextDiscoveryResponse> {
  const response = await fetch(`${API_BASE_URL}/context-discovery/${datasourceId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to analyze contexts");
  }

  return data;
}