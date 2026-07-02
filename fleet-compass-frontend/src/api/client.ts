import axios from "axios";
import { io } from "socket.io-client";

export const api = axios.create({
  baseURL: "http://localhost:3001",
  withCredentials: true,
});

export const fleetApi = {
  getInitialState: () => api.get("/fleets"),
  getDrivers: () => api.get("/fleets/drivers"),
  createDriver: (name: string,phone: string) => api.post("/fleets/drivers", {name,phone}),
  getTrips: (page: number, limit: number, status?: string) => api.get("/fleets",{params: {
      page,
      limit,
      status: status || undefined 
    }
  }),
  createTrip: (data: any) => api.post("/fleets/trips", data),
  deleteTrip: (id: string) => api.delete(`/fleets/${id}`),
  deleteDriver: (id: number) => api.delete(`/fleets/drivers/${id}`),
  getRoute: (id:number) => api.get(`fleets/${id}`),
  logout:()=> api.post(
    "http://localhost:3001/user/logout",
    {
      withCredentials: true,
    }
  ),
  updateProfile: (fullName: string, fleet: string) => {
    return api.put(
      "http://localhost:3001/user/update-profile",
      { fullName, fleet },
      { withCredentials: true }
    );
  }
};

export const socket = io("http://localhost:3001", {
  withCredentials: true,
  autoConnect: false,
});