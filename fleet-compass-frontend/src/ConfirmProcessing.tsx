// ConfirmProcessing.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fleetApi } from './api/client';

export const ConfirmProcessing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.substring(1); 
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    const finalizeAuth = async () => {
      try {
        await fleetApi.setSession(accessToken!,refreshToken!);
        
        navigate('/App'); 
      } catch (err) {
        console.error("Session lock failed:", err);
        navigate('/');
      }
    };

    if (accessToken && refreshToken) {
      finalizeAuth();
    } else {
      navigate("/")
      console.warn("No tokens detected in URL");
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400 font-mono text-sm">
      <div className="flex items-center space-x-3 bg-slate-900/50 p-6 rounded border border-slate-800 backdrop-blur-md">
        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
        <p>Establishing secure telemetry and locking session...</p>
      </div>
    </div>
  );
};