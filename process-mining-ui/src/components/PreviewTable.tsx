type Props = {
  columns: string[];
  rows: Record<string, unknown>[];
};

export default function PreviewTable({ columns, rows }: Props) {
  if (!columns.length || !rows.length) {
    return <p>No preview data available.</p>;
  }

  return (
    <div style={{ overflowX: "auto", marginTop: "20px" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} style={cellStyle}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((col) => (
                <td key={col} style={cellStyle}>
                  {String(row[col] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
  textAlign: "left",
};