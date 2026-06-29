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
  tripStatus: TripStatus;
  available: boolean;
}
export type LogType = "normal" | "info" | "warn" | "dispatch" | "dim";
export type TripStatus = "Pending" | "Ongoing" | "Completed";

export interface LogEntry {
  id: number;
  ts: string;
  msg: string;
  type: LogType;
}

export interface Trip {
  id: string;
  driverId: number;
  driverName: string;
  orderName: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  tripStatus: TripStatus;
}

export type TripWizardStep = "idle" | "pick-destination" | "assign";
export interface TripWizard {
  step: TripWizardStep;
  originLat: number;
  originLng: number;
  destLat: number | null;
  destLng: number | null;
  orderName: string;
  assignedDriverId: number | null;}

export interface TripWizardOverlayProps {
  wizard: TripWizard;
  drivers: Driver[];
  onSetOrderName: (name: string) => void;
  onAssignDriver: (id: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}


export interface MapProps {
  drivers: Driver[];
  onAddLog: (msg: string, type: LogType) => void;
  wizard: TripWizard;
  onMapClick: (lat: number, lng: number) => void;
  onFocusDriver: (d: Driver) => void;
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

export interface SearchPanelProps {
  drivers: Driver[];
  trips: Trip[];
  onClose: () => void;
  onFindOnMap: (d: Driver) => void;
}

export interface DispatchPopupProps {
  lat: number;
  lng: number;
  onClose: () => void;
  onStartTrip: () => void;
}