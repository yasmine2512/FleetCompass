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

export interface FormState {
  name: string;
  fleet: string;
  email: string;
  password: string;
  confirm: string;
}

export interface Errors {
  name?: string;
  fleet?: string;
  email?: string;
  password?: string;
  confirm?: string;
  form?: string;
}

export type Field = "email" | "password" | "name" | "confirm" | "fleet";
export interface InputProps {
  id: Field;
  label: string;
  type?: string;
  value: string;
  placeholder: string;
  error?: string;
  icon: React.ReactNode;
  onChange: (f: Field, v: string) => void;
  rightSlot?: React.ReactNode;
  autoComplete?: string;
}