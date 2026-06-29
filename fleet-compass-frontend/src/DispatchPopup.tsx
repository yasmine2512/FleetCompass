import type { DispatchPopupProps } from "./types";
function DispatchPopup({ lat, lng, onClose, onStartTrip }: DispatchPopupProps) {
  return (
    <div style={{
      position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)",
      zIndex: 2500, minWidth: 260,
      background: "rgba(15,23,42,0.97)", border: "1px solid rgba(99,102,241,0.5)",
      borderRadius: 12, padding: "14px 16px",
      boxShadow: "0 0 30px rgba(99,102,241,0.25)",
      animation: "fc-pop-in 0.2s ease",
    }}>
      <style>{`@keyframes fc-pop-in { from { opacity:0; transform:translateX(-50%) translateY(-8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <span style={{ color: "#c4b5fd", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>New Dispatch Request</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 2 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12, fontFamily: "monospace", lineHeight: 1.6 }}>
        Origin: <span style={{ color: "#94a3b8" }}>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
      </div>
      <button
        onClick={onStartTrip}
        style={{
          width: "100%", padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          boxShadow: "0 0 16px rgba(99,102,241,0.3)",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Start Trip
      </button>
    </div>
  );
}
export default DispatchPopup 