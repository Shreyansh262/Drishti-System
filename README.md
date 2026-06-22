# Drishti — Vehicle Safety Monitoring System

Drishti (Sanskrit for *"vision"*) is an end-to-end IoT telemetry platform for
real-time driver-safety monitoring. An in-vehicle device streams sensor data to a
cloud API, which persists it to a database and serves it to a live driver dashboard
and an administrative panel.

The system tracks alcohol level, driver drowsiness, road visibility, speed, and GPS
position, automatically flags unsafe conditions as **incidents**, and derives a live
**driver safety score**.

The entire stack runs on free-tier infrastructure (MongoDB Atlas, Vercel, and
OpenStreetMap) and ships with a device simulator so it can be demonstrated end-to-end
without any physical hardware.

## Features

- **Real-time telemetry ingestion** via an authenticated HTTP endpoint.
- **Automatic incident detection** when a reading crosses a safety threshold
  (high alcohol, drowsiness, low visibility, or overspeeding).
- **Driver dashboard** with a live safety score, sensor cards, map-based location,
  and incident alerts.
- **Admin panel** for managing support tickets, complaints, feedback, and per-vehicle
  history.
- **Hardware-optional**: a Node.js simulator reproduces the exact device data path;
  reference ESP32 firmware is included for real deployments.

## Architecture

```
 ┌──────────────────────┐       HTTP POST (JSON)        ┌──────────────────────┐
 │  ESP32 + sensors     │  ──────────────────────────▶  │   POST /api/ingest    │
 │  (or simulator.js)   │     x-ingest-key: <secret>    │   (Next.js route)     │
 └──────────────────────┘                               └──────────┬───────────┘
   MQ-3 alcohol · camera (drowsiness/visibility)                   │ writes
   OBD-II GPS + speed                                              ▼
                                                        ┌──────────────────────┐
                                                        │     MongoDB Atlas     │
                                                        │  alcohol · visibility │
                                                        │  drowsiness · obd     │
                                                        │  incidents · tickets… │
                                                        └──────────┬───────────┘
                                       reads (polled ~8s)          │
                          ┌─────────────────────────────────────────┴──────────┐
                          ▼                                                      ▼
              ┌────────────────────────┐                       ┌────────────────────────┐
              │   Driver Dashboard     │                       │      Admin Panel       │
              │ live score, map, alerts│                       │ tickets/complaints/... │
              └────────────────────────┘                       └────────────────────────┘
```

**Data flow:** device → `POST /api/ingest` → MongoDB → read APIs → dashboards.
On ingest, the API evaluates each reading against configured safety thresholds and
records an incident whenever one is exceeded.

## Tech Stack

| Layer    | Technology                                              |
| -------- | ------------------------------------------------------- |
| Frontend | Next.js 15 (App Router), React 18, Tailwind CSS, shadcn/ui |
| Backend  | Next.js Route Handlers (Node.js runtime)                |
| Database | MongoDB Atlas (free M0 tier)                            |
| Maps     | Leaflet + OpenStreetMap (no API key required)           |
| Device   | ESP32 reference firmware + Node.js simulator            |
| Hosting  | Vercel (free Hobby tier)                                |

## Repository Structure

```
drishti-monitoring-dashboard-Client-Side/   Driver dashboard, ingest API, and read APIs
drishti-admin/                              Admin panel (tickets, complaints, feedback, history)
tools/                                      Database seeder, device simulator, and ESP32 firmware
```

## Prerequisites

- Node.js 18 or later
- A MongoDB Atlas account (free M0 cluster is sufficient)

## Getting Started

### 1. Provision the database

1. Create a free MongoDB Atlas M0 cluster.
2. Add a database user and allow network access (`0.0.0.0/0` is acceptable for local development).
3. Copy the connection string.

### 2. Run the client app (driver dashboard + ingest API)

```bash
cd drishti-monitoring-dashboard-Client-Side
cp .env.example .env.local        # set MONGODB_URI, MONGODB_DB, and INGEST_API_KEY
npm install
npm run dev                       # http://localhost:3000
```

### 3. Seed demo data and start the simulator

```bash
cd tools
cp .env.example .env              # set MONGODB_URI, INGEST_URL, and INGEST_API_KEY
npm install
npm run seed                      # populate vehicles, history, tickets, etc.
npm run simulate                  # stream live readings to /api/ingest
```

Sign in at `http://localhost:3000/login` with vehicle number **HR20AP1234** to watch
the dashboard update in real time.

### 4. Run the admin app (optional)

```bash
cd drishti-admin
cp .env.example .env.local        # use the same MONGODB_URI and MONGODB_DB as the client
npm install
npm run dev -- -p 3001            # http://localhost:3001
```

## Deployment

Each application folder deploys to Vercel as an independent project:

1. Import the app folder into Vercel.
2. Configure the required environment variables: `MONGODB_URI`, `MONGODB_DB`, and
   (client only) `INGEST_API_KEY`.
3. To keep a deployed demo populated with live data, point the simulator's `INGEST_URL`
   at the deployed client URL, or run the simulator locally during demonstrations.

## Ingest API

```
POST /api/ingest
Header: x-ingest-key: <INGEST_API_KEY>
Content-Type: application/json
```

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

All sensor blocks are optional; a device sends whatever data it has available.

## Environment Variables

| Variable          | Used by         | Description                                          |
| ----------------- | --------------- | ---------------------------------------------------- |
| `MONGODB_URI`     | client, admin, tools | MongoDB Atlas connection string                 |
| `MONGODB_DB`      | client, admin   | Database name                                        |
| `INGEST_API_KEY`  | client, tools   | Shared secret required by `POST /api/ingest`         |
| `INGEST_URL`      | tools           | Target ingest endpoint for the simulator            |

Secrets are read only from `.env.local` / `.env`, both of which are git-ignored. Never
commit them.

## Notes and Limitations

- **Authentication is demo-grade.** Login resolves a vehicle number against the
  `vehicles` collection without passwords. This is suitable for a demonstration, not
  for production use.
- **No physical hardware is required.** `tools/simulator.js` reproduces the exact
  device data path; `tools/firmware/drishti_esp32.ino` shows how real hardware would
  feed the same ingest API.
- **Free-tier limits apply.** Atlas storage and Vercel Hobby quotas are limited, and an
  idle Atlas cluster may pause; resume it from the Atlas dashboard when needed.
