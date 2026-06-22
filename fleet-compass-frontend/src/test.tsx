import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LeafletMouseEvent } from "leaflet";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
);


/* ── types ─────────────────────────────────────────────────────── */
type Status = "Delivering" | "En Route" | "Idle" | "Pick-up";
type LogType = "normal" | "info" | "warn" | "dispatch" | "dim";

interface Driver {
  id: number;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  status: Status;
  dLat: number;
  dLng: number;
  order: string;
}

interface LogEntry {
  id: number;
  ts: string;
  msg: string;
  type: LogType;
}

interface KPI {
  ingestion: number;
  latency: number;
}

/* ── constants ──────────────────────────────────────────────────── */
const DRIVER_NAMES = [
  "D-ALPHA","D-BRAVO","D-CHARLIE","D-DELTA","D-ECHO",
  "D-FOXTROT","D-GOLF","D-HOTEL","D-INDIA","D-JULIET",
];
const STATUSES: Status[] = ["Delivering","En Route","Idle","Pick-up"];
const STATUS_COLORS: Record<Status, string> = {
  "Delivering": "#4ade80",
  "En Route": "#60a5fa",
  "Idle": "#f59e0b",
  "Pick-up": "#f472b6",
};
const LOG_MSGS: Array<(d: Driver) => string> = [
  d => `GPS_PING ${d.name} lat=${d.lat.toFixed(5)} lng=${d.lng.toFixed(5)}`,
  d => `SPEED_UPDATE ${d.name} → ${d.speed}mph`,
  d => `HEARTBEAT ${d.name} OK signal=strong`,
  d => `STATUS_SYNC ${d.name} [${d.status}]`,
  d => `ROUTE_CALC ${d.name} ETA=+${Math.floor(Math.random()*20+2)}min`,
];

/* ── helpers ────────────────────────────────────────────────────── */
function makeDrivers(): Driver[] {
  return DRIVER_NAMES.map((name, i) => ({
    id: i,
    name,
    lat: 40.7128 + (Math.random() - 0.5) * 0.06,
    lng: -74.006 + (Math.random() - 0.5) * 0.09,
    speed: Math.floor(Math.random() * 45 + 5),
    status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
    dLat: (Math.random() - 0.5) * 0.0003,
    dLng: (Math.random() - 0.5) * 0.0004,
    order: `ORD-${10000 + i * 317}`,
  }));
}

function nowHHMMSS() {
  return new Date().toTimeString().slice(0, 8);
}

/* ── SVG icon markup ────────────────────────────────────────────── */
function driverIconSvg(color: string) {
  return `
    <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="12" fill="${color}" fill-opacity="0.12"/>
      <circle cx="14" cy="14" r="8" fill="${color}" fill-opacity="0.25"/>
      <circle cx="14" cy="14" r="5" fill="${color}"/>
      <circle cx="14" cy="14" r="5" fill="${color}" opacity="0.5">
        <animate attributeName="r" values="5;11;5" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>`;
}

function dispatchIconSvg() {
  return `
    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="14" fill="#3b82f6" fill-opacity="0.15"/>
      <circle cx="18" cy="18" r="9" fill="#3b82f6" fill-opacity="0.3"/>
      <circle cx="18" cy="18" r="5" fill="#60a5fa"/>
      <circle cx="18" cy="18" r="5" fill="#3b82f6" opacity="0.6">
        <animate attributeName="r" values="5;15;5" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.7;0;0.7" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <line x1="18" y1="4" x2="18" y2="12" stroke="#60a5fa" stroke-width="1.5"/>
      <line x1="18" y1="24" x2="18" y2="32" stroke="#60a5fa" stroke-width="1.5"/>
      <line x1="4" y1="18" x2="12" y2="18" stroke="#60a5fa" stroke-width="1.5"/>
      <line x1="24" y1="18" x2="32" y2="18" stroke="#60a5fa" stroke-width="1.5"/>
    </svg>`;
}

