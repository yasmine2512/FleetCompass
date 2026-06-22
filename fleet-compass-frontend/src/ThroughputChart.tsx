import { useEffect,useRef } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
);
interface ChartProps { data: number[]; }

function ThroughputChart({ data }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<any>(null);
//   const Chart     = (window as any).Chart;

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    chartRef.current?.destroy();

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: Array.from({ length: 30 }, (_, i) => `${30 - i}s`),
        datasets: [{
          data: [...data],
          borderColor: "#818cf8",
          borderWidth: 1.5,
          pointRadius: 0,
          fill: true,
          backgroundColor: (c: any) => {
            const g = c.chart.ctx.createLinearGradient(0, 0, 0, 110);
            g.addColorStop(0, "rgba(99,102,241,0.3)");
            g.addColorStop(1, "rgba(99,102,241,0)");
            return g;
          },
          tension: 0.45,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400, easing: "easeInOutQuart" },
        interaction: { intersect: false },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: {
            ticks: { display: false },
            grid: { color: "rgba(51,65,85,0.3)" },
            border: { display: false },
          },
          y: {
            min: 40, max: 180,
            ticks: { color: "#475569", font: { size: 9, family: "monospace" }, maxTicksLimit: 4 },
            grid: { color: "rgba(51,65,85,0.25)" },
            border: { display: false },
          },
        },
      },
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.data.datasets[0].data = [...data];
    chartRef.current.update("none");
  }, [data]);

  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-[10px] p-3">
      <div className="text-[10px] tracking-[0.1em] uppercase text-slate-500 font-semibold mb-2">
        System Throughput (pings/sec) — 30s window
      </div>
      <div className="h-[110px] relative">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
export default ThroughputChart