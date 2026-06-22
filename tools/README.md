# Drishti — Tools (Seeder & Device Simulator)

Utility scripts that make the project fully demonstrable without physical hardware.

| File                         | Description                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `seed.js`                    | Populates the database with demo vehicles, incident history, tickets, complaints, and feedback so the dashboards have data immediately. |
| `simulator.js`               | Emulates the ESP32 and its sensors by posting realistic readings to `/api/ingest` on a loop, driving live dashboard updates. |
| `firmware/drishti_esp32.ino` | Reference firmware showing how real hardware feeds the same ingest API over Wi-Fi.                       |

## Prerequisites

- Node.js 18 or later
- A running Drishti client app (for the simulator) and a MongoDB connection string (for the seeder)

## Setup

```bash
cd tools
cp .env.example .env      # set MONGODB_URI, INGEST_URL, and INGEST_API_KEY
npm install
```

## Usage

```bash
# One-time: load demo data (vehicles, history, tickets, ...)
npm run seed

# Keep running during a demo to stream live readings
npm run simulate
```

## How It Works

- `seed.js` connects directly to MongoDB using `MONGODB_URI`.
- `simulator.js` posts to the running web app's ingest endpoint (`INGEST_URL` with
  `INGEST_API_KEY`), exactly as a real device would. It works against `localhost` or a
  deployed Vercel URL.

## Environment Variables

| Variable         | Used by      | Description                                  |
| ---------------- | ------------ | -------------------------------------------- |
| `MONGODB_URI`    | `seed.js`    | MongoDB Atlas connection string              |
| `INGEST_URL`     | `simulator.js` | Target ingest endpoint                     |
| `INGEST_API_KEY` | `simulator.js` | Shared secret for `POST /api/ingest`       |

The demo login vehicle is **HR20AP1234**.
