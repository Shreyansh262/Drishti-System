// Device simulator — stands in for the ESP32 + sensors. It POSTs realistic
// readings to the ingest API on an interval, so the dashboard shows live data
// without any physical hardware.
//
//   cd tools && cp .env.example .env   # fill in INGEST_URL + INGEST_API_KEY
//   npm install
//   npm run simulate
//
// Requires Node 18+ (global fetch).

import "dotenv/config";

const INGEST_URL = process.env.INGEST_URL || "http://localhost:3000/api/ingest";
const INGEST_API_KEY = process.env.INGEST_API_KEY || "";
const VEHICLE = process.env.SIM_VEHICLE || "HR20AP1234";
const INTERVAL_MS = Number(process.env.SIM_INTERVAL_MS || 5000);

// Rough loop around the Sonipat / NH-44 area so the map marker visibly moves.
const ROUTE = [
  [28.9931, 77.0151],
  [28.9975, 77.022],
  [29.005, 77.03],
  [29.012, 77.041],
  [29.005, 77.05],
  [28.997, 77.04],
];

let routeIndex = 0;
let tick = 0;

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const jitter = (base, spread) => base + (Math.random() - 0.5) * spread;

function nextReading() {
  tick += 1;

  // GPS: step along the route, with small jitter.
  const [baseLat, baseLng] = ROUTE[routeIndex % ROUTE.length];
  routeIndex += 1;
  const lat = jitter(baseLat, 0.002);
  const lng = jitter(baseLng, 0.002);

  // Speed: mostly 30–70, occasionally overspeed.
  const overspeed = Math.random() < 0.1;
  const speed = Math.round(overspeed ? jitter(95, 15) : clamp(jitter(50, 30), 0, 80));

  // Alcohol: usually low, occasional spike (triggers a high-severity incident).
  const drunk = Math.random() < 0.06;
  const sensorValue = Math.round(drunk ? jitter(320, 80) : clamp(jitter(70, 60), 0, 180));

  // Visibility: usually clear, occasional dip.
  const foggy = Math.random() < 0.08;
  const score = Math.round(foggy ? jitter(30, 15) : clamp(jitter(85, 20), 0, 100));

  // Drowsiness: mostly awake.
  const r = Math.random();
  const state = r < 0.05 ? "Sleepiness" : r < 0.15 ? "Drowsiness" : "Awake";

  return {
    vehicleNumber: VEHICLE,
    location: "NH-44, Sonipat",
    alcohol: { sensorValue },
    visibility: { score },
    drowsiness: { state },
    obd: { lat, lng, speed },
  };
}

async function send(reading) {
  try {
    const res = await fetch(INGEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(INGEST_API_KEY ? { "x-ingest-key": INGEST_API_KEY } : {}),
      },
      body: JSON.stringify(reading),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`✗ [${tick}] ${res.status}`, body.error || body);
      return;
    }
    const inc = body.incidentsLogged ? ` ⚠️ +${body.incidentsLogged} incident(s)` : "";
    console.log(
      `✓ [${tick}] speed=${reading.obd.speed} alc=${reading.alcohol.sensorValue} vis=${reading.visibility.score} state=${reading.drowsiness.state}${inc}`
    );
  } catch (err) {
    console.error(`✗ [${tick}] request failed:`, err.message);
  }
}

console.log(`📡 Drishti simulator → ${INGEST_URL}`);
console.log(`   vehicle=${VEHICLE} interval=${INTERVAL_MS}ms (Ctrl+C to stop)\n`);

// Fire once immediately, then on an interval.
send(nextReading());
setInterval(() => send(nextReading()), INTERVAL_MS);
