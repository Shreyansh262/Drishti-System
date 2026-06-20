# 🚗 Drishti (दृष्टि) — Vehicle Safety Monitoring System

> An end-to-end IoT telemetry platform: an in-vehicle device streams driver-safety
> sensor data to a cloud API, which stores it in a database and serves it to a live
> web dashboard and an admin panel.

**Drishti** ("vision" in Sanskrit) monitors driver safety in real time — alcohol
level, drowsiness, road visibility, speed, and GPS — flags unsafe events as
**incidents**, and computes a live **driver safety score**.

The whole stack runs on **$0 of infrastructure** (MongoDB Atlas free tier + Vercel
free tier + OpenStreetMap), and ships with a **device simulator** so it demos live
without any physical hardware.

---

## 🧭 Architecture

```
 ┌─────────────────────┐        HTTP POST (JSON)        ┌──────────────────────┐
 │  ESP32 + sensors     │  ───────────────────────────▶ │   POST /api/ingest    │
 │  (or simulator.js)   │   x-ingest-key: <secret>      │   (Next.js route)     │
 └─────────────────────┘                                └──────────┬───────────┘
   MQ-3 alcohol · camera (drowsiness/visibility)                   │ writes
   OBD-II GPS + speed                                              ▼
                                                        ┌──────────────────────┐
                                                        │   MongoDB Atlas        │
                                                        │  alcohol · visibility  │
                                                        │  drowsiness · obd      │
                                                        │  incidents · tickets…  │
                                                        └──────────┬───────────┘
                                          reads (polled every ~8s) │
                            ┌─────────────────────────────────────┴───────────┐
                            ▼                                                   ▼
                ┌────────────────────────┐                        ┌────────────────────────┐
                │  Driver Dashboard       │                        │  Admin Panel            │
                │  live score, map, alerts│                        │ tickets/complaints/…    │
                └────────────────────────┘                        └────────────────────────┘
```

**Data flow:** device → `/api/ingest` → MongoDB → read APIs → dashboards.
The ingest endpoint also auto-creates **incidents** when a reading crosses a safety
threshold (e.g. high alcohol, "Drowsy" state, low visibility, overspeeding).

---

## 🧱 Tech stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 (App Router), React 18, Tailwind CSS, shadcn/ui |
| Backend | Next.js API route handlers (Node runtime) |
| Database | MongoDB Atlas (free M0) |
| Maps | Leaflet + OpenStreetMap (no API key, free) |
| Device | ESP32 reference firmware (`tools/firmware`) + Node simulator |
| Hosting | Vercel (free Hobby tier) |

---

## 📦 Repository layout

```
drishti-monitoring-dashboard-Client-Side/   # Driver dashboard + ingest + read APIs
drishti-admin/                               # Admin panel (tickets/complaints/feedback/history)
tools/                                       # seed.js, simulator.js, ESP32 firmware
```

---

## 🚀 Quick start (local)

### 1. Database
1. Create a free **MongoDB Atlas** M0 cluster.
2. Add a database user and allow network access (`0.0.0.0/0` for dev).
3. Copy the connection string.

### 2. Client app (driver dashboard + ingest API)
```bash
cd drishti-monitoring-dashboard-Client-Side
cp .env.example .env.local        # set MONGODB_URI + INGEST_API_KEY
npm install
npm run dev                       # http://localhost:3000
```

### 3. Seed demo data + run the simulator
```bash
cd tools
cp .env.example .env              # set MONGODB_URI, INGEST_URL, INGEST_API_KEY
npm install
npm run seed                      # populate vehicles, history, tickets…
npm run simulate                  # stream live readings to /api/ingest
```

Log in at `http://localhost:3000/login` with vehicle **HR20AP1234** and watch the
dashboard update live.

### 4. Admin app (optional, separate process)
```bash
cd drishti-admin
cp .env.example .env.local        # same MONGODB_URI + MONGODB_DB as the client
npm install
npm run dev -- -p 3001            # http://localhost:3001
```

---

## ☁️ Deploy (free)

- Import each app folder into **Vercel** as its own project.
- Set env vars in Vercel: `MONGODB_URI`, `MONGODB_DB`, and (client only) `INGEST_API_KEY`.
- Point the simulator's `INGEST_URL` at your deployed client URL to keep the live
  demo fresh, or run it locally during demos.

---

## 🔌 Ingest API

`POST /api/ingest` (header `x-ingest-key: <INGEST_API_KEY>`)

```json
{
  "vehicleNumber": "HR20AP1234",
  "location": "NH-44, Sonipat",
  "alcohol":    { "sensorValue": 120 },
  "visibility": { "score": 87 },
  "drowsiness": { "state": "Awake" },
  "obd":        { "lat": 28.99, "lng": 77.01, "speed": 54 }
}
```

All sensor blocks are optional — a real device sends whatever it has.

---

## ⚠️ Notes & known simplifications

- **Auth is demo-grade**: login looks up a vehicle number in the `vehicles`
  collection (no passwords). Fine for a portfolio demo; not production auth.
- **No physical hardware required**: `tools/simulator.js` reproduces the exact data
  path; `tools/firmware/drishti_esp32.ino` shows how real hardware would feed it.
- **Free-tier limits apply** (Atlas storage, Vercel Hobby; Atlas may pause after long
  inactivity — just resume it from the Atlas dashboard).
- Secrets live only in `.env.local` / `.env` (git-ignored). Never commit them.
