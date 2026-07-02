import { useEffect,useRef } from "react";
import type { InputProps } from "./types";

export function GridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let w = 0, h = 0;

    const resize = () => {
      w = canvas.width  = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Moving dots that simulate GPS pings
    const DOTS = Array.from({ length: 28 }, () => ({
      x: Math.random() * 1400,
      y: Math.random() * 900,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = "rgba(51,65,85,0.25)";
      ctx.lineWidth = 0.5;
      const step = 52;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Connection lines between nearby dots
      for (let i = 0; i < DOTS.length; i++) {
        for (let j = i + 1; j < DOTS.length; j++) {
          const dx = DOTS[i].x - DOTS[j].x, dy = DOTS[i].y - DOTS[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            ctx.strokeStyle = `rgba(99,102,241,${0.12 * (1 - dist / 180)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(DOTS[i].x, DOTS[i].y);
            ctx.lineTo(DOTS[j].x, DOTS[j].y);
            ctx.stroke();
          }
        }
      }

      // Dots with pulse
      DOTS.forEach(d => {
        d.pulse += 0.04;
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x = w; if (d.x > w) d.x = 0;
        if (d.y < 0) d.y = h; if (d.y > h) d.y = 0;

        const pulseA = (Math.sin(d.pulse) * 0.3 + 0.7) * d.alpha;

        // outer ring
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${pulseA * 0.15})`;
        ctx.fill();

        // core dot
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(129,140,248,${pulseA})`;
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
    />
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.45)" strokeWidth="1"/>
      <path d="M14 5 L20 10 L20 18 L14 23 L8 18 L8 10 Z" stroke="#818cf8" strokeWidth="1.5" fill="none"/>
      <circle cx="14" cy="14" r="3" fill="#6366f1"/>
      <path d="M14 11 L14 8 M14 17 L14 20 M11 14 L8 14 M17 14 L20 14" stroke="#6366f1" strokeWidth="1.2"/>
    </svg>
  );
}

export function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-slate-500 text-xs uppercase tracking-widest font-semibold">{label}</span>
      <span className="font-bold text-lg leading-none" style={{ color }}>{value}</span>
    </div>
  );
}


export function FormInput({ id, label, type = "text", value, placeholder, error, icon, onChange, rightSlot, autoComplete }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={e => onChange(id, e.target.value)}
          className={`w-full bg-slate-800/60 border rounded-lg pl-9 pr-${rightSlot ? "10" : "3"} py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all duration-150
            focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
            ${error ? "border-red-500/70 focus:ring-red-500 focus:border-red-500" : "border-slate-700/70 hover:border-slate-600"}`}
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordStrength({ password }: { password: string }) {
  const score = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ef4444", "#f59e0b", "#60a5fa", "#4ade80"];

  if (!password) return null;
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-1 flex-1">
        {[1,2,3,4].map(i => (
          <div
            key={i}
            className="h-0.5 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? colors[score] : "#334155" }}
          />
        ))}
      </div>
      <span className="text-xs font-semibold" style={{ color: colors[score] }}>{labels[score]}</span>
    </div>
  );
}

/* ── tick animation on success ──────────────────────────────────── */
export function SuccessTick() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      <div className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: "drawCheck 0.5s ease forwards" }}>
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-slate-100 font-semibold">Access granted</p>
        <p className="text-slate-500 text-sm mt-1">Redirecting to control room…</p>
      </div>
    </div>
  );
}