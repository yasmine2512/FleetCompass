import { useState } from "react";

function AddDriverModal({ onAdd, onCancel }: { onAdd: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const valid = name.trim().length > 1;
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 10,
      background: "rgba(2,6,23,0.82)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "rgba(15,23,42,0.99)", border: "1px solid rgba(99,102,241,0.45)",
        borderRadius: 12, padding: 24, width: 320,
        boxShadow: "0 0 32px rgba(99,102,241,0.2)",
      }}>
        <p style={{ color: "#a5b4fc", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Add New Driver</p>
        <label style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Driver Name</label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && valid && onAdd(name.trim())}
          placeholder="e.g. D-KILO"
          style={{
            width: "100%", background: "rgba(30,41,59,0.7)", border: "1px solid rgba(51,65,85,0.6)",
            borderRadius: 8, padding: "9px 11px", color: "#e2e8f0", fontSize: 13,
            outline: "none", fontFamily: "inherit", marginBottom: 16,
          }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => valid && onAdd(name.trim())}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: valid ? "pointer" : "not-allowed",
              background: valid ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(51,65,85,0.4)",
              color: valid ? "#fff" : "#475569", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em",
            }}
          >Add Driver</button>
          <button
            onClick={onCancel}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(51,65,85,0.5)", background: "transparent", color: "#64748b", fontSize: 12, cursor: "pointer" }}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}
export default AddDriverModal