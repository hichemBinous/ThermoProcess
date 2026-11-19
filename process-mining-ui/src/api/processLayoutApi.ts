const API_BASE_URL = "http://127.0.0.1:8000";

export type NodePosition = {
  x: number;
  y: number;
};

export type ProcessLayoutResponse = {
  datasource_id: number;
  layout: Record<string, NodePosition>;
};

export async function getProcessLayout(
  datasourceId: number
): Promise<ProcessLayoutResponse> {
  const response = await fetch(`${API_BASE_URL}/process-layouts/${datasourceId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to load process layout");
  }

  return data;
}

export async function saveProcessLayout(
  datasourceId: number,
  layout: Record<string, NodePosition>
) {
  const response = await fetch(`${API_BASE_URL}/process-layouts/${datasourceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ layout }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to save process layout");
  }

  return data;
}