import { useState } from "react";

type Props = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={containerStyle}>
      <button onClick={() => setOpen(!open)} style={buttonStyle}>
        <span>{open ? "▼" : "▶"} {title}</span>
      </button>

      {open && <div style={contentStyle}>{children}</div>}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  marginTop: "16px",
  backgroundColor: "#fff",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  backgroundColor: "#f7f7f7",
  border: "none",
  borderRadius: "8px",
  textAlign: "left",
  fontWeight: 600,
  cursor: "pointer",
};

const contentStyle: React.CSSProperties = {
  padding: "16px",
};