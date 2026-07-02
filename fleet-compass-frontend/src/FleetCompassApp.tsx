import { useState,useRef,useEffect ,useCallback} from "react";
import type { Driver ,LogEntry,KPI,LogType,TripStatus,Trip,TripWizard} from "./types";
import KpiCard from './KpiCard';
import Terminal from './Terminal';
import ThroughputChart from './ThroughputChart';
import LeafletMap from "./LeafletMap";
import TopBar from "./TopBar";
import DispatchPopup from "./DispatchPopup";
import SearchPanel from "./SearchPanel";
import TripWizardOverlay from "./TripWizard";
import { useNavigate } from "react-router-dom";
import { socket ,fleetApi} from "./api/client";


function nowHHMMSS() {
  return new Date().toTimeString().slice(0, 8);
}
const DRIVER_NAMES = [
  "D-ALPHA","D-BRAVO","D-CHARLIE","D-DELTA","D-ECHO",
  "D-FOXTROT","D-GOLF","D-HOTEL","D-INDIA","D-JULIET",
];

const TRIP_STATUSES: TripStatus[] = ["Pending", "Ongoing", "Completed"];
// when creating a driver
const LOG_MSGS: Array<(d: Driver) => string> = [
  d => `GPS_PING ${d.name} lat=${d.lat?.toFixed(5)} lng=${d.lng?.toFixed(5)}`,
  d => `SPEED_UPDATE ${d.name} → ${d.speed}mph`,
  d => `HEARTBEAT ${d.name} OK signal=strong`,
  d => `STATUS_SYNC ${d.name} [${d.status}]`,
  d => `ROUTE_CALC ${d.name} ETA=+${Math.floor(Math.random()*20+2)}min`,
]


let logSeq = 0;
function FleetCompassApp() {
  const navigate = useNavigate();
  const [User,setUser] = useState(null);
  const [drivers,      setDrivers]      = useState<Driver[]>([]);
  const [chartData,    setChartData]    = useState<number[]>(() => Array.from({ length: 100 }, () => 100));
  const [kpi,          setKpi]          = useState<KPI>({ ingestion: 0, latency: 14 });
  const [logs,         setLogs]         = useState<LogEntry[]>([]);
  const tickRef = useRef(0);
  const [trips,        setTrips]        = useState<Trip[]>([]);
  const [showSearch,   setShowSearch]   = useState(false);
  const [dispatchPopup, setDispatchPopup] = useState<{ lat: number; lng: number } | null>(null);
  const [focusDriver,setFocusDriver] = useState<Driver>();
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);(null);
  const [wizard, setWizard] = useState<TripWizard>({
    step: "idle", originLat: 0, originLng: 0,
    destLat: null, destLng: null, orderName: "", assignedDriverId: null,
  });
  const mapRef = useRef<any>(null); // ref to pan map

//REST api
const [loading, setLoading] = useState(true);

useEffect(() => {
  (async () => {
    try {
      const userRes = await fetch("http://localhost:3001/user/me", {
        credentials: "include",
      });
      if (!userRes.ok) {
        navigate("/");
        return;
      }
      const user = await userRes.json();
      setUser(user);
      const metadata = user?.user_metadata || {};

      const fullName = metadata.fullName || 'No Name Found';
      pushLog(`Welcome Back ${fullName}`);

      const [driversRes, tripsRes] = await Promise.all([
        fleetApi.getDrivers(),
        fleetApi.getTrips(),
      ]);
      setDrivers(driversRes.data);
      setTrips(tripsRes.data);
      navigate("/App");
    } catch (err) {
      navigate("/");
    } finally {
      setLoading(false);
    }
  })();
}, []);


