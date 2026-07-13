import axios from "axios";
import { io } from "socket.io-client";

const baseURL =import.meta.env.VITE_API_URL;
export const api = axios.create({
  baseURL:  `${baseURL}/api`,
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
  cancelTrip:(tripId:number) => api.post(`/fleets/${tripId}/cancel`),
  deleteTrip: (id: number) => api.delete(`/fleets/${id}`),
  deleteDriver: (id: number) => api.delete(`/fleets/drivers/${id}`),
  getRoute: (id:number) => api.get(`fleets/${id}`),
  getUser: ()=> api.get('/user/me'),
  logout:()=> api.post("/user/logout"),
  updateProfile: (fullName: string, fleet: string) => {
    return api.put(
      "/user/update-profile",
      { fullName, fleet },
    );
  },
  deleteAccount:()=> api.delete('/user', {
    headers: {
      'Content-Type': 'application/json',
    },
  }),
  handleOAuth:()=> window.location.href = `${baseURL}/api/user/oauth`,
  resetPassword:(email:string)=>api.post('/user/reset-password',{ email }),
  setSession:(accessToken?:string,refreshToken?:string)=> 
    api.post('/user/set-session', {
          access_token: accessToken,
          refresh_token: refreshToken
        }),
  login:(email:string,password:string)=> api.post("/user/login",
      {email:email,password: password,}),

  signup:(name:string,fleet:string,email:string,password:string)=>
     api.post("/user/signup",{fullName:name,fleet:fleet,
        email:email,password:password}),
};

export const socket = io(baseURL, {
  withCredentials: true,
  autoConnect: false,
});