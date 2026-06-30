import { useState } from "react";
import type { SearchPanelProps ,Driver,Status,TripStatus} from "./types";
import AddDriverModal from "./AddDriverModal";
const TH_STYLE: React.CSSProperties = {
  padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700,
  letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b",
  borderBottom: "1px solid rgba(51,65,85,0.4)", whiteSpace: "nowrap",
  background: "rgba(15,23,42,0.6)", position: "sticky", top: 0, zIndex: 1,
};
const TD_STYLE: React.CSSProperties = {
  padding: "10px 14px", verticalAlign: "middle",
};
const ICON_BTN: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", padding: "4px 6px",
  borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
  transition: "background 0.15s",
};

function driverAvailability(d: Driver): Status {
  return d.status;
}

const AVAIL_STYLE: Record<Status, React.CSSProperties> = {
  Idle:   { color: "#4ade80", background: "rgba(34,197,94,0.10)",  border: "1px solid rgba(34,197,94,0.3)"  },
  Offline:     { color: "#94a3b8", background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.25)" },
  "En Route": { color: "#60a5fa", background: "rgba(68, 71, 239, 0.1)",  border: "1px solid rgba(68, 114, 239, 0.3)"  },
};

const TRIP_STATUS_STYLE: Record<TripStatus, React.CSSProperties> = {
  Pending:   { color: "#f59e0b", background: "rgba(245,158,11,0.10)",  border: "1px solid rgba(245,158,11,0.3)"  },
  Ongoing:   { color: "#4ade80", background: "rgba(34,197,94,0.10)",   border: "1px solid rgba(34,197,94,0.3)"   },
  Completed: { color: "#64748b", background: "rgba(100,116,139,0.10)", border: "1px solid rgba(100,116,139,0.3)" },
};