/* ── global styles injected once ────────────────────────────────── */

/* ═══════════════════════════════════════════════════════════════════
   LeafletMap — mounts Leaflet imperatively, syncs driver markers
   from React state via useEffect / useRef.
═══════════════════════════════════════════════════════════════════ */
interface MapProps {
  drivers: Driver[];
  onAddLog: (msg: string, type: LogType) => void;
}

function LeafletMap({ drivers, onAddLog }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef      = useRef<any>(null);
  const markersRef  = useRef<Map<number, any>>(new Map());
  const dispatchRef = useRef<any>(null);
  const L           = (window as any).L;

  /* ── init map once ── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
  center: [40.7128, -74.006],
  zoom: 13,
  zoomControl: false,
  attributionControl: true,
    });
     mapRef.current = map;
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { attribution: "&copy; CARTO", subdomains: "abcd", maxZoom: 19 }
    ).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    map.on("click", (e:  L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
    //   if (dispatchRef.current) map.removeLayer(dispatchRef.current);
    dispatchRef.current?.remove();
      const icon = L.divIcon({ html: dispatchIconSvg(), className: "", iconSize: [36,36], iconAnchor: [18,18], popupAnchor: [0,-22] });
      dispatchRef.current = L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:monospace;font-size:12px;color:#a5b4fc;padding:4px 6px;">
            <b style="color:#c4b5fd;">NEW DISPATCH REQUEST</b><br>
            <span style="color:#94a3b8;">Lat: ${lat.toFixed(5)}</span><br>
            <span style="color:#94a3b8;">Lng: ${lng.toFixed(5)}</span><br>
            <span style="font-size:10px;color:#6b7280;">Click a driver to assign</span>
          </div>`
        )
        .openPopup();
      onAddLog(`[DISPATCH] New task created at ${lat.toFixed(5)}, ${lng.toFixed(5)}`, "dispatch");
      setTimeout(() => {
        if (dispatchRef.current) { map.removeLayer(dispatchRef.current); dispatchRef.current = null; }
      }, 15000);
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── sync markers whenever drivers state changes ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<number>();

    drivers.forEach(d => {
      seen.add(d.id);
      const color = STATUS_COLORS[d.status];
      const icon  = L.divIcon({ html: driverIconSvg(color), className: "", iconSize: [28,28], iconAnchor: [14,14], popupAnchor: [0,-18] });
        const marker = markersRef.current.get(d.id);
      if (marker && marker._map) {
        const m = markersRef.current.get(d.id);
        m.setLatLng([d.lat, d.lng]);
        // m.setIcon(icon);
      } else {
        const m = L.marker([d.lat, d.lng], { icon }).addTo(map);
        m.bindPopup(
          `<div class="driver-popup">
              ...
          </div>`
        );
        m.on("click", () => {
          m.bindPopup(
            L.popup({ maxWidth: 220, minWidth: 180 }).setContent(
              `<div class="driver-popup">
                <h3>
                  <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="${color}"/></svg>
                  ${d.name}
                </h3>
                <div class="stat-row"><span>Status</span><span class="status-badge">${d.status}</span></div>
                <div class="stat-row"><span>Speed</span><span class="stat-val">${d.speed} mph</span></div>
                <div class="stat-row"><span>Order</span><span class="stat-val">${d.order}</span></div>
                <div class="stat-row"><span>Lat / Lng</span><span class="stat-val">${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}</span></div>
                <div class="stat-row"><span>Signal</span><span class="stat-val" style="color:#4ade80;">Strong</span></div>
              </div>`
            )
          ).openPopup();
          onAddLog(`[INSPECT] ${d.name} selected — ${d.speed}mph, status: ${d.status}`, "info");
        });
        markersRef.current.set(d.id, m);
      }
    });

    // remove stale markers
    markersRef.current.forEach((m, id) => {
      if (!seen.has(id)) { map.removeLayer(m); markersRef.current.delete(id); }
    });
  }, [drivers, L, onAddLog]);

  return (
    <div
      ref={containerRef}
      style={{ position: "fixed", left: 420, top: 0, right: 0, bottom: 0, zIndex: 1 }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ThroughputChart — Chart.js line chart, 30-second rolling window
═══════════════════════════════════════════════════════════════════ */
interface ChartProps { data: number[]; }

function ThroughputChart({ data }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<any>(null);
//   const Chart     = (window as any).Chart;

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    chartRef.current?.destroy();

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: Array.from({ length: 30 }, (_, i) => `${30 - i}s`),
        datasets: [{
          data: [...data],
          borderColor: "#818cf8",
          borderWidth: 1.5,
          pointRadius: 0,
          fill: true,
          backgroundColor: (c: any) => {
            const g = c.chart.ctx.createLinearGradient(0, 0, 0, 110);
            g.addColorStop(0, "rgba(99,102,241,0.3)");
            g.addColorStop(1, "rgba(99,102,241,0)");
            return g;
          },
          tension: 0.45,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400, easing: "easeInOutQuart" },
        interaction: { intersect: false },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: {
            ticks: { display: false },
            grid: { color: "rgba(51,65,85,0.3)" },
            border: { display: false },
          },
          y: {
            min: 40, max: 180,
            ticks: { color: "#475569", font: { size: 9, family: "monospace" }, maxTicksLimit: 4 },
            grid: { color: "rgba(51,65,85,0.25)" },
            border: { display: false },
          },
        },
      },
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.data.datasets[0].data = [...data];
    chartRef.current.update("none");
  }, [data]);

  return (
    <div style={{ background: "rgba(30,41,59,0.4)", border: "1px solid rgba(51,65,85,0.4)", borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b", fontWeight: 600, marginBottom: 10 }}>
        System Throughput (pings/sec) — 30s window
      </div>
      <div style={{ height: 110, position: "relative" }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Terminal — auto-scrolling monospace log panel
═══════════════════════════════════════════════════════════════════ */
function Terminal({ logs }: { logs: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  const colorMap: Record<LogType, string> = {
    normal: "#4ade80",
    info:   "#60a5fa",
    warn:   "#f59e0b",
    dim:    "#64748b",
    dispatch: "#f0abfc",
  };

  return (
    <div
      id="fc-terminal"
      style={{
        flex: 1, overflowY: "auto",
        fontFamily: "var(--font-mono)", fontSize: 11, lineHeight: 1.7,
        color: "#4ade80", padding: 12,
        background: "rgba(2,6,23,0.7)",
        border: "1px solid rgba(51,65,85,0.4)",
        borderRadius: 10, scrollBehavior: "smooth",
      }}
    >
      {logs.map(l => {
        const tsSpan = <span style={{ color: "#64748b" }}>[{l.ts}] </span>;
        if (l.type === "dispatch") {
          return (
            <div key={l.id} style={{ borderLeft: "2px solid #a855f7", paddingLeft: 6, background: "rgba(168,85,247,0.08)", display: "block" }}>
              {tsSpan}<span style={{ color: "#f0abfc" }}>{l.msg}</span>
            </div>
          );
        }
        return (
          <div key={l.id}>
            {tsSpan}<span style={{ color: colorMap[l.type] }}>{l.msg}</span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   KPI Card
═══════════════════════════════════════════════════════════════════ */
function KpiCard({ label, value, sub, valueColor = "#f1f5f9" }: { label: string; value: string | number; sub: string; valueColor?: string }) {
  return (
    <div style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(51,65,85,0.5)", borderRadius: 10, padding: "12px 14px", flex: 1 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: valueColor, lineHeight: 1, letterSpacing: "-0.5px" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{sub}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   App — root component, owns all state
═══════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════
   ScriptLoader — ensures Leaflet + Chart.js are loaded from CDN
   before any component that references window.L / window.Chart.
═══════════════════════════════════════════════════════════════════ */
// const CDN_SCRIPTS = [
//   "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
// ];

function useScriptsLoaded(srcs: string[]) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let remaining = srcs.filter(src => !document.querySelector(`script[src="${src}"]`));
    if (remaining.length === 0) { setLoaded(true); return; }
    let done = 0;
    remaining.forEach(src => {
      const s = document.createElement("script");
      s.src  = src;
      s.onload = () => { done++; if (done === remaining.length) setLoaded(true); };
      document.head.appendChild(s);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return loaded;
}

let logSeq = 0;

function FleetCompassApp() {
  const [drivers,      setDrivers]      = useState<Driver[]>(() => makeDrivers());
  const [chartData,    setChartData]    = useState<number[]>(() => Array.from({ length: 30 }, () => Math.random() * 60 + 80));
  const [kpi,          setKpi]          = useState<KPI>({ ingestion: 0, latency: 14 });
  const [logs,         setLogs]         = useState<LogEntry[]>([]);
  const tickRef = useRef(0);

  const pushLog = useCallback((msg: string, type: LogType = "normal") => {
    const entry: LogEntry = { id: logSeq++, ts: nowHHMMSS(), msg, type };
    setLogs(prev => {
      const next = [...prev, entry];
      return next.length > 200 ? next.slice(next.length - 200) : next;
    });
  }, []);

  /* ── initial boot logs ── */
  useEffect(() => {
    const t = setTimeout(() => {
      pushLog("System boot complete — telemetry stream open", "info");
      pushLog(`Fleet loaded: ${DRIVER_NAMES.length} vehicles registered`);
      pushLog("Connecting to WebSocket ws://fleet.api:9000/stream...", "info");
      setTimeout(() => pushLog("WebSocket CONNECTED — streaming at 1Hz", "info"), 600);
      setTimeout(() => pushLog("Map tiles loaded — CARTO Dark v4", "dim"), 1000);
      drivers.forEach((d, i) => {
        setTimeout(() => pushLog(`REGISTER ${d.name} → ${d.order} [${d.status}]`), 1200 + i * 120);
      });
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 1.5 s simulation tick ── */
  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;

      /* move drivers — the only state change requested */
      setDrivers(prev =>
        prev.map(d => {
          let { lat, lng, dLat, dLng, speed, status } = d;
          lat += dLat + (Math.random() - 0.5) * 0.0001;
          lng += dLng + (Math.random() - 0.5) * 0.0002;
          if (lat > 40.75 || lat < 40.68) dLat = -dLat;
          if (lng > -73.94 || lng < -74.07) dLng = -dLng;
          speed = Math.max(5, Math.min(65, speed + Math.floor((Math.random() - 0.5) * 6)));
          if (Math.random() < 0.02) status = STATUSES[Math.floor(Math.random() * STATUSES.length)] as Status;
          return { ...d, lat, lng, dLat, dLng, speed, status };
        })
      );

      /* chart rolling window */
      setChartData(prev => {
        const last   = prev[prev.length - 1] ?? 100;
        const newVal = Math.max(45, Math.min(175, last + (Math.random() - 0.5) * 30));
        return [...prev.slice(1), parseFloat(newVal.toFixed(1))];
      });

      /* KPIs */
      setChartData(prev => {
        const v = prev[prev.length - 1] ?? 100;
        const lat2 = Math.floor(Math.random() * 30 + 8);
        setKpi({ ingestion: Math.floor(v), latency: lat2 });
        return prev;
      });

      /* logs */
      setDrivers(prev => {
        const d   = prev[Math.floor(Math.random() * prev.length)];
        const fn  = LOG_MSGS[Math.floor(Math.random() * LOG_MSGS.length)];
        pushLog(fn(d));
        if (tick % 7 === 0) {
          const wd = prev[Math.floor(Math.random() * prev.length)];
          pushLog(`[WARN] ${wd.name} latency spike detected — ${Math.floor(Math.random()*80+50)}ms`, "warn");
        }
        if (tick % 11 === 0) {
          const rd = prev[Math.floor(Math.random() * prev.length)];
          pushLog(`[ROUTE] ${rd.name} completed waypoint — next in ${(Math.random()*2+0.3).toFixed(1)}mi`, "info");
        }
        return prev; // no state change here, just side-effects
      });
    }, 1500);

    return () => clearInterval(id);
  }, [pushLog]);

  const latencyColor = kpi.latency > 30 ? "#ef4444" : kpi.latency > 20 ? "#f59e0b" : "#fbbf24";

  return (
    <>
      {/* ── Sidebar ── */}
      <div
        style={{
          position: "fixed", left: 0, top: 0, bottom: 0, width: 420, zIndex: 1000,
          background: "rgba(15,23,42,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(51,65,85,0.5)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 20px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.4)" strokeWidth="1"/>
              <path d="M14 5 L20 10 L20 18 L14 23 L8 18 L8 10 Z" stroke="#818cf8" strokeWidth="1.5" fill="none"/>
              <circle cx="14" cy="14" r="3" fill="#6366f1"/>
              <path d="M14 11 L14 8 M14 17 L14 20 M11 14 L8 14 M17 14 L20 14" stroke="#6366f1" strokeWidth="1.2"/>
            </svg>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.12em", color: "#e2e8f0", textTransform: "uppercase" , paddingBottom: 2 }}>Fleet Compass</div>
              <div style={{ fontSize: 9, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase" }}>Control Room v2.4</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10, marginBottom: 16, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 20, padding: "5px 12px", width: "fit-content" }}>
            <div className="pulse-dot" />
            <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Live Telemetry Active</span>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ padding: "0 16px", flexShrink: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b", fontWeight: 600, marginBottom: 8, paddingLeft: 4 }}>System KPIs</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <KpiCard label="Ingestion Rate" value={kpi.ingestion}     sub="pings / sec" />
            <KpiCard label="Active Fleet"   value={drivers.length}    sub="vehicles online" valueColor="#a5b4fc" />
            <KpiCard label="Queue Latency"  value={kpi.latency}       sub="ms avg"          valueColor={latencyColor} />
          </div>
        </div>

        {/* Chart */}
        <div style={{ padding: "0 16px", flexShrink: 0, marginBottom: 12 }}>
          <ThroughputChart data={chartData} />
        </div>

        {/* Terminal */}
        <div style={{ padding: "0 16px 16px", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b", fontWeight: 600 }}>Telemetry Log</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", animation: "pulse-ring 2s ease-out infinite" }} />
              <span style={{ fontSize: 10, color: "#64748b", fontFamily: "var(--font-mono)" }}>STDIN/LIVE</span>
            </div>
          </div>
          <Terminal logs={logs} />
        </div>
      </div>

      {/* ── Map ── */}
      <LeafletMap drivers={drivers} onAddLog={pushLog} />
    </>
  );
}

/* ── Root export with CDN script gating ─────────────────────────── */
export default function MyApp() {

    // return (
    //   <div style={{
    //     position: "fixed", inset: 0, background: "#020617",
    //     display: "flex", alignItems: "center", justifyContent: "center",
    //     flexDirection: "column", gap: 16,
    //   }}>
    //     <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
    //       <rect width="28" height="28" rx="7" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.4)" strokeWidth="1"/>
    //       <path d="M14 5 L20 10 L20 18 L14 23 L8 18 L8 10 Z" stroke="#818cf8" strokeWidth="1.5" fill="none"/>
    //       <circle cx="14" cy="14" r="3" fill="#6366f1"/>
    //     </svg>
    //     <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: "#64748b", letterSpacing: "0.1em" }}>
    //       LOADING TELEMETRY ENGINE…
    //     </div>
    //   </div>
    // );
  
  return <FleetCompassApp />;
}