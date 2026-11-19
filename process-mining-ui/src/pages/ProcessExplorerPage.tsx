import { useEffect, useMemo, useState } from "react";

import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
} from "reactflow";

import type {
  Node,
  Edge,
  NodeChange,
  OnNodesChange,
} from "reactflow";

import "reactflow/dist/style.css";

import { getDataSources } from "../api/mappingApi";
import type { DataSourceItem } from "../api/mappingApi";
import { getEnergyDfg } from "../api/analysisApi";
import type { EnergyDfgResponse, EnergyDfgEdge } from "../api/analysisApi";
import { getProcessLayout, saveProcessLayout } from "../api/processLayoutApi";

function getEdgeColor(energy: number, highlightAnomalies: boolean) {
  if (highlightAnomalies && energy >= 1.5) return "#dc2626";
  if (energy >= 2.5) return "#b91c1c";
  if (energy >= 1.5) return "#f97316";
  if (energy >= 0.8) return "#eab308";
  return "#16a34a";
}

export default function ProcessExplorerPage() {
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [graphData, setGraphData] = useState<EnergyDfgResponse | null>(null);

  const [nodesState, setNodesState] = useState<Node[]>([]);
  const [showLinks, setShowLinks] = useState(true);
  const [highlightAnomalies, setHighlightAnomalies] = useState(false);

  const [minEnergy, setMinEnergy] = useState("");
  const [minCount, setMinCount] = useState("");

  const [selectedEdge, setSelectedEdge] = useState<EnergyDfgEdge | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [criticalPathMode, setCriticalPathMode] = useState(false);
  const [criticalPercent, setCriticalPercent] = useState(20);
  const [highlightPathMode, setHighlightPathMode] = useState(false);
  const [pathDepth, setPathDepth] = useState(3);
  const [temperature, setTemperature] = useState(1);
  function getThermalEnergy(energy: number, temperature: number) {
  return energy / Math.max(temperature, 0.001);
    }
  const [highlightedEdgeIds, setHighlightedEdgeIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    getDataSources()
      .then(setDataSources)
      .catch((err) => setMessage(err.message || "Failed to load sources"));
  }, []);


  const loadGraph = async () => {
    if (!selectedSourceId) {
      setMessage("Please select a source first.");
      return;
    }

    try {
      setMessage("");
      setSelectedEdge(null);
      setSelectedNodeId(null);

      const data = await getEnergyDfg(selectedSourceId);
      setGraphData(data);

      const layoutResponse = await getProcessLayout(selectedSourceId);
      const savedLayout = layoutResponse.layout || {};

      const initialNodes: Node[] = data.nodes.map((node, index) => ({
        id: node.id,
        position: savedLayout[node.id] || {
            x: (index % 4) * 240,
            y: Math.floor(index / 4) * 150,
        },
        data: { label: node.label },
        style: {
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 12,
            background: "#fff",
            fontWeight: 600,
        },
        }));

      setNodesState(initialNodes);

      if (!data.nodes.length || !data.edges.length) {
        setMessage("No graph data found. Apply the mapping first from Analysis.");
      }
    } catch (err: any) {
      setGraphData(null);
      setNodesState([]);
      setMessage(err.message || "Failed to load graph.");
    }
  };

  const onNodesChange: OnNodesChange = (changes: NodeChange[]) => {
    setNodesState((nds) => applyNodeChanges(changes, nds));
  };

  const saveLayout = async () => {
    if (!selectedSourceId) {
        setMessage("Please select a source first.");
        return;
    }

    const layout: Record<string, { x: number; y: number }> = {};

    nodesState.forEach((node) => {
        layout[node.id] = node.position;
    });

    try {
        await saveProcessLayout(selectedSourceId, layout);
        setMessage("Layout saved in database successfully.");
    } catch (err: any) {
        setMessage(err.message || "Failed to save layout.");
    }
    };

  const resetLayout = () => {
  setMessage("Reset layout in database is not implemented yet.");
};
  const buildEdgeId = (edge: EnergyDfgEdge, index: number) =>
  `edge-${index}-${edge.from}-${edge.to}`;

  const computeHighlightedPath = (startNodeId: string) => {
    if (!graphData) return;

    const highlighted = new Set<string>();
    let currentNodes = [startNodeId];

    for (let depth = 0; depth < pathDepth; depth++) {
        const nextNodes: string[] = [];

        currentNodes.forEach((nodeId) => {
        const outgoing = graphData.edges
            .map((edge, index) => ({ edge, index }))
            .filter(({ edge }) => edge.from === nodeId)
            .sort((a, b) => b.edge.avg_energy - a.edge.avg_energy);

        const bestEdges = outgoing.slice(0, 2);

        bestEdges.forEach(({ edge, index }) => {
            highlighted.add(buildEdgeId(edge, index));
            nextNodes.push(edge.to);
        });
        });

        currentNodes = [...new Set(nextNodes)];

        if (!currentNodes.length) break;
    }

    setHighlightedEdgeIds(highlighted);
    };
  const filteredEdges = useMemo(() => {
  if (!graphData) return [];

  let data = graphData.edges.filter((edge) => {
    const energyOk = minEnergy ? edge.avg_energy >= Number(minEnergy) : true;
    const countOk = minCount ? edge.count >= Number(minCount) : true;
    const thermalEnergy = getThermalEnergy(edge.avg_energy, temperature);

    if (highlightAnomalies && thermalEnergy < 1.5) {
    return false;
    }


    return energyOk && countOk;
  });

  if (criticalPathMode && data.length > 0) {
    const sorted = [...data].sort((a, b) => b.avg_energy - a.avg_energy);
    const keepCount = Math.max(
      1,
      Math.ceil((criticalPercent / 100) * sorted.length)
    );

    data = sorted.slice(0, keepCount);
    }

    return data;
    }, [
    graphData,
    minEnergy,
    minCount,
    highlightAnomalies,
    criticalPathMode,
    criticalPercent,
    ]);

  const edges: Edge[] = useMemo(() => {
    if (!showLinks) return [];

    return filteredEdges.map((edge, index) => {
        const edgeId = buildEdgeId(edge, index);
        const isHighlighted = highlightedEdgeIds.has(edgeId);
        const thermalEnergy = getThermalEnergy(edge.avg_energy, temperature);

        return {
        id: edgeId,
        source: edge.from,
        target: edge.to,
        label: `E=${edge.avg_energy.toFixed(2)} | ET=${thermalEnergy.toFixed(2)} | n=${edge.count}`,
        animated:
            isHighlighted ||
            criticalPathMode ||
            thermalEnergy >= 1.5,
        style: {
            stroke: isHighlighted
            ? "#2563eb"
            : criticalPathMode
                ? "#dc2626"
                : getEdgeColor(thermalEnergy, highlightAnomalies),
            strokeWidth: isHighlighted
            ? 6
            : criticalPathMode
                ? 5
                : highlightAnomalies && thermalEnergy >= 1.5
                ? 5
                : Math.min(6, 1 + thermalEnergy),
        },
        data: {
            ...edge,
            thermal_energy: thermalEnergy,
        },
        };
    });
    }, [
    filteredEdges,
    showLinks,
    highlightedEdgeIds,
    criticalPathMode,
    highlightAnomalies,
    temperature,
    ]);

  const selectedNodeDetails = useMemo(() => {
    if (!graphData || !selectedNodeId) return null;

    const incoming = graphData.edges.filter((e) => e.to === selectedNodeId);
    const outgoing = graphData.edges.filter((e) => e.from === selectedNodeId);

    const all = [...incoming, ...outgoing];
    const avgEnergy =
      all.length > 0
        ? all.reduce((sum, e) => sum + e.avg_energy, 0) / all.length
        : 0;

    return {
      id: selectedNodeId,
      incoming,
      outgoing,
      avgEnergy,
    };
  }, [graphData, selectedNodeId]);


  return (
    <div style={{ padding: 20 }}>
      <h1>Process Explorer</h1>

      <div style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <select
          value={selectedSourceId ?? ""}
          onChange={(e) => {
            setSelectedSourceId(e.target.value ? Number(e.target.value) : null);
            setGraphData(null);
            setNodesState([]);
            setSelectedEdge(null);
            setSelectedNodeId(null);
          }}
        >
          <option value="">Choose a source</option>
          {dataSources.map((source) => (
            <option key={source.id} value={source.id}>
              #{source.id} - {source.name}
            </option>
          ))}
        </select>

        <button onClick={loadGraph}>Load Process</button>
        <button onClick={saveLayout} disabled={!nodesState.length}>
          Save Layout
        </button>
        <button onClick={resetLayout} disabled={!selectedSourceId}>
          Reset Layout
        </button>

        <label>
          <input
            type="checkbox"
            checked={showLinks}
            onChange={(e) => setShowLinks(e.target.checked)}
          />{" "}
          Show links
        </label>

        <label>
          <input
            type="checkbox"
            checked={highlightAnomalies}
            onChange={(e) => setHighlightAnomalies(e.target.checked)}
          />{" "}
          Highlight anomalies
        </label>
        <label>
          <input
                type="checkbox"
                checked={criticalPathMode}
                onChange={(e) => setCriticalPathMode(e.target.checked)}
            />{" "}
            Critical Path
         </label>

         {criticalPathMode && (
            <input
                type="number"
                min={1}
                max={100}
                value={criticalPercent}
                onChange={(e) => setCriticalPercent(Number(e.target.value))}
                placeholder="Top %"
                style={{ width: 90 }}
            />
            )}
        <input
          type="number"
          placeholder="Min energy"
          value={minEnergy}
          onChange={(e) => setMinEnergy(e.target.value)}
        />

        <input
          type="number"
          placeholder="Min count"
          value={minCount}
          onChange={(e) => setMinCount(e.target.value)}
        />
        <label>
            <input
                type="checkbox"
                checked={highlightPathMode}
                onChange={(e) => {
                setHighlightPathMode(e.target.checked);
                setHighlightedEdgeIds(new Set());
                }}
            />{" "}
            Highlight Path
            </label>

        {highlightPathMode && (
            <input
                type="number"
                min={1}
                max={10}
                value={pathDepth}
                onChange={(e) => setPathDepth(Number(e.target.value))}
                placeholder="Depth"
                style={{ width: 90 }}
            />
            )}

        <button onClick={() => setHighlightedEdgeIds(new Set())}>
        Clear Path
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Temperature
            <input
                type="range"
                min={0.2}
                max={3}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
            />
            <strong>{temperature.toFixed(1)}</strong>
        </label>
      </div>

      {message && <p>{message}</p>}

      {!graphData && (
        <p>Select a source and click <strong>Load Process</strong>.</p>
      )}

      {graphData && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
          <div>
  <div style={{ height: 650, border: "1px solid #ddd", borderRadius: 8 }}>
                <ReactFlow
                nodes={nodesState}
                edges={edges}
                onNodesChange={onNodesChange}
                fitView
                onNodeClick={(_, node) => {
                    setSelectedNodeId(node.id);
                    setSelectedEdge(null);

                    if (highlightPathMode) {
                        computeHighlightedPath(node.id);
                    }
                }}
                onEdgeClick={(_, edge) => {
                    setSelectedEdge(edge.data as EnergyDfgEdge);
                    setSelectedNodeId(null);
                }}
                >
                <Background />
                <Controls />
                <MiniMap />
                </ReactFlow>
            </div>

            <div style={legendStyle}>
                <strong>Legend:</strong>{" "}
                <span style={{ color: "#16a34a" }}>Low energy</span> ·{" "}
                <span style={{ color: "#eab308" }}>Medium</span> ·{" "}
                <span style={{ color: "#f97316" }}>High</span> ·{" "}
                <span style={{ color: "#b91c1c" }}>Critical</span>
            </div>
            {criticalPathMode && (
            <div style={{ marginTop: "6px", color: "#dc2626", fontSize: "13px" }}>
                Critical Path mode: showing top {criticalPercent}% highest-energy links.
            </div>
            )}
            </div>

          <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
            <h2>Details</h2>

            <p><strong>Nodes:</strong> {nodesState.length}</p>
            <p><strong>Visible links:</strong> {edges.length}</p>
            <p><strong>Total links:</strong> {graphData.edges.length}</p>

            <hr />

            {selectedNodeDetails && (
              <>
                <h3>Selected Node</h3>
                <p><strong>Node:</strong> {selectedNodeDetails.id}</p>
                <p><strong>Incoming links:</strong> {selectedNodeDetails.incoming.length}</p>
                <p><strong>Outgoing links:</strong> {selectedNodeDetails.outgoing.length}</p>
                <p><strong>Average connected energy:</strong> {selectedNodeDetails.avgEnergy.toFixed(4)}</p>

                <h4>Outgoing</h4>
                <ul>
                  {selectedNodeDetails.outgoing.map((e, i) => (
                    <li key={i}>
                      {e.from} → {e.to} | E={e.avg_energy.toFixed(2)} | n={e.count}
                    </li>
                  ))}
                </ul>

                <h4>Incoming</h4>
                <ul>
                  {selectedNodeDetails.incoming.map((e, i) => (
                    <li key={i}>
                      {e.from} → {e.to} | E={e.avg_energy.toFixed(2)} | n={e.count}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {selectedEdge && (
              <>
                <h3>Selected Link</h3>
                <p><strong>From:</strong> {selectedEdge.from}</p>
                <p><strong>To:</strong> {selectedEdge.to}</p>
                <p><strong>Count:</strong> {selectedEdge.count}</p>
                <p><strong>Average energy:</strong> {selectedEdge.avg_energy.toFixed(4)}</p>
                <p><strong>Max energy:</strong> {selectedEdge.max_energy.toFixed(4)}</p>
                <p>
                    <strong>Thermal energy:</strong>{" "}
                    {(selectedEdge.avg_energy / temperature).toFixed(4)}
                    </p>
              </>
            )}

            {!selectedNodeDetails && !selectedEdge && (
              <p>Select a node or a link to see details.</p>
            )}
          </div>
            {highlightAnomalies && (
            <div style={{ marginTop: "6px", color: "#dc2626", fontSize: "13px" }}>
                Anomaly highlight mode: showing links with average energy ≥ 1.5
            </div>
            )}
            {highlightPathMode && (
                <div style={{ marginTop: "6px", color: "#2563eb", fontSize: "13px" }}>
                    Highlight Path mode: click a node to highlight the highest-energy outgoing path up to depth {pathDepth}.
                </div>
                )}
            <div style={{ marginTop: "6px", fontSize: "13px" }}>
                Temperature mode: visual energy is computed as E/T. 
                Low T amplifies critical paths, high T smooths the graph.
                </div>
        </div>
        
        
      )}
    </div>
  );
}
const legendStyle: React.CSSProperties = {
  marginTop: "12px",
  fontSize: "14px",
};