// socket api
useEffect(() => {
  socket.connect();
  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });
  socket.on("tripRequested", (data) => {
    setTrips(prev => [
      ...prev,
      {
        id: data.tripId,
        status: "Pending",
      } as Trip,
    ]);
  });
  socket.on("tripStarted", (data) => {
    const { tripId, driverId, orderName } = data;
    setTrips(prev =>
      prev.map(t =>
        t.id === tripId
          ? { ...t, tripStatus: "Ongoing", orderName }
          : t
      )
    );
    setDrivers(prev =>
      prev.map(d =>
        d.id === driverId
          ? { ...d, status: "En Route",
                  order: data.orderName }
          : d
      )
    );
  });
  socket.on("locationUpdate", (data) => {
    const { driverId, latitude, longitude, speed } = data;
    setDrivers(prev =>
      prev.map(d =>
        d.id === driverId
          ? {...d,
              lat: latitude,
              lng: longitude,
              speed,
            }
          : d
      )
    );
  });
  socket.on("tripCompleted", (data) => {
    const { tripId, driverId } = data;

    setTrips(prev =>
      prev.map(t =>
        t.id === tripId
          ? { ...t, tripStatus: "Completed" }
          : t
      )
    );
    setDrivers(prev =>
      prev.map(d =>
        d.id === driverId
          ? { ...d, tripStatus: "Completed", status: "Idle",
                  order: null ,speed: 0}
          : d
      )
    );
  });
    socket.on("driverCreated", (driver) => {
      setDrivers(prev => [...prev, driver]);
      pushLog(`[DRIVER] ${driver.name} added`, "info");
  });
  socket.on("error", (data) => {
    console.error("Socket error:", data.message);
    pushLog(`[ERROR] ${data.message}`, "warn");
  });

  return () => {
    socket.disconnect();
  };
}, []);

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
      pushLog("Connecting to WebSocket ...", "info");
      setTimeout(() => pushLog("WebSocket CONNECTED — streaming at 1Hz", "info"), 600);
      setTimeout(() => pushLog("Map tiles loaded — CARTO Dark v4", "dim"));
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleMapClick = useCallback((lat: number, lng: number) => {
      if (wizard.step === "pick-destination") {
        // wizard step 1 complete — move to assign
        setWizard(w => ({ ...w, step: "assign", destLat: lat, destLng: lng }));
        pushLog(`[ORDER] Destination set at ${lat.toFixed(5)}, ${lng.toFixed(5)}`, "info");
        return;
      }
      if (wizard.step === "assign") return; // ignore clicks during assign step
      // normal dispatch popup
      setDispatchPopup({ lat, lng });
      pushLog(`[DISPATCH] New task created at ${lat.toFixed(5)}, ${lng.toFixed(5)}`, "dispatch");
       pushLog(`[DISPATCH] new warn`, "warn");
       pushLog(`[DISPATCH] new dim`, "dim");
       pushLog(`[DISPATCH] new normal`, "normal");
       pushLog(`[DISPATCH] new info`, "info");
      

      
    }, [wizard.step, pushLog]);
  
    /* ── driver focus (from search "Find on map" or driver click) ── */
    const handleFocusDriver = useCallback((d: Driver) => {
      setFocusDriver(d);
    }, []);
    useEffect(() => {
  if (!focusDriver) return;
  const timer = setTimeout(() => {
    setFocusDriver(undefined); 
  }, 50);
  return () => clearTimeout(timer);
}, [focusDriver]);
  
    /* ── trip wizard handlers ── */
    const handleStartTrip = () => {
      if (!dispatchPopup) return;
      setDispatchPopup(null);
      setWizard({
        step: "pick-destination",
        originLat: dispatchPopup.lat, originLng: dispatchPopup.lng,
        destLat: null, destLng: null, orderName: "", assignedDriverId: null,
      });
      pushLog("[TRIP] Wizard started — click destination on map", "dispatch");
    };
  
    const handleConfirmTrip = () => {
      if (!wizard.assignedDriverId || !wizard.orderName.trim() || wizard.destLat === null) return;
      const driver = drivers.find(d => d.id === wizard.assignedDriverId);
      if (!driver) return;
      const payload = {
        driverId: wizard.assignedDriverId,
        orderName: wizard.orderName,
        startLongitude: wizard.originLng,
        startLatitude: wizard.originLat,
        destLongitude: wizard.destLng,
        destLatitude: wizard.destLat,
        started_at: new Date(),
      };
      socket.emit("startTrip", payload);
      pushLog(`[Order] ${driver.name} assigned → ${wizard.orderName} (${wizard.originLat.toFixed(4)},${wizard.originLng.toFixed(4)}) → (${wizard.destLat.toFixed(4)},${wizard.destLng!.toFixed(4)})`, "dispatch");
  
      setWizard({ step: "idle", originLat: 0, originLng: 0, destLat: null, destLng: null, orderName: "", assignedDriverId: null });
    };
  
    const handleCancelWizard = () => {
      setWizard({ step: "idle", originLat: 0, originLng: 0, destLat: null, destLng: null, orderName: "", assignedDriverId: null });
      pushLog("[TRIP] Wizard cancelled", "warn");
    };

    const showRoute = async (tripId: number) => {
   try {
    const data = await getRoute(tripId);
    console.log(data);
    setRouteCoordinates(data);
  
  } catch(err){
    console.error(err);
    pushLog("Couldn't load route", "warn");
  }
};

