import { useEffect } from "react";
import type { DispatchPopupProps } from "./types";

function DispatchPopup({
  lat,
  lng,
  onClose,
  onStartTrip,
}: DispatchPopupProps) {
  // Auto close after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed left-1/2 top-16 z-[2500] w-[260px] -translate-x-1/2 rounded-xl border border-indigo-500/50 bg-slate-900/95 p-3 shadow-[0_0_24px_rgba(99,102,241,0.25)]">

      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-indigo-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>

          <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
            New Dispatch Request
          </span>
        </div>

        <button
          onClick={onClose}
          className="text-slate-600 transition-colors hover:text-red-400"
        >
          ✕
        </button>
      </div>

      {/* Coordinates */}
      <div className="space-y-0.5 font-mono text-[11px] leading-5 text-slate-500">
        <div>
          Latitude:{" "}
          <span className="text-slate-400">
            {lat.toFixed(5)}
          </span>
        </div>

        <div>
          Longitude:{" "}
          <span className="text-slate-400">
            {lng.toFixed(5)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-2 flex justify-end">
        <button
          onClick={onStartTrip}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.03] hover:shadow-indigo-500/40 active:scale-[0.98]"
        >
          Start Trip
        </button>
      </div>
    </div>
  );
}

export default DispatchPopup;