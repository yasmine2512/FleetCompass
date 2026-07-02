import { useState, useEffect, useRef } from "react";
import type { FormState ,Errors,Field} from "./types";
import { GridCanvas,LogoMark,EyeIcon,StatBadge,FormInput,
PasswordStrength, SuccessTick} from "./Components";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
type Mode = "login" | "signup";


export default function FleetCompassAuth() {
  const navigate = useNavigate();
  const [mode, setMode]           = useState<Mode>("login");
  const [form, setForm]           = useState<FormState>({ name: "", fleet: "", email: "", password: "", confirm: "" });
  const [errors, setErrors]       = useState<Errors>({});
  const [showPwd, setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [agreed, setAgreed]       = useState(false);

  // reset form when switching modes
  const switchMode = (m: Mode) => {
    setMode(m);
    setErrors({});
    setForm({ name: "", fleet: "", email: "", password: "", confirm: "" });
    setSuccess(false);
    setLoading(false);
    setAgreed(false);
  };

  const handleChange = (field: Field, value: string) => {
    setForm(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Errors = {};
    if (mode === "signup") {
      if (!form.name.trim())          e.name    = "Full name is required.";
      if (!form.fleet.trim())         e.fleet   = "Fleet name is required.";
    }
    if (!form.email.trim())           e.email   = "Email address is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.password)               e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (mode === "signup") {
      if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
      if (!agreed) e.form = "You must accept the terms to continue.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async() => {
    if (!validate()) return;
    setLoading(true);
     try {
    if (mode === "login") {
     await handleLogin();
    } else {
     await handleSignup();
    }
  } catch (error) {
    setErrors({form: "Something went wrong",});
    console.log(error);
  } finally {
    setLoading(false);
  }
    // setTimeout(() => { setLoading(false); setSuccess(true); }, 1800);
  };

const handleLogin = async () => {
   setErrors({});
  try {
    const response = await axios.post(
      "http://localhost:3001/user/login",
      {
        email: form.email,
        password: form.password,
      },
      {
        withCredentials: true, // important for HttpOnly cookies
      }
    );
    setSuccess(true);
    console.log(response.data);
    navigate("/App");
    
  } catch (error : any) {
    console.error("Login failed:", error);
    if (error.response && error.response.data) {
      setErrors({form: error.response.data.message || "Invalid credentials."});
    } else {
      setErrors({form:"Server error or network issue. Please try again later."});
    }
  }
};

const handleSignup = async () => {
  setErrors({});
  
  try {
    const response = await axios.post(
      "http://localhost:3001/user/signup",
      {
        fullName: form.name,
        fleet: form.fleet,
        email: form.email,
        password: form.password,
      },
      {
        withCredentials: true,
      }
    );
    console.log(response.data);
    setSuccess(true);
    navigate("/App");
    
  } catch (error: any) {
    console.error("Signup failed:", error);
    if (error.response && error.response.data) {
      setErrors({
        form: error.response.data.message || "Failed to create account."
      });
    } else {
      setErrors({
        form: "Server error or network issue. Please try again later."
      });
    }
  }
};

  return (
    <>
    <div className="min-h-screen w-full flex bg-slate-950 relative">

      {/* ── LEFT PANEL — brand story ──────────────────────────── */}
      <div className="hidden lg:flex flex-col relative w-[520px] flex-shrink-0 h-screen sticky top-0"
        style={{ borderRight: "1px solid rgba(51,65,85,0.4)" }}>

        <GridCanvas />

        {/* dark overlay to keep text readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/20 to-slate-950/80 pointer-events-none" />

        {/* content */}
        <div className="relative z-10 flex flex-col h-full p-10">
          {/* logo */}
          <div className="flex items-center gap-3 mb-auto">
            <LogoMark size={36} />
            <div>
              <div className="text-slate-100 font-extrabold tracking-widest uppercase text-sm">Fleet Compass</div>
              <div className="text-slate-500 text-xs tracking-widest uppercase">Control Room v2.4</div>
            </div>
          </div>

          {/* hero text */}
          <div className="flex flex-col gap-5 my-auto">
            <div className="flex items-center gap-2.5 w-fit"
              style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 20, padding: "5px 12px" }}>
              <div className="fc-pulse-dot" />
              <span className="text-green-400 text-xs font-semibold tracking-widest uppercase">Live Telemetry Active</span>
            </div>

            <h1 className="text-4xl font-black text-slate-50 leading-tight tracking-tight">
              Your entire fleet,<br />
              <span style={{ color: "#818cf8" }}>one command centre.</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Real-time GPS tracking, driver telemetry, dispatch management and route intelligence — all in a single, always-on control room.
            </p>

            {/* stats row */}
            <div className="flex gap-8 mt-2 pt-6" style={{ borderTop: "1px solid rgba(51,65,85,0.4)" }}>
              <StatBadge label="Avg latency"  value="11ms"  color="#60a5fa" />
              <StatBadge label="Uptime"       value="99.9%" color="#4ade80" />
              <StatBadge label="Drivers sup." value="10k+"  color="#a5b4fc" />
            </div>
          </div>

          {/* bottom marquee testimonial */}
          <div className="mt-auto pt-8" style={{ borderTop: "1px solid rgba(51,65,85,0.3)" }}>
            <p className="text-slate-400 text-sm italic leading-relaxed">
              "Fleet Compass cut our average delivery latency by 34%. The control room view is genuinely the first thing every dispatcher opens in the morning."
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-indigo-300"
                style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }}>
                SR
              </div>
              <div>
                <div className="text-slate-300 text-xs font-semibold">Sara Reyes</div>
                <div className="text-slate-600 text-xs">Head of Logistics · NovaCargo</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ──────────────────────────────────── */}
      <div className="flex-1 flex justify-center p-6 relative h-screen overflow-y-auto w-full pb-20">
        {/* subtle radial glow behind the card */}
        <div className="absolute inset-0 pointer-events-none
        min-h-screen flex"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />

        <div className="fc-fade-up w-full max-w-sm relative z-10 py-8 ">

      {/* mobile logo */}
      <div className="flex lg:hidden items-center gap-3 justify-center mb-8">
        <LogoMark size={32} />
        <span className="text-slate-100 font-extrabold tracking-widest uppercase text-sm">Fleet Compass</span>
      </div>

      {/* card */}
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(15,23,42,0.85)",
          border: "1px solid rgba(51,65,85,0.5)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}>

        {/* tab switcher */}
        <div className="grid grid-cols-2" style={{ borderBottom: "1px solid rgba(51,65,85,0.4)" }}>
          {(["login", "signup"] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                mode === m
                  ? "text-indigo-300 bg-indigo-500/10"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
              }`}
              style={mode === m ? { borderBottom: "2px solid #818cf8" } : {}}
            >
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {/* form body */}
        <div className="p-7">
          {success ? (
            <SuccessTick />
          ) : (
            <div className="flex flex-col gap-4">

            {/* heading */}
            <div className="mb-1">
              <h2 className="text-slate-100 font-bold text-base">
                {mode === "login" ? "Welcome back" : "Set up your fleet"}
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                {mode === "login"
                  ? "Enter your credentials to access the control room."
                  : "Create your account and start tracking in minutes."}
              </p>
            </div>

            {/* signup-only fields */}
            {mode === "signup" && (
              <>
                <FormInput
                  id="name" label="Full name" value={form.name} error={errors.name}
                  placeholder="Sara Reyes" autoComplete="name"
                  onChange={handleChange}
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                />
                <FormInput
                  id="fleet" label="Fleet / Company name" value={form.fleet} error={errors.fleet}
                  placeholder="NovaCargo Logistics" autoComplete="organization"
                  onChange={handleChange}
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>}
                />
              </>
            )}

            {/* email */}
            <FormInput
              id="email" label="Email address" type="email" value={form.email} error={errors.email}
              placeholder="sara@novacargo.com" autoComplete="email"
              onChange={handleChange}
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
            />

            {/* password */}
            <div>
              <FormInput
                id="password" label="Password"
                type={showPwd ? "text" : "password"}
                value={form.password} error={errors.password}
                placeholder="Min. 6 characters" autoComplete={mode === "login" ? "current-password" : "new-password"}
                onChange={handleChange}
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>}
                rightSlot={
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="text-slate-500 hover:text-slate-300 transition-colors">
                    <EyeIcon open={showPwd} />
                  </button>
                }
              />
              {mode === "signup" && <PasswordStrength password={form.password} />}
            </div>

            {/* confirm password (signup only) */}
            {mode === "signup" && (
              <FormInput
                id="confirm" label="Confirm password"
                type={showConfirm ? "text" : "password"}
                value={form.confirm} error={errors.confirm}
                placeholder="Re-enter password" autoComplete="new-password"
                onChange={handleChange}
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                rightSlot={
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="text-slate-500 hover:text-slate-300 transition-colors">
                    <EyeIcon open={showConfirm} />
                  </button>
                }
              />
            )}

            {/* forgot password (login only) */}
            {mode === "login" && (
              <div className="flex justify-end -mt-1">
                <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            {/* terms checkbox (signup only) */}
            {mode === "signup" && (
              <label className="flex items-start gap-2.5 cursor-pointer select-none group mt-0.5">
                <div
                  onClick={() => setAgreed(v => !v)}
                  className="mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all duration-150"
                  style={{
                    background: agreed ? "#6366f1" : "rgba(30,41,59,0.8)",
                    border: agreed ? "1px solid #6366f1" : "1px solid rgba(71,85,105,0.7)",
                  }}
                >
                  {agreed && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <span className="text-xs text-slate-400 leading-relaxed">
                  I agree to the{" "}
                  <span className="text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors">Terms of Service</span>
                  {" "}and{" "}
                  <span className="text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors">Privacy Policy</span>
                </span>
              </label>
            )}

            {/* form-level error */}
            {errors.form && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 -mt-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {errors.form}
              </p>
            )}

            {/* submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="relative mt-1 w-full py-2.5 rounded-lg text-sm font-bold text-white uppercase tracking-widest transition-all duration-200 overflow-hidden disabled:opacity-70"
              style={{ background: loading ? "rgba(99,102,241,0.6)" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", boxShadow: loading ? "none" : "0 0 20px rgba(99,102,241,0.3)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                  Authenticating…
                </span>
              ) : (
                mode === "login" ? "Enter control room" : "Launch fleet"
              )}
            </button>

            {/* divider */}
            <div className="flex items-center gap-3 my-0.5">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-slate-600 text-xs">or</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* SSO button */}
            <button className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg text-sm font-semibold text-slate-300 transition-all duration-150 hover:text-slate-100"
              style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(51,65,85,0.5)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              Continue with SSO
            </button>
          </div>
            )}
          </div>
        </div>

          {/* footer link */}
          {!success && (
            <p className="text-center text-xs text-slate-600 mt-5 pb-8">
              {mode === "login" ? "No account yet? " : "Already have an account? "}
              <button
                onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                className="text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
              >
                {mode === "login" ? "Create one" : "Sign in"}
              </button>
            </p>
          )}

          </div>
        </div>
      </div>
    </>
  );
}