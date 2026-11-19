import { useState } from "react";
import { uploadCsv } from "../api/uploadApi";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [domainId, setDomainId] = useState("");
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    try {
      setMessage("");

      if (!selectedFile) {
        setMessage("Please select a file first.");
        return;
      }

      if (!domainId.trim()) {
        setMessage("Please enter a domain ID.");
        return;
      }

      const result = await uploadCsv({
        file: selectedFile,
        domainId,
        datasourceName: selectedFile.name,
      });

      setMessage(
        `Upload successful. Datasource ID: ${result.datasource_id}, Rows inserted: ${result.rows_inserted}`
      );
      console.log("Upload result:", result);
    } catch (error: any) {
      console.error("Upload error:", error);
      setMessage(error.message || "Upload failed.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Upload CSV</h1>

      <div style={{ marginBottom: "12px" }}>
        <label>Domain ID: </label>
        <input
          type="number"
          value={domainId}
          onChange={(e) => setDomainId(e.target.value)}
          placeholder="Enter domain ID"
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setSelectedFile(file);
            console.log("Selected file:", file);
          }}
        />
      </div>

      <button onClick={handleUpload}>Upload</button>

      {message && <p style={{ marginTop: "12px" }}>{message}</p>}
    </div>
  );
}