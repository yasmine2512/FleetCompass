import type { SettingsProps } from "./types";

function Settings({ onClose,setSettingsForm,settingsForm,handleSaveSettings,handleDeleteAccount}:SettingsProps){

return(
  <div style={{
    position: "fixed", inset: 0, zIndex: 3000,
    background: "rgba(2,6,23,0.78)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "flex-start", justifyContent: "center",
    paddingTop: 52,
  }}
  onClick={() => onClose()}>
    
    <div style={{
      width: 540, maxHeight: "82vh", display: "flex", flexDirection: "column",
      background: "rgba(15,23,42,0.98)", border: "1px solid rgba(51,65,85,0.6)",
      borderRadius: 14, overflow: "hidden",
      boxShadow: "0 0 60px rgba(99,102,241,0.2)",
      position: "relative",
    }}
    onClick={e => e.stopPropagation()}>
      
      {/* Modal Header */}
      <div style={{
        padding: "14px 18px", borderBottom: "1px solid rgba(51,65,85,0.4)",
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span style={{ color: "#c7d2fe", fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Control Room Settings
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={() => onClose()} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={e => (e.currentTarget.style.color = "#475569")}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Modal Content Scroll Area */}
      <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
        
        {/* Profile Inputs Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Full Name Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Full Name</label>
            <input 
              type="text"
              value={settingsForm.fullName}
              onChange={e => setSettingsForm({ ...settingsForm, fullName: e.target.value })}
              style={{
                background: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(51, 65, 85, 0.5)",
                borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 12, outline: "none",
                fontFamily: "inherit"
              }}
            />
          </div>

          {/* Fleet Name Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fleet Unit Designation</label>
            <input 
              type="text"
              value={settingsForm.fleet}
              onChange={e => setSettingsForm({ ...settingsForm, fleet: e.target.value })}
              style={{
                background: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(51, 65, 85, 0.5)",
                borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 12, outline: "none",
                fontFamily: "inherit"
              }}
            />
          </div>

          {/* Email View Input (Immutable view matching context) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "between", alignItems: "center" }}>
              <label style={{ color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</label>
            </div>
            <input 
              type="email"
              disabled
              value={settingsForm.email}
              style={{
                background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(51, 65, 85, 0.25)",
                borderRadius: 8, padding: "10px 12px", color: "#475569", fontSize: 12, cursor: "not-allowed",
                fontFamily: "inherit"
              }}
            />
          </div>

        </div>

        {/* Separator Rule */}
        <hr style={{ border: "none", borderTop: "1px solid rgba(51,65,85,0.3)", margin: "24px 0" }} />

        {/* Danger Zone Section */}
        <div style={{
          border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: 10,
          background: "rgba(239, 68, 68, 0.03)", padding: 16
        }}>
          <h4 style={{ color: "#f87171", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Danger Zone
          </h4>
          <p style={{ color: "#64748b", fontSize: 11, margin: "0 0 14px 0", lineHeight: "1.5" }}>
            Permanently delete your user account and purge telemetry nodes. This operation cannot be reversed.
          </p>
          <button
            onClick={handleDeleteAccount}
            style={{
              padding: "8px 14px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: 6, color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
          >
            Delete Account
          </button>
        </div>

      </div>

      {/* Modal Bottom Toolbar Action Segment */}
      <div style={{
        padding: "12px 18px", borderTop: "1px solid rgba(51,65,85,0.4)",
        background: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "flex-end", gap: 10
      }}>
        <button
          onClick={() => onClose()}
          style={{
            padding: "8px 14px", background: "transparent", border: "none",
            borderRadius: 6, color: "#64748b", fontSize: 11, fontWeight: 700, cursor: "pointer"
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#94a3b8"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; }}
        >
          Cancel
        </button>
        <button
          onClick={handleSaveSettings}
          style={{
            padding: "8px 16px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none",
            borderRadius: 6, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.04em"
          }}
        >
          Save Configuration
        </button>
      </div>

    </div>
  </div>
)
  }  export default Settings;