function SearchPanel({ drivers, trips, onClose, onFindOnMap, onDeleteDriver, onAddDriver, onDeleteTrip, onShowRoute }: SearchPanelProps) {
  const [tab,        setTab]        = useState<"drivers" | "trips">("drivers");
  const [q,          setQ]          = useState("");
  const [showAdd,    setShowAdd]    = useState(false);
  const [confirmDel, setConfirmDel] = useState<{ kind: "driver" | "trip"; id: string | number } | null>(null);

  /* ── filtered lists ── */
  const filteredDrivers = drivers.filter(d =>
    d.name.toLowerCase().includes(q.toLowerCase()) 
   // || d.order.toLowerCase().includes(q.toLowerCase())
  );
  const filteredTrips = trips.filter(t =>
    t.order_name.toLowerCase().includes(q.toLowerCase()) ||
    t.driver_name.toLowerCase().includes(q.toLowerCase())
  );

  const resultCount = tab === "drivers" ? filteredDrivers.length : filteredTrips.length;

  /* ── helpers ── */
  const handleAddDriver = (name: string) => {
    onAddDriver(name);
    setShowAdd(false);
  };
  const handleDeleteDriver = (id: number) => {
    if (confirmDel?.kind === "driver" && confirmDel.id === id) {
      onDeleteDriver(id);
      setConfirmDel(null);
    } else {
      setConfirmDel({ kind: "driver", id });
    }
  };
  const handleDeleteTrip = (id: number) => {
    if (confirmDel?.kind === "trip" && confirmDel.id === id) {
      onDeleteTrip(toString());
      setConfirmDel(null);
    } else {
      setConfirmDel({ kind: "trip", id });
    }
  };

  /* ── shared panel button style ── */
  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "9px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer",
    background: active ? "rgba(99,102,241,0.15)" : "transparent",
    color: active ? "#a5b4fc" : "#64748b",
    border: "none", borderBottom: active ? "2px solid #818cf8" : "2px solid transparent",
    letterSpacing: "0.06em", textTransform: "uppercase", transition: "all 0.15s",
  });

  return (
    <div style={{
        position: "fixed", inset: 0, zIndex: 3000,
        background: "rgba(2,6,23,0.78)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: 52,
      }}
      onClick={onClose}>
      <div style={{
          width: 820, maxHeight: "82vh", display: "flex", flexDirection: "column",
          background: "rgba(15,23,42,0.98)", border: "1px solid rgba(51,65,85,0.6)",
          borderRadius: 14, overflow: "hidden",
          boxShadow: "0 0 60px rgba(99,102,241,0.2)",
          position: "relative",
        }}
        onClick={e => e.stopPropagation()}>
        {/* ── modal header ── */}
        <div style={{
          padding: "14px 18px", borderBottom: "1px solid rgba(51,65,85,0.4)",
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        }}>
          {/* title */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span style={{ color: "#c7d2fe", fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Fleet Manager</span>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ ...ICON_BTN, color: "#475569" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.12)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* ── tabs + toolbar ── */}
        <div style={{
          display: "flex", alignItems: "center",
          borderBottom: "1px solid rgba(51,65,85,0.4)", flexShrink: 0,
          background: "rgba(15,23,42,0.6)", gap: 0,
        }}>
          <button style={tabBtn(tab === "drivers")} onClick={() => { setTab("drivers"); setQ(""); }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Drivers
              <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 20, background: tab === "drivers" ? "rgba(99,102,241,0.2)" : "rgba(51,65,85,0.4)", color: tab === "drivers" ? "#a5b4fc" : "#64748b", fontWeight: 700 }}>{drivers.length}</span>
            </span>
          </button>
          <button style={tabBtn(tab === "trips")} onClick={() => { setTab("trips"); setQ(""); }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Trips
              <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 20, background: tab === "trips" ? "rgba(99,102,241,0.2)" : "rgba(51,65,85,0.4)", color: tab === "trips" ? "#a5b4fc" : "#64748b", fontWeight: 700 }}>{trips.length}</span>
            </span>
          </button>

          {/* spacer */}
          <div style={{ flex: 1 }} />

          {/* search input */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", borderLeft: "1px solid rgba(51,65,85,0.35)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={tab === "drivers" ? "Search drivers…" : "Search trips…"}
              style={{
                background: "transparent", border: "none", outline: "none",
                color: "#e2e8f0", fontSize: 12, width: 160, fontFamily: "inherit",
              }}
            />
            {q && (
              <button onClick={() => setQ("")} style={{ ...ICON_BTN, color: "#475569" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
            <span style={{ fontSize: 10, color: "#334155", borderLeft: "1px solid rgba(51,65,85,0.35)", paddingLeft: 8 }}>{resultCount} result{resultCount !== 1 ? "s" : ""}</span>
          </div>

          {/* Add Driver button (drivers tab only) */}
          {tab === "drivers" && (
            <button
              onClick={() => setShowAdd(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", margin: "6px 10px",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none",
                borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.05em", cursor: "pointer", textTransform: "uppercase",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Driver
            </button>
          )}
        </div>

        {/* ── table area ── */}
        <div style={{ overflowY: "auto", flex: 1 }}>

      {/* ────── DRIVERS TAB ────── */}
      {tab === "drivers" && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {["Driver Name", "Status", "Actions"].map(h => (
                <th key={h} style={TH_STYLE}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredDrivers.map((d, i) => {
            const avail = driverAvailability(d);
            const isConfirmingDel = confirmDel?.kind === "driver" && confirmDel.id === d.id;
            return (
            <tr key={d.id} style={{ borderBottom: "1px solid rgba(51,65,85,0.18)", background: i % 2 === 0 ? "transparent" : "rgba(30,41,59,0.15)", transition: "background 0.1s" }}>

              {/* name */}
              <td style={TD_STYLE}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div>
                    <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 12 }}>{d.name}</div>
                    <div style={{ color: "#475569", fontSize: 10, fontFamily: "monospace" }}>{d.speed} mph</div>
                  </div>
                </div>
              </td>

              {/* availability */}
              <td style={TD_STYLE}>
                <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, fontWeight: 700, letterSpacing: "0.04em", ...AVAIL_STYLE[avail] }}>
                  <span style={{ marginRight: 5 }}>●</span>{avail}
                </span>
              </td>

              {/* actions */}
              <td style={TD_STYLE}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {/* show position */}
                  <button
                    title="Show on map"
                    onClick={() => { onFindOnMap(d); onClose(); }}
                    style={{ ...ICON_BTN, color: "#60a5fa" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(96,165,250,0.12)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                  </button>

                  {/* delete */}
                  {isConfirmingDel ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 10, color: "#f87171" }}>Confirm?</span>
                      <button onClick={() => handleDeleteDriver(d.id)} style={{ ...ICON_BTN, color: "#f87171" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </button>
                      <button onClick={() => setConfirmDel(null)} style={{ ...ICON_BTN, color: "#64748b" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(100,116,139,0.12)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      title="Delete driver"
                      onClick={() => handleDeleteDriver(d.id)}
                      style={{ ...ICON_BTN, color: "#64748b" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.12)", (e.currentTarget as HTMLElement).style.color = "#f87171")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none", (e.currentTarget as HTMLElement).style.color = "#64748b")}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
              );
            })}
            {filteredDrivers.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#334155", fontSize: 13 }}>
                {q ? `No drivers match "${q}"` : "No drivers registered"}
              </td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* ────── TRIPS TAB ────── */}
      {tab === "trips" && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {["Order", "Driver", "Trip Status", "Date", "Duration", "Actions"].map(h => (
                <th key={h} style={TH_STYLE}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
        {filteredTrips.map((t, i) => {
          const isConfirmingDel = confirmDel?.kind === "trip" && confirmDel.id === t.id;
          const driver = null; // trips carry driverName directly
          return (
            <tr key={t.id} style={{ borderBottom: "1px solid rgba(51,65,85,0.18)", background: i % 2 === 0 ? "transparent" : "rgba(30,41,59,0.15)" }}>

              {/* order */}
              <td style={TD_STYLE}>
                <div style={{ color: "#e2e8f0", fontWeight: 700, fontFamily: "monospace", fontSize: 11 }}>{t.order_name}</div>
                <div style={{ color: "#334155", fontSize: 10, marginTop: 2 }}>#{String(t.id).slice(-6)}</div>
              </td>

              {/* driver */}
              <td style={{ ...TD_STYLE, color: "#a5b4fc", fontWeight: 600 }}>{t.driver_name}</td>

              {/* trip status */}
              <td style={TD_STYLE}>
                <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, fontWeight: 700, letterSpacing: "0.04em", ...TRIP_STATUS_STYLE[t.status] }}>
                  {t.status === "Ongoing" && <span style={{ marginRight: 5 }}>◉</span>}
                  {t.status}
                </span>
              </td>

              {/* date */}
              <td style={{ ...TD_STYLE, color: "#64748b", fontSize: 11, fontFamily: "monospace" }}>
                {new Date(t.started_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
              </td>

              {/* duration */}
              <td style={{ ...TD_STYLE, color: "#64748b", fontSize: 11, fontFamily: "monospace" }}>
                {t.status === "Ongoing" ? (
                  <span style={{ color: "#4ade80" }}>In progress</span>
                ) : (
                  
                  `${Math.floor(t.duration_seconds / 60)}m ${t.duration_seconds % 60}s `
                )}
              </td>

              {/* actions */}
              <td style={TD_STYLE}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {/* show route */}
              <button
                title="Show route on map"
                onClick={() => { onShowRoute(t); onClose(); }}
                style={{ ...ICON_BTN, color: "#60a5fa" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(96,165,250,0.12)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/></svg>
              </button>

              {/* delete */}
              {isConfirmingDel ? (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10, color: "#f87171" }}>Confirm?</span>
                  <button onClick={() => handleDeleteTrip(t.id)} style={{ ...ICON_BTN, color: "#f87171" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                  <button onClick={() => setConfirmDel(null)} style={{ ...ICON_BTN, color: "#64748b" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(100,116,139,0.12)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ) : (
                <button
                  title="Delete trip"
                  onClick={() => handleDeleteTrip(t.id)}
                  style={{ ...ICON_BTN, color: "#64748b" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.12)", (e.currentTarget as HTMLElement).style.color = "#f87171")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none", (e.currentTarget as HTMLElement).style.color = "#64748b")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
            {filteredTrips.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#334155", fontSize: 13 }}>
                {q ? `No trips match "${q}"` : "No trips recorded yet"}
              </td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>

    {/* ── Add Driver modal overlay ── */}
    {showAdd && <AddDriverModal onAdd={handleAddDriver} onCancel={() => setShowAdd(false)} />}
  </div>
    </div>
  );
}

export default SearchPanel