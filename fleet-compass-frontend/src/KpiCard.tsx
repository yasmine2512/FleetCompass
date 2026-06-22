function KpiCard({ label, value, sub, valueColor = "#f1f5f9" }: { label: string; value: string | number; sub: string; valueColor?: string }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-[10px] px-3 py-3 flex-1">
      <div className="text-[10px] tracking-[0.08em] uppercase text-slate-500 font-semibold mb-[6px]">{label}</div>
      <div className="text-[22px] font-bold leading-none tracking-[-0.5px]" style={{ color: valueColor }}>{value}</div>
      <div className="text-[11px] text-slate-500 mt-[3px]">{sub}</div>
    </div>
  );
}
export default KpiCard