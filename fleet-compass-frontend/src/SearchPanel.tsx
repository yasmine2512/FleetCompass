import { useState,useEffect } from "react";
import type { SearchPanelProps,Status,TripStatus} from "./types";
import AddDriverModal from "./AddDriverModal";
import { fleetApi } from "./api/client";
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

const AVAIL_STYLE: Record<Status, React.CSSProperties> = {
  Idle:   { color: "#4ade80", background: "rgba(34,197,94,0.10)",  border: "1px solid rgba(34,197,94,0.3)"  },
  Offline:     { color: "#94a3b8", background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.25)" },
  "En Route": { color: "#60a5fa", background: "rgba(68, 71, 239, 0.1)",  border: "1px solid rgba(68, 114, 239, 0.3)"  },
};


const TRIP_STATUS_STYLE: Record<TripStatus, React.CSSProperties> = {
  Pending:   { color: "#f59e0b", background: "rgba(245,158,11,0.10)",  border: "1px solid rgba(245,158,11,0.3)"  },
  Ongoing:   { color: "#4ade80", background: "rgba(34,197,94,0.10)",   border: "1px solid rgba(34,197,94,0.3)"   },
  Completed: { color: "#64748b", background: "rgba(100,116,139,0.10)", border: "1px solid rgba(100,116,139,0.3)" },
  Failed: { color: "#f87171", background: "rgba(239,68,68,0.10)",  border: "1px solid rgba(239,68,68,0.3)"   },
};

