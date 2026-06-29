interface TopBarProps {
  onSearch: () => void;
  onLogout: () => void;
}
function TopBar({ onSearch, onLogout }: TopBarProps) {
  return (
    <div style={{
      position: "fixed", top: 14, right: 18, zIndex: 2000,
      display: "flex", gap: 8,
    }}>
      {/* Search */}
      <button
        onClick={onSearch}
        title="Search drivers & orders"
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "7px 14px",
          background: "rgba(15,23,42,0.88)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(51,65,85,0.6)", borderRadius: 9,
          color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.6)"; (e.currentTarget as HTMLElement).style.color = "#c7d2fe"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(51,65,85,0.6)"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Search
      </button>

      {/* Logout */}
      <button
        onClick={onLogout}
        title="Log out"
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "7px 14px",
          background: "rgba(15,23,42,0.88)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(51,65,85,0.6)", borderRadius: 9,
          color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.5)"; (e.currentTarget as HTMLElement).style.color = "#fca5a5"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(51,65,85,0.6)"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Logout
      </button>
    </div>
  );
}
export default TopBar