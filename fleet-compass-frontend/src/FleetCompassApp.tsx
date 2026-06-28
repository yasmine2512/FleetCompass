import { useState,useRef,useEffect ,useCallback} from "react";
import type { Driver ,LogEntry,KPI,Status,LogType } from "./types";
import KpiCard from './KpiCard';
import Terminal from './Terminal';
import ThroughputChart from './ThroughputChart';
import LeafletMap from "./LeafletMap";
import { useNavigate } from "react-router-dom";
const [User,setUser] = useState(null);
const navigate = useNavigate();
useEffect(() => {
  fetch("http://localhost:3001/user/me", {
    credentials: "include",
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(user => {
      setUser(user);
      navigate("/dashboard");
    })
    .catch(() => {
      navigate("/");
    });
}, []);

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
function nowHHMMSS() {
  return new Date().toTimeString().slice(0, 8);
}
const DRIVER_NAMES = [
  "D-ALPHA","D-BRAVO","D-CHARLIE","D-DELTA","D-ECHO",
  "D-FOXTROT","D-GOLF","D-HOTEL","D-INDIA","D-JULIET",
];

const STATUSES: Status[] = ["Delivering","En Route","Idle","Pick-up"];

const LOG_MSGS: Array<(d: Driver) => string> = [
  d => `GPS_PING ${d.name} lat=${d.lat.toFixed(5)} lng=${d.lng.toFixed(5)}`,
  d => `SPEED_UPDATE ${d.name} → ${d.speed}mph`,
  d => `HEARTBEAT ${d.name} OK signal=strong`,
  d => `STATUS_SYNC ${d.name} [${d.status}]`,
  d => `ROUTE_CALC ${d.name} ETA=+${Math.floor(Math.random()*20+2)}min`,
]
    function makeDrivers(): Driver[] {
  return DRIVER_NAMES.map((name, i) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.0002 + Math.random() * 0.0006;
    return{
    id: i,
    name,
    lat: 40.7128 + (Math.random() - 0.5) * 0.05,
    lng: -74.006 + (Math.random() - 0.5) * 0.09,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    speed: Math.floor(Math.random() * 30 + 25),
    status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
    order: `ORD-${10000 + i * 317}`,
     } });
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
     setDrivers(prev =>  prev.map(d => {
    let { lat, lng, vx, vy, speed, status } = d;
    // ── individual steering (small randomness per driver)
    const steerStrength = 0.00003;
    vx += (Math.random() - 0.5) * steerStrength;
    vy += (Math.random() - 0.5) * steerStrength;
    const maxSpeed = 0.0008;
    const mag = Math.sqrt(vx * vx + vy * vy);
    if (mag > maxSpeed) {
      vx = (vx / mag) * maxSpeed;
      vy = (vy / mag) * maxSpeed;
}
// ── move using THEIR OWN velocity (no normalization!)
    lat += vy;
    lng += vx;
    // ── soft bounce boundaries
    const latMin = 40.68, latMax = 40.75;
    const lngMin = -74.07, lngMax = -73.94;
    if (lat > latMax || lat < latMin) vy *= -1;
    if (lng > lngMax || lng < lngMin) vx *= -1;
    // ── occasional direction change per driver
    if (Math.random() < 0.01) {
      const turn = (Math.random() - 0.5) * 0.6;
      const cos = Math.cos(turn);
      const sin = Math.sin(turn);
      const newVx = vx * cos - vy * sin;
      const newVy = vx * sin + vy * cos;
      vx = newVx;
      vy = newVy;
    }

    // ── speed changes PER DRIVER (not global)
    speed = Math.max(
      25,
      Math.min(90, speed + (Math.random() - 0.5) * 2)
    );

    // ── rare status change
    if (Math.random() < 0.008) {
      status = STATUSES[Math.floor(Math.random() * STATUSES.length)] as Status;
    }

    return { ...d, lat, lng, vx, vy, speed, status };
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
      <div className="Sidebar flex flex-col h-full bg-slate-900/90 backdrop-blur-xl border-r border-slate-700/50 overflow-hidden">
        {/* Header */}
        <div className="pt-5 px-5 flex-shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.4)" strokeWidth="1"/>
              <path d="M14 5 L20 10 L20 18 L14 23 L8 18 L8 10 Z" stroke="#818cf8" strokeWidth="1.5" fill="none"/>
              <circle cx="14" cy="14" r="3" fill="#6366f1"/>
              <path d="M14 11 L14 8 M14 17 L14 20 M11 14 L8 14 M17 14 L20 14" stroke="#6366f1" strokeWidth="1.2"/>
            </svg>
            <div>
              <div className="text-[15px] font-extrabold tracking-[0.12em] text-slate-200 uppercase pb-[2px]">Fleet Compass</div>
              <div className="text-[9px] tracking-[0.08em] text-slate-500 uppercase">Control Room v2.4</div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 mb-4 px-3 py-1.5 w-fit rounded-full border border-green-500/20 bg-green-500/10">
            <div className="pulse-dot" />
            <span className="text-[10px] text-green-400 font-semibold tracking-[0.08em] uppercase">Live Telemetry Active</span>
          </div>
        </div>

        {/* KPIs */}
        <div className="px-4 flex-shrink-0">
          <div  className="text-[10px] tracking-[0.1em] uppercase text-slate-500 font-semibold mb-2 pl-1">System KPIs</div>
          <div className="flex gap-2 mb-3">
            <KpiCard label="Ingestion Rate" value={kpi.ingestion}     sub="pings / sec" />
            <KpiCard label="Active Fleet"   value={drivers.length}    sub="vehicles online" valueColor="#a5b4fc" />
            <KpiCard label="Queue Latency"  value={kpi.latency}       sub="ms avg"          valueColor={latencyColor} />
          </div>
        </div>

        {/* Chart */}
        <div className="px-4 flex-shrink-0 mb-3">
          <ThroughputChart data={chartData} />
        </div>

        {/* Terminal */}
        <div className="px-4 pb-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] tracking-[0.1em] uppercase text-slate-500 font-semibold">Telemetry Log</div>
            <div className="flex items-center gap-[5px]">
              <div  className="w-[5px] h-[5px] rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-slate-500 font-mono">STDIN/LIVE</span>
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
export default FleetCompassApp