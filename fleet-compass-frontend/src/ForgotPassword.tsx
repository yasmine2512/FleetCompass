import { useState } from "react";
import { Link } from "react-router-dom";
import { fleetApi } from "./api/client";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  const handleResetRequest = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!email) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fleetApi.resetPassword(email);
      if(res.data){
      setMessage({
        text: "Reset token link broadcasted successfully. Check your telemetry inbox.",
        isError: false,
      });}else{
         setMessage({
        text: "Email doesn't exist , Please enter a valid email",
        isError: true,
      });
      }
    } catch (err: any) {
      setMessage({
        text: err.message || "Failed to dispatch system reset vector.",
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-5">

      {/* Background Glow */}
      <div className="absolute h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[90px]" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px] rounded-2xl border border-slate-700/50 bg-slate-900/85 p-8 backdrop-blur-xl shadow-2xl">

        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_10px_#8b5cf6]" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-200">
            Access Recovery
          </span>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-slate-50">
          Reset Terminal Password
        </h1>

        <p className="mb-6 text-sm leading-6 text-slate-500">
          Enter your operations email profile target to receive a credential
          override link.
        </p>

        {/* Status */}
        {message && (
          <div
            className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
              message.isError
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {message.text}
          </div>
        )}

        <form
          onSubmit={handleResetRequest}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Registered Email Address
            </label>

            <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950/40 px-4 py-3">

              <svg
                className="h-4 w-4 text-slate-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              </svg>

              <input
                type="email"
                required
                placeholder="developer@fleetcompass.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`mt-2 rounded-lg px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
              loading
                ? "cursor-not-allowed bg-slate-700/40 text-slate-500"
                : "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02] hover:shadow-indigo-500/40"
            }`}
          >
            {loading
              ? "Transmitting Reset Link..."
              : "Send Reset Override"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 border-t border-slate-700/30 pt-4 text-center">
          <Link
            to="/"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-indigo-300"
          >
            ← Return to Control Terminal Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;