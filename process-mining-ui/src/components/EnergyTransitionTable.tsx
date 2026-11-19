import { useMemo, useState } from "react";
import type { EnergyTransition } from "../api/analysisApi";

type Props = {
  transitions: EnergyTransition[];
};

export default function EnergyTransitionsTable({ transitions }: Props) {
  const [sortKey, setSortKey] = useState<keyof EnergyTransition>("e_total");
  const [sortAsc, setSortAsc] = useState(false);

  const [caseFilter, setCaseFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [energyThreshold, setEnergyThreshold] = useState("");

  const filteredAndSorted = useMemo(() => {
    let data = [...transitions];

    // 🔎 filtres
    data = data.filter((t) => {
      if (caseFilter && !t.case_id.toLowerCase().includes(caseFilter.toLowerCase())) return false;
      if (fromFilter && !t.from_state.toLowerCase().includes(fromFilter.toLowerCase())) return false;
      if (toFilter && !t.to_state.toLowerCase().includes(toFilter.toLowerCase())) return false;

      if (energyThreshold) {
        const threshold = parseFloat(energyThreshold);
        if (!isNaN(threshold) && t.e_total < threshold) return false;
      }

      return true;
    });

    // 🔄 tri
    data.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (typeof valA === "number" && typeof valB === "number") {
        return sortAsc ? valA - valB : valB - valA;
      }

      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    return data;
  }, [transitions, sortKey, sortAsc, caseFilter, fromFilter, toFilter, energyThreshold]);

  const handleSort = (key: keyof EnergyTransition) => {
    if (key === sortKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  if (!transitions.length) return <p>No transitions available.</p>;

  return (
    <div style={{ marginTop: "24px" }}>
      <h2>Energy Transitions</h2>

      {/* 🔎 Filters */}
      <div style={filterContainer}>
        <input placeholder="Case ID" value={caseFilter} onChange={(e) => setCaseFilter(e.target.value)} />
        <input placeholder="From" value={fromFilter} onChange={(e) => setFromFilter(e.target.value)} />
        <input placeholder="To" value={toFilter} onChange={(e) => setToFilter(e.target.value)} />
        <input
          placeholder="Min Energy"
          type="number"
          value={energyThreshold}
          onChange={(e) => setEnergyThreshold(e.target.value)}
        />
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th onClick={() => handleSort("case_id")}>Case</th>
              <th onClick={() => handleSort("from_state")}>From</th>
              <th onClick={() => handleSort("to_state")}>To</th>
              <th onClick={() => handleSort("p_global")}>P Global</th>
              <th onClick={() => handleSort("p_context")}>P Context</th>
              <th onClick={() => handleSort("e_int")}>E Int</th>
              <th onClick={() => handleSort("e_ext")}>E Ext</th>
              <th onClick={() => handleSort("e_total")}>🔥 E Total</th>
              <th>Context</th>
            </tr>
          </thead>

          <tbody>
            {filteredAndSorted.map((t, i) => (
              <tr key={i} style={t.e_total > 2 ? highlightRow : {}}>
                <td>{t.case_id}</td>
                <td>{t.from_state}</td>
                <td>{t.to_state}</td>
                <td>{t.p_global.toFixed(3)}</td>
                <td>{t.p_context.toFixed(3)}</td>
                <td>{t.e_int.toFixed(3)}</td>
                <td>{t.e_ext.toFixed(3)}</td>
                <td><strong>{t.e_total.toFixed(3)}</strong></td>
                <td>
                  <pre style={preStyle}>
                    {JSON.stringify(t.context, null, 1)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const tableStyle: React.CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
};

const filterContainer: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  marginBottom: "12px",
};

const preStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "11px",
};

const highlightRow: React.CSSProperties = {
  backgroundColor: "#ffe6e6", // 🔥 transitions anormales
};