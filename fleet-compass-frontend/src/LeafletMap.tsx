import { useEffect,useRef } from 'react';
import type {Driver ,Status ,LogType} from './types'
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
  "Delivering": "#4ade80",
  "En Route": "#60a5fa",
  "Idle": "#f59e0b",
  "Pick-up": "#f472b6",
};

interface MapProps {
  drivers: Driver[];
  onAddLog: (msg: string, type: LogType) => void;
}
function LeafletMap({ drivers, onAddLog }: MapProps){
 const containerRef = useRef<HTMLDivElement>(null);
  const mapRef      = useRef<any>(null);
  const dispatchRef = useRef<any>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
const driverDataRef = useRef<Map<number, Driver>>(new Map());

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
      const color = STATUS_COLORS[d.status] ?? "#ffffff";
      const icon  = L.divIcon({ html: driverIconSvg(color), className: "", iconSize: [28,28], iconAnchor: [14,14], popupAnchor: [0,-18] });
        const marker = markersRef.current.get(d.id);
        driverDataRef.current.set(d.id, d);
      if (marker && map.hasLayer(marker)) {
        
        marker.setLatLng([d.lat, d.lng]);
        marker.setIcon(
      L.divIcon({
        html: driverIconSvg(STATUS_COLORS[d.status]),
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -18],
      })
    );
      } else {
        const m = L.marker([d.lat, d.lng], { icon }).addTo(map);
        m.bindPopup(""); 
        (m as any).driverId = d.id;
        // driverDataRef.current.set(d.id, d);
        m.on("click", () => {
           const id = (m as any).driverId;
          const latest = driverDataRef.current.get(id);
           if (!latest) return;
           const color = STATUS_COLORS[latest.status] ?? "#fff";
          const html = `<div class="driver-popup">
                <h3>
                  <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="${color}"/></svg>
                  ${latest.name}
                </h3>
                <div class="stat-row"><span>Status</span><span class="status-badge">${latest.status}</span></div>
                <div class="stat-row"><span>Speed</span><span class="stat-val">${latest.speed.toFixed(4)} mph</span></div>
                <div class="stat-row"><span>Order</span><span class="stat-val">${latest.order}</span></div>
                <div class="stat-row"><span>Lat / Lng</span><span class="stat-val">${latest.lat.toFixed(4)}, ${latest.lng.toFixed(4)}</span></div>
                <div class="stat-row"><span>Signal</span><span class="stat-val" style="color:#4ade80;">Strong</span></div>
              </div>`
          m.setPopupContent(html);
           m.openPopup();
          onAddLog(`[INSPECT] ${latest.name} selected — ${latest.speed}mph, status: ${latest.status}`, "info");
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
export default LeafletMap