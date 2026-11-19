const API_BASE_URL = "http://127.0.0.1:8000";

export type UploadResponse = {
  message: string;
  datasource_id: number;
  rows_inserted: number;
  columns_detected: string[];
  datasource_name?: string;
};

export type UploadParams = {
  file: File;
  domainId: number | string;
  datasourceName?: string;
};

export async function uploadCsv({
  file,
  domainId,
  datasourceName,
}: UploadParams): Promise<UploadResponse> {
  if (!file) {
    throw new Error("No file provided.");
  }

  if (
    domainId === undefined ||
    domainId === null ||
    String(domainId).trim() === "" ||
    String(domainId).trim().toLowerCase() === "undefined"
  ) {
    throw new Error("A valid domain ID is required.");
  }

  const formData = new FormData();
  formData.append("domain_id", String(domainId).trim());
  formData.append("datasource_name", datasourceName?.trim() || file.name);
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/ingest/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      data?.detail
        ? Array.isArray(data.detail)
          ? data.detail.map((item: any) => item.msg).join(", ")
          : data.detail
        : `Upload failed with status ${response.status}`;

    throw new Error(detail);
  }

  return data as UploadResponse;
}