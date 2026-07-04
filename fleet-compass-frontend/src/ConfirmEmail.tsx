import { useNavigate } from "react-router-dom";

interface ConfirmEmailProps {
  email?: string;
}

function ConfirmEmail({
  email = "your inbox",
}: ConfirmEmailProps) {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-5">

      {/* Background Glow */}
      <div className="absolute h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[90px]" />

      {/* Card */}
      <div className="relative z-10 flex w-full max-w-[440px] flex-col items-center rounded-2xl border border-slate-700/50 bg-slate-900/85 p-8 text-center shadow-2xl backdrop-blur-xl">

        {/* Mail Icon */}
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
          <svg
            className="h-6 w-6 text-indigo-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22 6 12 13 2 6" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="mb-3 text-lg font-extrabold uppercase tracking-widest text-indigo-200">
          Verification Sent
        </h2>

        <p className="mb-7 text-sm leading-6 text-slate-400">
          A secure confirmation link has been transmitted to{" "}
          <span className="font-semibold text-indigo-300">
            {email}
          </span>
          . Please verify your connection to initialize the fleet
          operations platform.
        </p>

        {/* Status */}
        <div className="mb-8 flex w-full items-center gap-3 rounded-lg border border-slate-700/40 bg-slate-950/40 px-4 py-3 text-left">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="font-mono text-xs text-slate-500">
            Awaiting network handshake hook...
          </span>
        </div>

        {/* Button */}
        <button
          onClick={() => navigate("/App")}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-[0.98]"
        >
          Proceed to Dashboard
        </button>
      </div>
    </div>
  );
}

export default ConfirmEmail;