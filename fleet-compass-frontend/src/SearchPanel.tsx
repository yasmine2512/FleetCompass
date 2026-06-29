import type { SearchPanelProps ,TripStatus,Status} from "./types";
import { useState } from "react";


const STATUS_COLORS: Record<Status, string> = {
  "Delivering": "#4ade80",
  "En Route": "#60a5fa",
  "Idle": "#f59e0b",
  "Pick-up": "#f472b6",
}

function SearchPanel({ drivers, trips, onClose, onFindOnMap }: SearchPanelProps) {;


  const [q, setQ] = useState("");

  const filtered = drivers.filter(d =>
    d.name.toLowerCase().includes(q.toLowerCase()) ||
    d.order.toLowerCase().includes(q.toLowerCase())
  );

  const tripFor = (driverId: number) =>
    trips.find(t => t.driverId === driverId && t.tripStatus === "Ongoing");

  const tripStatusColor: Record<TripStatus, string> = {
    Pending: "#f59e0b", Ongoing: "#4ade80", Completed: "#64748b",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 3000,
        background: "rgba(2,6,23,0.75)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: 64,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 720, maxHeight: "78vh", display: "flex", flexDirection: "column",
          background: "rgba(15,23,42,0.97)", border: "1px solid rgba(51,65,85,0.6)",
          borderRadius: 14, overflow: "hidden",
          boxShadow: "0 0 60px rgba(99,102,241,0.18)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* search bar */}
        <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(51,65,85,0.4)", display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by driver name or order ID…"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#e2e8f0", fontSize: 14, fontFamily: "inherit",
            }}
          />
          <span style={{ fontSize: 11, color: "#475569" }}>{filtered.length} results</span>
          <button onClick={onClose} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", padding: 2 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* table */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "rgba(30,41,59,0.5)" }}>
                {["Driver","Availability","Order","Trip Status",""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", borderBottom: "1px solid rgba(51,65,85,0.4)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const ongoingTrip = tripFor(d.id);
                return (
                  <tr key={d.id} style={{ borderBottom: "1px solid rgba(51,65,85,0.2)", background: i % 2 === 0 ? "transparent" : "rgba(30,41,59,0.2)" }}>
                    <td style={{ padding: "10px 16px", color: "#e2e8f0", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill={STATUS_COLORS[d.status]}/></svg>
                      {d.name}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700, letterSpacing: "0.05em",
                        background: d.available ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                        color: d.available ? "#4ade80" : "#f87171",
                        border: `1px solid ${d.available ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                      }}>
                        {d.available ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", color: "#94a3b8", fontFamily: "monospace" }}>{d.order}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700, color: tripStatusColor[d.tripStatus], background: `${tripStatusColor[d.tripStatus]}18`, border: `1px solid ${tripStatusColor[d.tripStatus]}44` }}>
                        {d.tripStatus}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      {(d.tripStatus === "Ongoing" || ongoingTrip) && (
                        <button
                          onClick={() => { onFindOnMap(d); onClose(); }}
                          style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, fontWeight: 700, cursor: "pointer", background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.35)", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                          Find on map
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#475569", fontSize: 12 }}>No drivers or orders match "{q}"</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default SearchPanel