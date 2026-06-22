export type Status = "Delivering" | "En Route" | "Idle" | "Pick-up";
export interface Driver {
  id: number;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  status: Status;
  vx: number;
  vy: number;
  order: string;
}
export type LogType = "normal" | "info" | "warn" | "dispatch" | "dim";


export interface LogEntry {
  id: number;
  ts: string;
  msg: string;
  type: LogType;
}

export interface KPI {
  ingestion: number;
  latency: number;
}