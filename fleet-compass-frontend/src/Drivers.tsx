import type {Driver ,Status }from "./types";
const DRIVER_NAMES = [
  "D-ALPHA","D-BRAVO","D-CHARLIE","D-DELTA","D-ECHO",
  "D-FOXTROT","D-GOLF","D-HOTEL","D-INDIA","D-JULIET",
];


function Drivers(){

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
]
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




}
export default Drivers