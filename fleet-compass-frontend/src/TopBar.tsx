interface TopBarProps {
  onSearch: () => void;
  onLogout: () => void;
}

function TopBar({ onSearch, onLogout }: TopBarProps) {
  return (
    <div className="fixed top-3.5 right-4 z-[2000] flex gap-2">
      {/* Search */}
      <button
        onClick={onSearch}
        title="Search drivers & orders"
        className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-400 shadow-lg shadow-black/30 backdrop-blur-xl transition-all hover:border-indigo-500/60 hover:text-indigo-200"
      >
        <svg
          className="h-[13px] w-[13px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        Search
      </button>

      {/* Logout */}
      <button
        onClick={onLogout}
        title="Log out"
        className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-400 shadow-lg shadow-black/30 backdrop-blur-xl transition-all hover:border-red-500/50 hover:text-red-300"
      >
        <svg
          className="h-[13px] w-[13px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>

        Logout
      </button>
    </div>
  );
}

export default TopBar;