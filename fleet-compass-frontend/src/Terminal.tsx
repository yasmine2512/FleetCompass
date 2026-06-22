import { useEffect,useRef } from "react";
import type { LogType,LogEntry } from "./types";
function Terminal({ logs }: { logs: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  const colorMap: Record<LogType, string> = {
    normal: "#4ade80",
    info:   "#60a5fa",
    warn:   "#f59e0b",
    dim:    "#64748b",
    dispatch: "#f0abfc",
  };

  return (
    <div id="fc-terminal" className="flex-1 overflow-y-auto font-mono text-[11px] leading-7 text-green-400
      p-3 bg-slate-950/70 border border-slate-700/40 rounded-[10px] scroll-smooth ">
      {logs.map(l => {
        const tsSpan = <span className="text-slate-500">[{l.ts}] </span>;
        if (l.type === "dispatch") {
          return (
            <div key={l.id}className="
              border-l-2 border-purple-500
              pl-1.5
              bg-purple-500/10
              block
            ">
              {tsSpan}<span className="text-pink-300">{l.msg}</span>
            </div>
          );
        }
        return (
          <div key={l.id}>
            {tsSpan}<span style={{ color: colorMap[l.type] }}>{l.msg}</span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
export default Terminal