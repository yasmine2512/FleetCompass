import type { SettingsProps } from "./types";

function Settings({
  onClose,
  setSettingsForm,
  settingsForm,
  handleSaveSettings,
  handleDeleteAccount,
}: SettingsProps) {
  return (
    <div
      className="fixed inset-0 z-[3000] flex items-start justify-center bg-slate-950/80 pt-14 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[82vh] w-[540px] flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-[0_0_60px_rgba(99,102,241,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-slate-700/50 px-5 py-4">
          <svg
            className="h-4 w-4 text-indigo-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>

          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-200">
            Control Room Settings
          </span>

          <div className="flex-1" />

          <button
            onClick={onClose}
            className="text-slate-600 transition-colors hover:text-red-500"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Full Name
              </label>

              <input
                type="text"
                value={settingsForm.fullName}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    fullName: e.target.value,
                  })
                }
                className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-indigo-500"
              />
            </div>

            {/* Fleet */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Fleet Unit Designation
              </label>

              <input
                type="text"
                value={settingsForm.fleet}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    fleet: e.target.value,
                  })
                }
                className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-indigo-500"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </label>

              <input
                type="email"
                disabled
                value={settingsForm.email}
                className="cursor-not-allowed rounded-lg border border-slate-700/40 bg-slate-900 px-3 py-2 text-sm text-slate-500"
              />
            </div>
          </div>

          <hr className="border-slate-700/40" />

          {/* Danger Zone */}
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-red-400">
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Danger Zone
            </h4>

            <p className="mb-4 text-xs leading-5 text-slate-500">
              Permanently delete your user account and purge telemetry
              nodes. This operation cannot be reversed.
            </p>

            <button
              onClick={handleDeleteAccount}
              className="rounded-md border border-red-500/40 bg-red-500/15 px-4 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/25"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-700/50 bg-slate-900/60 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-xs font-bold text-slate-500 transition hover:text-slate-300"
          >
            Cancel
          </button>

          <button
            onClick={handleSaveSettings}
            className="rounded-md bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-[0.98]"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;