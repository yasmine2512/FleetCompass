import { useEffect, useRef } from 'react';
import type { Driver, LogType, Status, TripWizard, MapProps } from './types'
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

function destinationIconSvg() {
  return `
    <svg width="32" height="38" viewBox="0 0 32 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 22 16 22S32 26 32 16C32 7.163 24.837 0 16 0z" fill="#f59e0b" fill-opacity="0.85"/>
      <circle cx="16" cy="16" r="6" fill="#fff"/>
      <circle cx="16" cy="16" r="3" fill="#f59e0b"/>
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

const STATUS_COLORS: Record<Status, string> = {
  "Idle": "#4ade80",
  "En Route": "#60a5fa",
  "Offline": "#f59e0b",
};

// Helper function to build fresh popup HTML strings using the absolute latest state variables
function getDriverPopupHtml(driver: Driver): string {
  const color = STATUS_COLORS[driver.status] ?? "#fff";
  return `
    <div class="driver-popup">
      <h3>
        <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="${color}"/></svg>
        ${driver.name}
      </h3>
      <div class="stat-row"><span>Status</span><span class="status-badge">${driver.status}</span></div>
      <div class="stat-row"><span>Speed</span><span class="stat-val">${driver.speed?.toFixed(2) ?? "0.00"} mph</span></div>
      <div class="stat-row"><span>Order</span><span class="stat-val">${driver.currentTrip?.orderName ?? "No active order"}</span></div>
      <div class="stat-row"><span>Lat / Lng</span><span class="stat-val">${driver.lat?.toFixed(4)}, ${driver.lng?.toFixed(4)}</span></div>
      <div class="stat-row"><span>Signal</span><span class="stat-val" style="color:#4ade80;">Strong</span></div>
    </div>`;
}

function LeafletMap({ drivers, onAddLog, wizard, onMapClick, onFocusDriver, setDispatch, routeCoordinates, setRouteCoordinates, flyToDriver }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const dispatchRef = useRef<any>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const driverDataRef = useRef<Map<number, Driver>>(new Map());
  const destMarkerRef = useRef<any>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);

  /* ── Smooth Camera FlyTo Target Sync ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToDriver) return;
    map.setView([flyToDriver.lat, flyToDriver.lng], 15, { animate: true });
  }, [flyToDriver]);

  /* ── Init map layout context once ── */
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

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      dispatchRef.current?.remove();

      const icon = L.divIcon({
        html: dispatchIconSvg(),
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      dispatchRef.current = L.marker([lat, lng], { icon }).addTo(map);
      setDispatch({ lat, lng });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* ── Wire map click to parent handler ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = (e: any) => onMapClick(e.latlng.lat, e.latlng.lng);
    map.on("click", handler);
    return () => map.off("click", handler);
  }, [onMapClick]);

  /* ── Destination marker logic (wizard state handler) ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (destMarkerRef.current) { map.removeLayer(destMarkerRef.current); destMarkerRef.current = null; }
    if (wizard.step === "assign" && wizard.destLat !== null && wizard.destLng !== null) {
      const icon = L.divIcon({ html: destinationIconSvg(), className: "", iconSize: [32, 38], iconAnchor: [16, 38], popupAnchor: [0, -38] });
      destMarkerRef.current = L.marker([wizard.destLat, wizard.destLng], { icon })
        .addTo(map)
        .bindPopup(`<div style="font-family:monospace;font-size:11px;color:#fbbf24;padding:3px 5px;"><b>Destination</b><br><span style="color:#94a3b8;">${wizard.destLat.toFixed(5)}, ${wizard.destLng.toFixed(5)}</span></div>`)
        .openPopup();
    }
  }, [wizard.destLat, wizard.destLng, wizard.step]);

  /* ── Draw Route ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (routeRef.current) { map.removeLayer(routeRef.current); routeRef.current = null; }
    if (startMarkerRef.current) { map.removeLayer(startMarkerRef.current); startMarkerRef.current = null; }
    if (endMarkerRef.current) { map.removeLayer(endMarkerRef.current); endMarkerRef.current = null; }
    if (!routeCoordinates || routeCoordinates.length === 0) return;

    routeRef.current = L.polyline(routeCoordinates as [number, number][], {
      color: "#3b82f6",
      weight: 3,
      opacity: 0.6,
    }).addTo(map);

    const start = routeCoordinates[0];
    startMarkerRef.current = L.marker(start).addTo(map).bindPopup("Start");

    const end = routeCoordinates[routeCoordinates.length - 1];
    endMarkerRef.current = L.marker(end).addTo(map).bindPopup("End");

    map.fitBounds(routeRef.current.getBounds());
  }, [routeCoordinates]);


  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<number>();

    drivers.forEach(d => {
      const lat = d.lat ?? 0;
      const lng = d.lng ?? 0;
      seen.add(d.id);
      
      // Update our reference map with the absolute latest driver fields
      driverDataRef.current.set(d.id, d);

      const color = STATUS_COLORS[d.status] ?? "#ffffff";
      const icon = L.divIcon({ 
        html: driverIconSvg(color), 
        className: "", 
        iconSize: [28, 28], 
        iconAnchor: [14, 14], 
        popupAnchor: [0, -18] 
      });

      const marker = markersRef.current.get(d.id);

      if (marker && map.hasLayer(marker)) {
        marker.setLatLng([lat, lng]);
        marker.setIcon(icon);

        if (marker.isPopupOpen()) {
          marker.setPopupContent(getDriverPopupHtml(d));
        }
      } else {
        const m = L.marker([lat, lng], { icon }).addTo(map);
        m.bindPopup(""); 
        (m as any).driverId = d.id;

        m.on("click", (ev: any) => {
          ev.originalEvent?.stopPropagation();
          
          const latestDriverState = driverDataRef.current.get((m as any).driverId);
          if (!latestDriverState) return;

          onFocusDriver(latestDriverState);
          m.bindPopup(getDriverPopupHtml(latestDriverState)).openPopup();
          
          onAddLog(`[INSPECT] ${latestDriverState.name} selected — status: ${latestDriverState.status}`, "info");
        });

        markersRef.current.set(d.id, m);
      }
    });
    markersRef.current.forEach((m, id) => {
      if (!seen.has(id)) { 
        map.removeLayer(m); 
        markersRef.current.delete(id); 
        driverDataRef.current.delete(id);
      }
    });
  }, [drivers, onAddLog, onFocusDriver]);

  const focusOnDriver = (d: Driver) => {
    mapRef.current?.setView([d.lat, d.lng], 15, { animate: true });
  };
  
  (LeafletMap as any)._focusOnDriver = focusOnDriver;

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed", left: 320, top: 0, right: 0, bottom: 0, zIndex: 1,
        cursor: wizard.step === "pick-destination" ? "crosshair" : "grab",
      }}
    >
      {/* ── Floating Clear Button ── */}
      {routeCoordinates && routeCoordinates.length > 0 && (
        <button
          onClick={() => setRouteCoordinates([])}
          title="Close Route History"
          style={{
            position: 'absolute', top: '10px', left: '30px', zIndex: 1000,
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            outline: 'none', transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="16" fill="#ef4444" fillOpacity="0.1" />
            <circle cx="20" cy="20" r="11" fill="#ef4444" fillOpacity="0.2" />
            <circle cx="20" cy="20" r="6" fill="#ef4444" opacity="0.6">
              <animate attributeName="r" values="6;16;6" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
            </circle>
            <line x1="12" y1="12" x2="28" y2="28" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
            <line x1="28" y1="12" x2="12" y2="28" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default LeafletMap;