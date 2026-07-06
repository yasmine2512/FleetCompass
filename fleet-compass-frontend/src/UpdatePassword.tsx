import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";

function UpdatePassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [state, setState] = useState<
  "loading" | "allowed" | "invalid"
>("loading");
  const [success, setSuccess] = useState(false);

useEffect(() => {
  const { data: listener } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setState("allowed");
      }
    }
  );
  const timeout = setTimeout(() => {
    setState((prev) => (prev === "allowed" ? prev : "invalid"));
  }, 2000);

  return () => {
    clearTimeout(timeout);
    listener.subscription.unsubscribe();
  };
}, []);

  const handlePasswordUpdate = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus({
        text: "Passwords do not match.",
        isError: true,
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
    password,
  });
  if (error) {
    setStatus({
      text: error.message,
      isError: true,
    });
  } else {
    setSuccess(true);
    setStatus({
      text: "Password updated successfully.",
      isError: false,
    });

    setTimeout(() => navigate("/"), 2000);
  }

  setLoading(false);
};
  
if (state === "loading") {
  return <div>Verifying secure link...</div>;
}

if (state === "invalid") {
  return <Navigate to="/not-found" replace />;
}

  return ( 
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-5">

      {/* Background Glow */}
      <div className="absolute h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[90px]" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px] rounded-2xl border border-slate-700/50 bg-slate-900/85 p-8 shadow-2xl backdrop-blur-xl">

        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-200">
            Secure Override Verified
          </span>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-slate-50">
          Establish New Password
        </h1>

        <p className="mb-6 text-sm leading-6 text-slate-500">
          Your security signature matches. Input your replacement core
          credentials below.
        </p>


          <div className="mb-5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-300">
            Recovery session verified. You can now choose a new password.
          </div>
        

        {/* Status */}
        {status && (
          <div
            className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
              status.isError
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {status.text}
          </div>
        )}

        <form
          onSubmit={handlePasswordUpdate}
          className="flex flex-col gap-5"
        >
          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              New Password
            </label>

            <div className="rounded-lg border border-slate-700 bg-slate-950/40 px-4 py-3">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Confirm New Password
            </label>

            <div className="rounded-lg border border-slate-700 bg-slate-950/40 px-4 py-3">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className={`mt-2 rounded-lg px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
              loading
                ? "cursor-not-allowed bg-slate-700/40 text-slate-500"
                : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] hover:shadow-emerald-500/40 active:scale-[0.98]"
            }`}
          >
            {loading
              ? "Updating Credentials..."
              : "Commit New Password"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default UpdatePassword;