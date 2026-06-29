import type { TripWizardOverlayProps ,TripWizardStep,Status} from "./types";

function TripWizardOverlay({ wizard, drivers, onSetOrderName, onAssignDriver, onConfirm, onCancel }: TripWizardOverlayProps) {
  const availableDrivers = drivers.filter(d => d.available);

  const stepLabel: Record<TripWizardStep, string> = {
    idle: "",
    "pick-destination": "Step 1 — Click the destination on the map",
    assign: "Step 2 — Assign a driver & name the order",
  };
const STATUS_COLORS: Record<Status, string> = {
  "Delivering": "#4ade80",
  "En Route": "#60a5fa",
  "Idle": "#f59e0b",
  "Pick-up": "#f472b6",
};
  return (
    <div style={{
      position: "fixed", bottom: 32, left: "50%", transform: "translateX(calc(-50% + 210px))",
      zIndex: 2500, width: 380,
      background: "rgba(15,23,42,0.97)", border: "1px solid rgba(99,102,241,0.5)",
      borderRadius: 14, overflow: "hidden",
      boxShadow: "0 0 40px rgba(99,102,241,0.25)",
      animation: "fc-slide-up 0.25s ease",
    }}>
      <style>{`@keyframes fc-slide-up { from { opacity:0; transform:translateX(calc(-50% + 210px)) translateY(16px); } to { opacity:1; transform:translateX(calc(-50% + 210px)) translateY(0); } }`}</style>

      {/* header */}
      <div style={{ padding: "12px 16px", background: "rgba(99,102,241,0.1)", borderBottom: "1px solid rgba(99,102,241,0.25)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span style={{ color: "#a5b4fc", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Trip Wizard</span>
        </div>
        <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {/* step indicator */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {(["pick-destination", "assign"] as TripWizardStep[]).map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: wizard.step === s || (wizard.step === "assign" && i === 0) ? "#6366f1" : "rgba(51,65,85,0.5)", transition: "background 0.3s" }} />
          ))}
        </div>

        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14, lineHeight: 1.5 }}>
          {stepLabel[wizard.step]}
        </p>

        {/* origin */}
        <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", marginBottom: 8 }}>
          Origin: <span style={{ color: "#94a3b8" }}>{wizard.originLat.toFixed(5)}, {wizard.originLng.toFixed(5)}</span>
        </div>

        {/* destination (shown once picked) */}
        {wizard.destLat !== null && (
          <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", marginBottom: 12 }}>
            Destination: <span style={{ color: "#fbbf24" }}>{wizard.destLat.toFixed(5)}, {wizard.destLng!.toFixed(5)}</span>
          </div>
        )}

        {/* assign step fields */}
        {wizard.step === "assign" && (
          <>
            {/* order name */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>Order Name</label>
              <input
                value={wizard.orderName}
                onChange={e => onSetOrderName(e.target.value)}
                placeholder="e.g. ORD-CUSTOM-001"
                style={{
                  width: "100%", background: "rgba(30,41,59,0.7)", border: "1px solid rgba(51,65,85,0.6)",
                  borderRadius: 8, padding: "8px 10px", color: "#e2e8f0", fontSize: 12,
                  outline: "none", fontFamily: "monospace",
                }}
              />
            </div>

            {/* driver selector */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>
                Assign Available Driver ({availableDrivers.length} available)
              </label>
              <div style={{ maxHeight: 120, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                {availableDrivers.length === 0 && (
                  <div style={{ color: "#ef4444", fontSize: 11, padding: "8px 0" }}>No available drivers right now.</div>
                )}
                {availableDrivers.map(d => (
                  <button
                    key={d.id}
                    onClick={() => onAssignDriver(d.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, cursor: "pointer",
                      background: wizard.assignedDriverId === d.id ? "rgba(99,102,241,0.2)" : "rgba(30,41,59,0.5)",
                      border: `1px solid ${wizard.assignedDriverId === d.id ? "rgba(99,102,241,0.6)" : "rgba(51,65,85,0.4)"}`,
                      color: "#e2e8f0", fontSize: 12, textAlign: "left", transition: "all 0.15s",
                    }}
                  >
                    <svg width="7" height="7" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill={STATUS_COLORS[d.status]}/></svg>
                    <span style={{ fontWeight: 600 }}>{d.name}</span>
                    <span style={{ color: "#64748b", marginLeft: "auto", fontSize: 10 }}>{d.order}</span>
                    {wizard.assignedDriverId === d.id && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* confirm */}
            <button
              onClick={onConfirm}
              disabled={!wizard.assignedDriverId || !wizard.orderName.trim()}
              style={{
                width: "100%", padding: "9px 0", borderRadius: 8, border: "none", cursor: wizard.assignedDriverId && wizard.orderName.trim() ? "pointer" : "not-allowed",
                background: wizard.assignedDriverId && wizard.orderName.trim() ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(51,65,85,0.4)",
                color: wizard.assignedDriverId && wizard.orderName.trim() ? "#fff" : "#475569",
                fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                transition: "all 0.2s",
              }}
            >
              Confirm & Launch Trip
            </button>
          </>
        )}
      </div>
    </div>
  );
}
export default TripWizardOverlay