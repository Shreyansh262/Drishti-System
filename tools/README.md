# Drishti Tools — seed + device simulator

These scripts make the project demoable with **no physical hardware**.

| File | What it does |
|------|--------------|
| `seed.js` | Populates the database with demo vehicles, incident history, tickets, complaints, and feedback so the dashboards look alive immediately. |
| `simulator.js` | Stands in for the ESP32 + sensors — POSTs realistic readings to `/api/ingest` on a loop, so the dashboard updates live. |
| `firmware/drishti_esp32.ino` | Reference firmware showing how real hardware would feed the **same** ingest API over WiFi. |

## Setup

```bash
cd tools
cp .env.example .env      # fill in MONGODB_URI, INGEST_URL, INGEST_API_KEY
npm install
```

## Usage

```bash
# 1) one-time: load demo data (vehicles, history, tickets, ...)
npm run seed

# 2) keep this running during a demo to stream live readings
npm run simulate
```

`seed.js` talks directly to MongoDB (`MONGODB_URI`). `simulator.js` talks to the
running web app's ingest endpoint (`INGEST_URL` + `INGEST_API_KEY`), exactly like
a real device would — so it works against `localhost` or your deployed Vercel URL.

The demo login vehicle is **HR20AP1234**.
