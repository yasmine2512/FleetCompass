import { useState,useRef,useEffect ,useCallback} from "react";
import type { Driver ,LogEntry,KPI,LogType,UserMetadata,Trip,TripWizard,SettingsForm} from "./types";
import KpiCard from './KpiCard';
import Terminal from './Terminal';
import Settings from "./Settings";
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
  const [user,setUser] = useState<UserMetadata>({});
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
      setUser(user.user_metadata);
      const metadata = user?.user_metadata || {};
      const fullName = metadata.fullName || 'No Name Found';
      console.log(fullName);

      const [driversRes, tripsRes] = await Promise.all([
        fleetApi.getDrivers(),
        fleetApi.getTrips(1,8,""),
      ]);
      setDrivers(driversRes.data);
      setTrips(tripsRes.data.data);
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
  
  const handleConnect = () => {
    console.log("Socket connected:", socket.id);
  };

  const handleDriverCreated = (data: any) => {
    setDrivers(prev => {
      if (prev.some(d => d.id === data.driver.id)) return prev;
      return [...prev, { ...data.driver, lat: data.lat, lng: data.lng, currentTrip: null, speed: 0 }];
    });
      pushLog(`[DRIVER] ${data.driver.name} initialized on map context`, "normal");
  };

  const handleTripRequested = (data: any) => {
    setTrips(prev => [
      ...prev,
      {
        id: data.tripId,
        status: data.status,
      } as Trip,
    ]);
  };

  const handleTripStarted = (data: any) => {
    console.log("started:",data.orderName);
    const { tripId, driverId, orderName } = data;
    setTrips(prev =>
      prev.map(t =>
        t.id === tripId
          ? { ...t, status: "Ongoing", order_name: orderName }  
          : t
      )
    );
    setDrivers(prev =>
      prev.map(d =>
        d.id === driverId
          ? { ...d, status: "En Route",
              currentTrip: {
                id: tripId,
                orderName: orderName,
                status: "Ongoing"
              }
            }
          : d
      )
    );
  };

  const handleLocationUpdate = (data: any) => {
    const { driverId, latitude, longitude, speed } = data;
    setDrivers(prev =>
      prev.map(d =>
        d.id === driverId
          ? { ...d, lat: latitude, lng: longitude, speed }
          : d
      )
    );
  };

  const handleTripCompleted = (data: any) => {
    const { tripId, driverId } = data;
    setTrips(prev =>
      prev.map(t =>
        t.id === tripId ? { ...t, status: "Completed" } : t
      )
    );
    setDrivers(prev =>
      prev.map(d =>
        d.id === driverId ? { ...d, status: "Idle", speed: 0, currentTrip: undefined } : d
      )
    );
  };

  const handleSocketError = (data: any) => {
    console.error("Socket error:", data.message);
    pushLog(`[ERROR] ${data.message}`, "warn");
    if (data.driverId) {
    setDrivers(prev =>
      prev.map(d =>
        d.id === data.driverId
          ? { ...d, status: "Idle", speed: 0, currentTrip: undefined }
          : d
      )
    );
  }
  if (data.tripId) {
    setTrips(prev =>prev.map(t =>
         t.id === data.tripId
          ? { ...t, status: "Failed" }
          : t
      )
    );
  }
  };

  socket.on("connect", handleConnect);
  socket.on("driverCreated", handleDriverCreated);
  socket.on("tripRequested", handleTripRequested);
  socket.on("tripStarted", handleTripStarted);
  socket.on("locationUpdate", handleLocationUpdate);
  socket.on("tripCompleted", handleTripCompleted);
  socket.on("error", handleSocketError);

  return () => {
    socket.off("connect", handleConnect);
    socket.off("driverCreated", handleDriverCreated);
    socket.off("tripRequested", handleTripRequested);
    socket.off("tripStarted", handleTripStarted);
    socket.off("locationUpdate", handleLocationUpdate);
    socket.off("tripCompleted", handleTripCompleted);
    socket.off("error", handleSocketError);
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
    if (!user) return;
    const t = setTimeout(() => {
      pushLog("System boot complete — telemetry stream open", "info");
      pushLog("Connecting to WebSocket ...", "info");
      pushLog(`Welcome Back ${user.fullName}`);
      setTimeout(() => pushLog("WebSocket CONNECTED — streaming at 1Hz", "info"), 600);
      setTimeout(() => pushLog("Map tiles loaded — CARTO Dark v4", "dim"));
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  const handleMapClick = useCallback((lat: number, lng: number) => {
      if (wizard.step === "pick-destination") {
        // wizard step 1 complete — move to assign
        setDispatchPopup(null);
        setWizard(w => ({ ...w, step: "assign", destLat: lat, destLng: lng }));
        pushLog(`[ORDER] Destination set at ${lat.toFixed(5)}, ${lng.toFixed(5)}`, "info");
        return;
      }
      if (wizard.step === "assign") return; // ignore clicks during assign step
      // normal dispatch popup
      setDispatchPopup({ lat, lng });
      // pushLog(`[DISPATCH] New task created at ${lat.toFixed(5)}, ${lng.toFixed(5)}`, "dispatch");
      //  pushLog(`[DISPATCH] new warn`, "warn");
      //  pushLog(`[DISPATCH] new dim`, "dim");
      //  pushLog(`[DISPATCH] new normal`, "normal");
      //  pushLog(`[DISPATCH] new info`, "info");
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
const AddDriver = (name: string,phone:string) =>{
  fleetApi.createDriver(name,phone);
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
setUser({});
navigate("/");
 }catch(err){
  pushLog("Failed to Logout","warn")
 }
}
const [showSettings, setShowSettings] = useState(false);
const [settingsForm, setSettingsForm] = useState<SettingsForm>({
  fullName:"", 
  email:"", // Read-only view
  fleet:""
});

useEffect(() => {
  if (user) {
    setSettingsForm({
      fullName: user.fullName || "",
      email: user.email || "", 
      fleet: user.fleet || ""
    });
  }
}, [user]);

const handleSaveSettings = async() => {
  console.log("Saving profile changes...", settingsForm);
  try {
    const response = await fleetApi.updateProfile(
    settingsForm.fullName!,
    settingsForm.fleet!
  );
    console.log("Profile updated:", response.data);
    alert("Configuration saved successfully!");
    const currentFullName = response.data.user.user_metadata.fullName;
const currentFleet = response.data.user.user_metadata.fleet;
console.log(currentFleet,currentFullName)
    setShowSettings(false);

  } catch (error: any) {
    console.error("Failed to update metadata:", error);
    if (error.response && error.response.data) {
      alert(`Error updating settings: ${error.response.data.message}`);
    } else {
      alert("Network error. Unable to save settings.");
    }
  }
};

// Mock account deletion handler
const handleDeleteAccount = async() => {
  if (confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
    try {
    console.log("Deleting account permanently...");
  const response = await fleetApi.deleteAccount();
  if (response.data?.success || response.status === 200 || response.status === 204) {
        alert("Your profile network context has been successfully terminated.");
        navigate("/");
      }
    }catch(error : any){
      console.error("Account erasure failed:", error);
      const serverMessage = error.response?.data?.message || 'Failed to destroy profile context.';
      alert(serverMessage);
    }
  }
};

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
          {/* Settings Button (Top-Right Viewport Alignment) */}
    <button 
      onClick={() => setShowSettings(true)}
      title="System Settings"
      className="absolute top-5 right-5 p-2 rounded-lg border border-slate-700/50 bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:border-indigo-500/30 transition-all duration-200 cursor-pointer"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>
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
          onSetTrips ={(trip:Trip[]) => setTrips(trip)}
        />
      )}

      {showSettings &&(
        <Settings 
        onClose={() => setShowSettings(false)}
        setSettingsForm={setSettingsForm}
        settingsForm= {settingsForm}
        handleSaveSettings={handleSaveSettings}
        handleDeleteAccount={handleDeleteAccount}
        />
      )}

    </>
  );
}
export default FleetCompassApp