function SearchPanel({ drivers, trips, onClose, onFindOnMap, onDeleteDriver, onAddDriver, onDeleteTrip, onShowRoute,onSetTrips,totalTripsCount,setCount}: SearchPanelProps) {
  const [tab,        setTab]        = useState<"drivers" | "trips">("drivers");
  const [q,          setQ]          = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [showAdd,    setShowAdd]    = useState(false);
  const [confirmDel, setConfirmDel] = useState<{ kind: "driver" | "trip"; id: string | number } | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [tripPage, setTripPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const [driverStatusFilter, setDriverStatusFilter] = useState("");
  const [driverPage, setDriverPage] = useState(1);

  /* ── filtered lists ── */
  const filteredDrivers = drivers.filter(d => {
    const matchesQuery = d.name.toLowerCase().includes(q.toLowerCase());
    const matchesStatus = driverStatusFilter === "" || d.status === driverStatusFilter;
    return matchesQuery && matchesStatus;
  });

  const totalDriverPages = Math.ceil(filteredDrivers.length / 8) || 1;
  const pagedDrivers = filteredDrivers.slice(
    (driverPage - 1) * 8,
    driverPage * 8
  )
  // const filteredTrips = trips.filter(t =>
  //   t.order_name.toLowerCase().includes(q.toLowerCase()) ||
  //   t.driver_name.toLowerCase().includes(q.toLowerCase())
  // );

  const resultCount = tab === "drivers" ? filteredDrivers.length : trips.length;

  /* ── helpers ── */
  const handleAddDriver = (name: string,phone:string) => {
    onAddDriver(name,phone);
    setShowAdd(false);
  };
  const handleDeleteDriver = (id: number) => {
    if (confirmDel?.kind === "driver" && confirmDel.id === id) {
      onDeleteDriver(id);
      setConfirmDel(null);
      setDriverPage(1);
    } else {
      setConfirmDel({ kind: "driver", id });
    }
  };
  const handleDeleteTrip = (id: number) => {
    if (confirmDel?.kind === "trip" && confirmDel.id === id) {
      onDeleteTrip(id);
      setConfirmDel(null);
      setTripPage(1);
    } else {
      setConfirmDel({ kind: "trip", id });
    }
  };


const fetchTripsData = async () => {
  try {
    const response = await fleetApi.getTrips(
      tripPage, 8, statusFilter,debouncedQ,
    );
    onSetTrips(response.data.data);
    setTotalPages(response.data.pagination.totalPages);
    setCount(response.data.pagination.totalRecords);
    
  } catch (error) {
    console.error("Error retrieving historical logs via service context:", error);
  }
};

useEffect(() => {
  if (tab === "trips"){
  const handler = setTimeout(() => {
    setDebouncedQ(q);
    setTripPage(1);
  }, 300);
  return () => {
    clearTimeout(handler);
  }
}
}, [q,tab]);
useEffect(() => {
  if (tab === "trips") {fetchTripsData();}
}, [tab, tripPage, statusFilter,debouncedQ]);

useEffect(() => {
    setDriverPage(1);
  }, [driverStatusFilter, q]);
// Reset page offset back to 1 if filter criteria changes mid-view
const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  setStatusFilter(e.target.value);
  setTripPage(1);
};
const handleDriverStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDriverStatusFilter(e.target.value);
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
    <div className="fixed inset-0 z-[3000] flex items-start justify-center pt-[52px] bg-[rgba(2,6,23,0.78)] backdrop-blur-[6px]"
      onClick={onClose}>
      <div className="relative flex flex-col w-[820px] max-h-[82vh] bg-[rgba(15,23,42,0.98)] border border-[rgba(51,65,85,0.6)] rounded-[14px] overflow-hidden shadow-[0_0_60px_rgba(99,102,241,0.2)]"
        onClick={e => e.stopPropagation()}>
        {/* ── modal header ── */}
        <div className="flex items-center gap-2.5 px-[18px] py-[14px] h-[45px] border-b border-[rgba(51,65,85,0.4)] flex-shrink-0">
          {/* title */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span className="text-[#c7d2fe] text-[13px] font-extrabold tracking-[0.08em] uppercase">Fleet Manager</span>
          <div className="flex-1" />
          <button onClick={onClose} style={{ ...ICON_BTN, color: "#475569" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.12)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* ── tabs + toolbar ── */}
        <div className="flex items-center gap-0 h-[45px] border-b border-[rgba(51,65,85,0.4)] bg-[rgba(15,23,42,0.6)] flex-shrink-0">
          <button style={tabBtn(tab === "drivers")} onClick={() => { setTab("drivers"); setQ(""); }}>
            <span className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Drivers
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === "drivers" ? "bg-[rgba(99,102,241,0.2)] text-[#a5b4fc]" : "bg-[rgba(51,65,85,0.4)] text-[#64748b]"}`}>{drivers.length}</span>
            </span>
          </button>
          <button style={tabBtn(tab === "trips")} onClick={() => { setTab("trips"); setQ(""); }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Trips
              <span className={`text-[10px] px-[6px] py-[1px] rounded-full font-bold ${
              tab === "trips"
                ? "bg-indigo-500/20 text-indigo-300"
                : "bg-slate-700/40 text-slate-500"
            }`}>{totalTripsCount}</span>
            </span>
          </button>

          {/* spacer */}
          <div className="flex-1" />
          {tab === "drivers" && (
            <div className="px-2.5 flex items-center">
              <select
              className="bg-[rgba(30,41,59,0.6)] border border-[rgba(51,65,85,0.5)] rounded-md text-[#cbd5e1] text-[11px] px-2 py-1 outline-none cursor-pointer"
                value={driverStatusFilter}
                onChange={handleDriverStatusChange}>
                <option value="">All Statuses</option>
                <option value="Idle">Idle</option>
                <option value="En Route">En Route</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          )}
          {/* Status Dropdown Filter*/}
          {tab === "trips" && (
          <div className="px-2.5 flex items-center">
            <select
             className="bg-[rgba(30,41,59,0.6)] border border-[rgba(51,65,85,0.5)] rounded-md text-[#cbd5e1] text-[11px] px-2 py-1 outline-none cursor-pointer"
              value={statusFilter}
              onChange={handleStatusChange}>
              <option value="">All Statuses</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        )}

          {/* search input */}
          <div className="flex items-center gap-2 px-3 border-l border-[rgba(51,65,85,0.35)]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={tab === "drivers" ? "Search drivers…" : "Search trips…"}
              className="bg-transparent border-none outline-none text-[#e2e8f0] text-[12px] w-[160px]"/>
            {q && (
              <button onClick={() => setQ("")} style={{ ...ICON_BTN, color: "#475569" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
            <span className="text-[10px] text-slate-700 border-l border-slate-700/30 pl-2">{resultCount} result{resultCount !== 1 ? "s" : ""}</span>
          </div>

          {/* Add Driver button (drivers tab only) */}
          {tab === "drivers" && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 mx-2.5 
              my-1.5 bg-gradient-to-br from-indigo-500 to-violet-500 
              border-0 rounded-lg text-white text-[11px] font-bold 
              tracking-wider cursor-pointer uppercase"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Driver
            </button>
          )}
        </div>

        {/* ── table area ── */}
        <div className="overflow-y-auto flex-1 min-h-[380px]">

      {/* ────── DRIVERS TAB ────── */}
      {tab === "drivers" && (
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              {["Driver Name","Phone Number", "Status", "Actions"].map(h => (
                <th key={h} style={TH_STYLE}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedDrivers.map((d, i) => {
            const isConfirmingDel = confirmDel?.kind === "driver" && confirmDel.id === d.id;
            return (
            <tr key={d.id}  className={`border-b border-slate-700/20
               transition-colors ${i % 2 === 0 ?
                "bg-transparent" : "bg-slate-800/15"}`}>

              {/* name */}
          <td style={TD_STYLE}>
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div className="text-slate-200 font-bold text-xs">
                    {d.name}</div>
                </div>
                {/* Speed aligned to the absolute right side of the cell layout frame */}
                <span className="text-slate-500 text-[10px] font-mono pr-1">{d.speed?.toFixed(4)} mph</span>
              </div>
            </td>
              <td style={TD_STYLE}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 12 }}>{d.phone_number}</div>
                </div>
              </td>

              {/* availability */}
              <td style={TD_STYLE}>
                <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, fontWeight: 700, letterSpacing: "0.04em", ...AVAIL_STYLE[d.status] }}>
                  <span style={{ marginRight: 5 }}>●</span>{d.status}
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
                    {q || driverStatusFilter ? "No drivers match filter criteria" : "No drivers registered"}
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
        {trips.map((t, i) => {
          const isConfirmingDel = confirmDel?.kind === "trip" && confirmDel.id === t.id;
          return (
            <tr key={t.id} style={{ borderBottom: "1px solid rgba(51,65,85,0.18)", background: i % 2 === 0 ? "transparent" : "rgba(30,41,59,0.15)" ,margin:5}}>

              {/* order */}
              <td style={TD_STYLE }>
                <div style={{ color: "#e2e8f0", fontWeight: 700, fontFamily: "monospace", fontSize: 13 }}>
                  <span style={{ color: "#334155", fontSize: 10, marginTop: 2 }}>#{String(t.id).slice(-6)}</span> 
                  &nbsp;{t.order_name}</div>
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
                onClick={() => { onShowRoute(t.id); onClose(); }}
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
            {trips.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#334155", fontSize: 13 }}>
                    {q || statusFilter ? "No trips match filter criteria" : "No trips recorded yet"}
                  </td></tr>
                )}
          </tbody>
        </table>
      )}
      </div>
      {tab === "drivers" && totalDriverPages > 1 && (
          <div style={{
            padding: "8px 14px", borderTop: "1px solid rgba(51,65,85,0.4)",
            background: "rgba(15,23,42,0.6)", display: "flex",
            alignItems: "center", justifyContent: "space-between",
             flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>
              Page {driverPage} of {totalDriverPages}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                disabled={driverPage === 1}
                onClick={() => setDriverPage(prev => Math.max(1, prev - 1))}
                style={{
                  padding: "3px 10px", background: driverPage === 1 ? "rgba(30,41,59,0.2)" : "rgba(30,41,59,0.8)",
                  border: "1px solid rgba(51,65,85,0.4)", borderRadius: 6,
                  color: driverPage === 1 ? "#475569" : "#cbd5e1", fontSize: 11, fontWeight: 600,
                  cursor: driverPage === 1 ? "not-allowed" : "pointer"
                }}
              >
                Previous
              </button>
              <button
                disabled={driverPage === totalDriverPages}
                onClick={() => setDriverPage(prev => Math.min(totalDriverPages, prev + 1))}
                style={{
                  padding: "3px 10px", background: driverPage === totalDriverPages ? "rgba(30,41,59,0.2)" : "rgba(30,41,59,0.8)",
                  border: "1px solid rgba(51,65,85,0.4)", borderRadius: 6,
                  color: driverPage === totalDriverPages ? "#475569" : "#cbd5e1", fontSize: 11, fontWeight: 600,
                  cursor: driverPage === totalDriverPages ? "not-allowed" : "pointer"
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      {tab === "trips" && totalPages > 1 && (
      <div style={{
        padding: "8px 14px",
        borderTop: "1px solid rgba(51,65,85,0.4)",
        background: "rgba(15,23,42,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        bottom:0,
      }}>
        <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>
          Page {tripPage} of {totalPages}
        </span>
        
        <div style={{ display: "flex", gap: 6 }}>
          <button
            disabled={tripPage === 1}
            onClick={() => setTripPage(prev => Math.max(1, prev - 1))}
            style={{
              padding: "3px 10px", background: tripPage === 1 ? "rgba(30,41,59,0.2)" : "rgba(30,41,59,0.8)",
              border: "1px solid rgba(51,65,85,0.4)", borderRadius: 6,
              color: tripPage === 1 ? "#475569" : "#cbd5e1", fontSize: 11, fontWeight: 600,
              cursor: tripPage === 1 ? "not-allowed" : "pointer"
            }}
          >
            Previous
          </button>
          
          <button
            disabled={tripPage === totalPages}
            onClick={() => setTripPage(prev => Math.min(totalPages, prev + 1))}
            style={{
              padding: "3px 10px", background: tripPage === totalPages ? "rgba(30,41,59,0.2)" : "rgba(30,41,59,0.8)",
              border: "1px solid rgba(51,65,85,0.4)", borderRadius: 6,
              color: tripPage === totalPages ? "#475569" : "#cbd5e1", fontSize: 11, fontWeight: 600,
              cursor: tripPage === totalPages ? "not-allowed" : "pointer"
            }}
          >
            Next
          </button>
        </div>
      </div>
    )}
      {/* ── Pagination UI Control Segment Footer (Trips Only) ── */}
    
    {/* ── Add Driver modal overlay ── */}
    {showAdd && <AddDriverModal onAdd={handleAddDriver} onCancel={() => setShowAdd(false)} />}
  </div>
    </div>
  );
}

export default SearchPanel