import axios from "axios";
import { io } from "socket.io-client";

export const api = axios.create({
  baseURL: "http://localhost:3001",
  withCredentials: true,
});

export const fleetApi = {
  getInitialState: () => api.get("/fleets"),
  getDrivers: () => api.get("/fleets/drivers"),
  createDriver: (name: string) => api.post("/fleets/drivers", {name}),
  getTrips: () => api.get("/fleets"),
  createTrip: (data: any) => api.post("/fleets/trips", data),
  deleteTrip: (id: string) => api.delete(`/fleets/${id}`),
  deleteDriver: (id: number) => api.delete(`/fleets/drivers/${id}`),
};

export const socket = io("http://localhost:3001", {
  withCredentials: true,
  autoConnect: false,
});