const DeleteDriver = (driverId:number) =>{
try {
    fleetApi.deleteDriver(driverId);
    setDrivers(prev => prev.filter(d => d.id !== driverId));
    pushLog("Driver deleted", "normal");
  } catch (err) {
    pushLog("Couldn't delete driver", "warn");
  }
}
const AddDriver = (name: string) =>{
  fleetApi.createDriver(name);
  pushLog('[Drivers] Created new Driver',"info");
}
const DeleteTrip = (tripId:number) =>{
try {
    fleetApi.deleteDriver(tripId);
    setTrips(prev => prev.filter(d => d.id !== tripId));

    pushLog("Order deleted", "normal");
  } catch (err) {
    pushLog("Couldn't delete Order", "warn");
  }
}
const getRoute = async(tripId: number) =>{
const res = await fleetApi.getRoute(tripId);
return res.data;
}

const handleLogout= async () => {
 try{
await fleetApi.logout();
setUser(null);
navigate("/");
 }catch(err){
  pushLog("Failed to Logout","warn")
 }
}

  const latencyColor = kpi.latency > 30 ? "#ef4444" : kpi.latency > 20 ? "#f59e0b" : "#fbbf24";

  if (loading){
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#020617",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 16,
      }}>
        <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="7" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.4)" strokeWidth="1"/>
          <path d="M14 5 L20 10 L20 18 L14 23 L8 18 L8 10 Z" stroke="#818cf8" strokeWidth="1.5" fill="none"/>
          <circle cx="14" cy="14" r="3" fill="#6366f1"/>
        </svg>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: "#64748b", letterSpacing: "0.1em" }}>
          LOADING TELEMETRY ENGINE…
        </div>
      </div>
    );
  }

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

      <TopBar onSearch={() => setShowSearch(true)} onLogout={() => handleLogout()} />


      {/* ── Map ── */}
      <LeafletMap
       setDispatch={setDispatchPopup}
       drivers={drivers}
       onAddLog={pushLog}
       wizard={wizard}
       onMapClick={handleMapClick}
       onFocusDriver={handleFocusDriver}
       routeCoordinates={routeCoordinates}
       setRouteCoordinates={setRouteCoordinates}
       flyToDriver={focusDriver} />

       {/* ── Dispatch popup (non-wizard) ── */}
      {dispatchPopup && wizard.step === "idle" && (
        <DispatchPopup
          lat={dispatchPopup.lat}
          lng={dispatchPopup.lng}
          onClose={() => setDispatchPopup(null)}
          onStartTrip={handleStartTrip}
        />
      )}

      {/* ── Trip wizard ── */}
      {wizard.step !== "idle" && (
        <TripWizardOverlay
          wizard={wizard}
          drivers={drivers}
          onSetOrderName={name => setWizard(w => ({ ...w, orderName: name }))}
          onAssignDriver={id => setWizard(w => ({ ...w, assignedDriverId: id }))}
          onConfirm={handleConfirmTrip}
          onCancel={handleCancelWizard}
        />
      )}

      {/* crosshair hint banner */}
      {wizard.step === "pick-destination" && (
        <div style={{
          position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)",
          zIndex: 2600, padding: "8px 18px",
          background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)",
          borderRadius: 20, color: "#fbbf24", fontSize: 12, fontWeight: 600,
          letterSpacing: "0.05em", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", gap: 8,
          animation: "fc-pop-in 0.2s ease",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Click the destination point on the map
        </div>
      )}

      {/* ── Search panel ── */}
      {showSearch && (
        <SearchPanel
          drivers={drivers}
          trips={trips}
          onClose={() => setShowSearch(false)}
          onFindOnMap={handleFocusDriver}
          onDeleteDriver={DeleteDriver}
          onAddDriver= {AddDriver}
          onDeleteTrip={DeleteTrip}
          onShowRoute ={showRoute}
        />
      )}

    </>
  );
}
export default FleetCompassApp