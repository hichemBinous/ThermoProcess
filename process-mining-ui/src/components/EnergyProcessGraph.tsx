import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";

import type { EnergyDfgResponse } from "../api/analysisApi";

type Props = {
  data: EnergyDfgResponse | null;
};

function getEdgeColor(energy: number) {
  if (energy >= 2.5) return "#b91c1c"; // rouge
  if (energy >= 1.5) return "#f97316"; // orange
  if (energy >= 0.8) return "#eab308"; // jaune
  return "#16a34a"; // vert
}

export default function EnergyProcessGraph({ data }: Props) {
  if (!data) return null;

  if (!data.nodes.length || !data.edges.length) {
    return <p>No energy DFG data available.</p>;
  }

  const nodes: Node[] = data.nodes.map((node, index) => ({
    id: node.id,
    position: {
      x: (index % 4) * 220,
      y: Math.floor(index / 4) * 140,
    },
    data: { label: node.label },
    style: {
      border: "1px solid #ddd",
      borderRadius: 8,
      padding: 10,
      background: "#fff",
    },
  }));

  const edges: Edge[] = data.edges.map((edge, index) => ({
    id: `e-${index}-${edge.from}-${edge.to}`,
    source: edge.from,
    target: edge.to,
    animated: edge.avg_energy >= 1.5,
    label: `E=${edge.avg_energy.toFixed(2)} | n=${edge.count}`,
    style: {
      stroke: getEdgeColor(edge.avg_energy),
      strokeWidth: Math.min(6, 1 + edge.avg_energy),
    },
    labelStyle: {
      fontSize: 11,
      fontWeight: 600,
    },
  }));

  return (
    <div style={{ marginTop: "24px" }}>
      <h2>Energy-Colored DFG</h2>

      <div style={{ height: "500px", border: "1px solid #ddd", borderRadius: "8px" }}>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      <div style={{ marginTop: "12px", fontSize: "14px" }}>
        <strong>Legend:</strong>{" "}
        <span style={{ color: "#16a34a" }}>Low energy</span> ·{" "}
        <span style={{ color: "#eab308" }}>Medium</span> ·{" "}
        <span style={{ color: "#f97316" }}>High</span> ·{" "}
        <span style={{ color: "#b91c1c" }}>Critical</span>
      </div>
    </div>
  );
}