const map = L.map('map', {
  center: [40.7128, -74.006],
  zoom: 13,
  zoomControl: false,
  attributionControl: true
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

L.control.zoom({ position: 'bottomright' }).addTo(map);

const DRIVER_NAMES = ['D-ALPHA','D-BRAVO','D-CHARLIE','D-DELTA','D-ECHO','D-FOXTROT','D-GOLF','D-HOTEL','D-INDIA','D-JULIET'];
const STATUSES = ['Delivering','En Route','Idle','Pick-up'];
const STATUS_COLORS = { 'Delivering': '#4ade80', 'En Route': '#60a5fa', 'Idle': '#f59e0b', 'Pick-up': '#f472b6' };

const drivers = DRIVER_NAMES.map((name, i) => ({
  id: i,
  name,
  lat: 40.7128 + (Math.random() - 0.5) * 0.06,
  lng: -74.006 + (Math.random() - 0.5) * 0.09,
  speed: Math.floor(Math.random() * 45 + 5),
  status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
  heading: Math.random() * Math.PI * 2,
  dLat: (Math.random() - 0.5) * 0.0003,
  dLng: (Math.random() - 0.5) * 0.0004,
  marker: null,
  order: `ORD-${10000 + i * 317}`
}));

function createDriverIcon(status) {
  const color = STATUS_COLORS[status] || '#4ade80';
  const svg = `
    <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="12" fill="${color}" fill-opacity="0.12"/>
      <circle cx="14" cy="14" r="8" fill="${color}" fill-opacity="0.25"/>
      <circle cx="14" cy="14" r="5" fill="${color}"/>
      <circle cx="14" cy="14" r="5" fill="${color}" opacity="0.5">
        <animate attributeName="r" values="5;11;5" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>`;
  return L.divIcon({
    html: svg, className: '', iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -18]
  });
}

function createDispatchIcon() {
  const svg = `
    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="14" fill="#3b82f6" fill-opacity="0.15"/>
      <circle cx="18" cy="18" r="9" fill="#3b82f6" fill-opacity="0.3"/>
      <circle cx="18" cy="18" r="5" fill="#60a5fa"/>
      <circle cx="18" cy="18" r="5" fill="#3b82f6" opacity="0.6">
        <animate attributeName="r" values="5;15;5" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.7;0;0.7" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <line x1="18" y1="4" x2="18" y2="12" stroke="#60a5fa" stroke-width="1.5"/>
      <line x1="18" y1="24" x2="18" y2="32" stroke="#60a5fa" stroke-width="1.5"/>
      <line x1="4" y1="18" x2="12" y2="18" stroke="#60a5fa" stroke-width="1.5"/>
      <line x1="24" y1="18" x2="32" y2="18" stroke="#60a5fa" stroke-width="1.5"/>
    </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -22] });
}
drivers.forEach(d => {
  const marker = L.marker([d.lat, d.lng], { icon: createDriverIcon(d.status) }).addTo(map);
  marker.on('click', () => {
    const popupHTML = `
      <div class="driver-popup">
        <h3>
          <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="${STATUS_COLORS[d.status]}"/></svg>
          ${d.name}
        </h3>
        <div class="stat-row"><span>Status</span><span class="status-badge">${d.status}</span></div>
        <div class="stat-row"><span>Speed</span><span class="stat-val">${d.speed} mph</span></div>
        <div class="stat-row"><span>Order</span><span class="stat-val">${d.order}</span></div>
        <div class="stat-row"><span>Lat / Lng</span><span class="stat-val">${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}</span></div>
        <div class="stat-row"><span>Signal</span><span class="stat-val" style="color:#4ade80;">Strong</span></div>
      </div>`;
    marker.bindPopup(L.popup({ maxWidth: 220, minWidth: 180 }).setContent(popupHTML)).openPopup();
    addLog(`[INSPECT] ${d.name} selected — ${d.speed}mph, status: ${d.status}`, 'info');
  });
  d.marker = marker;
});

let dispatchMarker = null;
map.on('click', (e) => {
  const { lat, lng } = e.latlng;
  if (dispatchMarker) map.removeLayer(dispatchMarker);
  dispatchMarker = L.marker([lat, lng], { icon: createDispatchIcon() })
    .addTo(map)
    .bindPopup(`<div style="font-family:monospace;font-size:12px;color:#a5b4fc;padding:4px 6px;">
      <b style="color:#c4b5fd;">NEW DISPATCH REQUEST</b><br>
      <span style="color:#94a3b8;">Lat: ${lat.toFixed(5)}</span><br>
      <span style="color:#94a3b8;">Lng: ${lng.toFixed(5)}</span><br>
      <span style="font-size:10px;color:#6b7280;">Click a driver to assign</span>
    </div>`)
    .openPopup();
  addLog(`[DISPATCH] New task created at ${lat.toFixed(5)}, ${lng.toFixed(5)}`, 'dispatch');
  setTimeout(() => {
    if (dispatchMarker) { map.removeLayer(dispatchMarker); dispatchMarker = null; }
  }, 15000);
});

const ctx = document.getElementById('throughputChart').getContext('2d');
const chartLabels = Array.from({ length: 30 }, (_, i) => `${30 - i}s`);
const chartData = Array.from({ length: 30 }, () => Math.random() * 60 + 80);

const throughputChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: chartLabels,
    datasets: [{
      data: chartData,
      borderColor: '#818cf8',
      borderWidth: 1.5,
      pointRadius: 0,
      fill: true,
      backgroundColor: (ctx) => {
        const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 110);
        g.addColorStop(0, 'rgba(99,102,241,0.3)');
        g.addColorStop(1, 'rgba(99,102,241,0)');
        return g;
      },
      tension: 0.45
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400, easing: 'easeInOutQuart' },
    interaction: { intersect: false },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: {
        ticks: { display: false },
        grid: { color: 'rgba(51,65,85,0.3)', drawBorder: false },
        border: { display: false }
      },
      y: {
        min: 40, max: 180,
        ticks: {
          color: '#475569', font: { size: 9, family: 'monospace' },
          maxTicksLimit: 4,
          callback: v => v
        },
        grid: { color: 'rgba(51,65,85,0.25)', drawBorder: false },
        border: { display: false }
      }
    }
  }
});

const terminal = document.getElementById('terminal');
let logCount = 0;

function addLog(msg, type = 'normal') {
  const timestamp = new Date().toTimeString().slice(0, 8);
  const line = document.createElement('div');
  const ts = `<span class="log-dim">[${timestamp}]</span> `;
  if (type === 'dispatch') {
    line.innerHTML = `<span class="log-dispatch">${ts}${msg}</span>`;
  } else if (type === 'info') {
    line.innerHTML = `${ts}<span class="log-info">${msg}</span>`;
  } else if (type === 'warn') {
    line.innerHTML = `${ts}<span class="log-warn">${msg}</span>`;
  } else {
    line.innerHTML = `${ts}<span class="log-normal">${msg}</span>`;
  }
  terminal.appendChild(line);
  if (logCount++ > 200) terminal.removeChild(terminal.firstChild);
  terminal.scrollTop = terminal.scrollHeight;
}

const LOG_MSGS = [
  d => `GPS_PING ${d.name} lat=${d.lat.toFixed(5)} lng=${d.lng.toFixed(5)}`,
  d => `SPEED_UPDATE ${d.name} → ${d.speed}mph`,
  d => `HEARTBEAT ${d.name} OK signal=strong`,
  d => `STATUS_SYNC ${d.name} [${d.status}]`,
  d => `ROUTE_CALC ${d.name} ETA=+${Math.floor(Math.random()*20+2)}min`,
];

let tick = 0;
setInterval(() => {
  tick++;

  // Move drivers
  drivers.forEach(d => {
    d.lat += d.dLat + (Math.random() - 0.5) * 0.0001;
    d.lng += d.dLng + (Math.random() - 0.5) * 0.0002;
    // Bounce near NYC bounds
    if (d.lat > 40.75 || d.lat < 40.68) d.dLat *= -1;
    if (d.lng > -73.94 || d.lng < -74.07) d.dLng *= -1;
    d.speed = Math.max(5, Math.min(65, d.speed + Math.floor((Math.random() - 0.5) * 6)));
    if (Math.random() < 0.02) d.status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    d.marker.setLatLng([d.lat, d.lng]);
    d.marker.setIcon(createDriverIcon(d.status));
  });

  const newVal = Math.max(45, Math.min(175, (chartData[chartData.length - 1] || 100) + (Math.random() - 0.5) * 30));
  chartData.shift(); chartData.push(parseFloat(newVal.toFixed(1)));
  throughputChart.data.datasets[0].data = [...chartData];
  throughputChart.update('none');

  // KPIs
  const ingestion = Math.floor(newVal);
  document.getElementById('kpi-ingestion').textContent = ingestion;
  document.getElementById('kpi-fleet').textContent = drivers.length;
  const latency = Math.floor(Math.random() * 30 + 8);
  document.getElementById('kpi-latency').textContent = latency;
  if (latency > 30) document.getElementById('kpi-latency').style.color = '#ef4444';
  else if (latency > 20) document.getElementById('kpi-latency').style.color = '#f59e0b';
  else document.getElementById('kpi-latency').style.color = '#fbbf24';

  // Random log
  const d = drivers[Math.floor(Math.random() * drivers.length)];
  const msgFn = LOG_MSGS[Math.floor(Math.random() * LOG_MSGS.length)];
  addLog(msgFn(d));

  if (tick % 7 === 0) {
    const wd = drivers[Math.floor(Math.random() * drivers.length)];
    addLog(`[WARN] ${wd.name} latency spike detected — ${Math.floor(Math.random()*80+50)}ms`, 'warn');
  }

  // Occasional route event
  if (tick % 11 === 0) {
    const rd = drivers[Math.floor(Math.random() * drivers.length)];
    addLog(`[ROUTE] ${rd.name} completed waypoint — next in ${(Math.random()*2+0.3).toFixed(1)}mi`, 'info');
  }

}, 1000);

setTimeout(() => {
  addLog('System boot complete — telemetry stream open', 'info');
  addLog(`Fleet loaded: ${drivers.length} vehicles registered`);
  addLog('Connecting to WebSocket ws://fleet.api:9000/stream...', 'info');
  setTimeout(() => addLog('WebSocket CONNECTED — streaming at 1Hz', 'info'), 600);
  setTimeout(() => addLog('Map tiles loaded — CARTO Dark v4', 'dim'), 1000);
  drivers.forEach((d, i) => {
    setTimeout(() => addLog(`REGISTER ${d.name} → ${d.order} [${d.status}]`), 1200 + i * 120);
  });
}, 200);