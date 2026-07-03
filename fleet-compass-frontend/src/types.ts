export interface UserMetadata {
  fullName?: string;
  email?: string;
  fleet?: string;
}

export type Status = "Idle" | "En Route" | "Offline" ;

export interface Driver {
  id: number;
  name: string;
  phone_number?: string;
  lat?: number;
  lng?: number;
  speed?: number;
  status: Status;
  currentTrip?: {
    id: number,
    orderName: string,
    status: TripStatus,
  }
}

export type LogType = "normal" | "info" | "warn" | "dispatch" | "dim";
export type TripStatus = "Pending" | "Ongoing" | "Completed" | "Failed";

export interface LogEntry {
  id: number;
  ts: string;
  msg: string;
  type: LogType;
}

export interface Trip {
  id: number;
  driver_id: number;
  driver_name: string;
  order_name: string;
  status: TripStatus;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
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
  setDispatch: React.Dispatch<
    React.SetStateAction<{
      lat: number;
      lng: number;
    } | null>
  >;
  routeCoordinates: [number, number][]|[];
  setRouteCoordinates:(coordinates: [number, number][]|[]) => void;
  flyToDriver : Driver | undefined;
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
export interface SettingsForm{
  fullName:string;
  email: string;
  fleet:string;
}

export interface SettingsProps{
  onClose: () => void;
  setSettingsForm:(e:SettingsForm) => void;
  settingsForm: SettingsForm;
  handleSaveSettings: () => void;
  handleDeleteAccount: () => void;
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


export interface DispatchPopupProps {
  lat: number;
  lng: number;
  onClose: () => void;
  onStartTrip: () => void;
}

export type DriverAvailability = "Available" | "Offline" | "Unavailable";

export interface SearchPanelProps {
  drivers: Driver[];
  trips: Trip[];
  onClose: () => void;
  onFindOnMap: (d: Driver) => void;
  onDeleteDriver: (id: number) => void;
  onAddDriver: (name: string,phone:string) => void;
  onDeleteTrip: (id: number) => void;
  onShowRoute: (id:number) => void;
  onSetTrips :(trip:Trip[]) => void;
}

