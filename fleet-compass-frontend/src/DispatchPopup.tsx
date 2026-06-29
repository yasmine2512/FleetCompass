import { useEffect } from "react";
import type { DispatchPopupProps } from "./types";

function DispatchPopup({lat,lng,onClose,onStartTrip}: DispatchPopupProps) {
  // Auto close after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 15000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed",
      top: 64,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 2500,
      width: 260,
      background: "rgba(15,23,42,0.97)",
      border: "1px solid rgba(99,102,241,0.5)",
      borderRadius: 10,
      padding: "12px 14px",
      boxShadow: "0 0 24px rgba(99,102,241,0.25)",
    }}>

      <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}>
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#a5b4fc"
            strokeWidth="2.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>

          <span style={{
              color: "#c4b5fd",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>
            New Dispatch Request
          </span>
        </div>

        <button onClick={onClose} style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#475569",
          }}>
          ✕
        </button>
      </div>
      <div style={{
          fontSize: 11,
          color: "#64748b",
          marginBottom: 12,
          fontFamily: "monospace",
          lineHeight: 1.7,
        }}>
        <div>
          Latitude:{" "}
          <span style={{ color: "#94a3b8" }}>
            {lat.toFixed(5)}
          </span>
        </div>

        <div>
          Longitude:{" "}
          <span style={{ color: "#94a3b8" }}>
            {lng.toFixed(5)}
          </span>
        </div>

<div
  style={{
    display: "flex",
    gap: 6,
    justifyContent: "flex-end",
  }}>
  <button onClick={onStartTrip} style={{
      padding: "5px 10px",
      borderRadius: 10,
      border: "none",
      cursor: "pointer",
      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
      color: "#fff",
      fontSize: 10,
      fontWeight: 500,
      textTransform: "uppercase",
      boxShadow: "0 0 12px rgba(99,102,241,0.25)",
    }}>
    Start Trip
  </button>
</div>
  </div>
    </div>
  );
}

export default DispatchPopup;