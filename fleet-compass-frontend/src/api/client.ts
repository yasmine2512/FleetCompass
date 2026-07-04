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
  getTrips: (page: number, limit: number, status?: string, search?: string) => api.get("/fleets",{params: {page,limit,status: status || undefined ,search
    }
  }),
  createTrip: (data: any) => api.post("/fleets/trips", data),
  deleteTrip: (id: string) => api.delete(`/fleets/${id}`),
  deleteDriver: (id: number) => api.delete(`/fleets/drivers/${id}`),
  getRoute: (id:number) => api.get(`fleets/${id}`),
  logout:()=> api.post("/user/logout",
    {withCredentials: true}
  ),
  updateProfile: (fullName: string, fleet: string) => {
    return api.put(
      "/user/update-profile",
      { fullName, fleet },
      { withCredentials: true }
    );
  },
  deleteAccount:()=> api.delete('/user', {
    withCredentials: true, 
    headers: {
      'Content-Type': 'application/json',
    },
  })
};

export const socket = io("http://localhost:3001", {
  withCredentials: true,
  autoConnect: false,
});