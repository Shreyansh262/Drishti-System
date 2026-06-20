// Seeds the Drishti database with demo data so the dashboards look populated
// even before the simulator runs. Safe to re-run: it clears seeded collections
// and re-inserts. Vehicles are upserted (never duplicated).
//
//   cd tools && cp .env.example .env   # fill in MONGODB_URI
//   npm install
//   npm run seed

import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "drishti";

if (!uri) {
  console.error("❌ MONGODB_URI is not set. Copy tools/.env.example to tools/.env and fill it in.");
  process.exit(1);
}

const VEHICLES = [
  { vehicleNumber: "HR20AP1234", ownerName: "Demo Driver" },
  { vehicleNumber: "MH12CD5678", ownerName: "Test Fleet Vehicle" },
];

const LOCATIONS = [
  "NH-44, Sonipat",
  "Ring Road, Delhi",
  "NH-48, Gurugram",
  "Yamuna Expressway",
  "MG Road, Bengaluru",
];

const INCIDENT_TYPES = [
  { type: "Alcohol Detected", severity: "high", description: "Alcohol sensor crossed safe threshold" },
  { type: "Sleepiness Alert", severity: "high", description: "Driver appeared to be sleeping" },
  { type: "Drowsiness Alert", severity: "medium", description: "Driver showing signs of drowsiness" },
  { type: "Low Visibility", severity: "medium", description: "Front-camera visibility dropped" },
  { type: "Overspeeding", severity: "medium", description: "Vehicle exceeded the speed limit" },
  { type: "Harsh Braking", severity: "low", description: "Sudden hard braking detected" },
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

function buildIncidents() {
  const incidents = [];
  const now = Date.now();
  // ~24 incidents spread across the last 30 days, a few within the last 48h.
  for (let i = 0; i < 24; i++) {
    const ageMs =
      i < 4
        ? Math.random() * 36 * 60 * 60 * 1000 // last 36h
        : Math.random() * 30 * 24 * 60 * 60 * 1000; // last 30 days
    const t = rand(INCIDENT_TYPES);
    incidents.push({
      vehicleNumber: rand(VEHICLES).vehicleNumber,
      type: t.type,
      severity: t.severity,
      location: rand(LOCATIONS),
      description: t.description,
      datetime: new Date(now - ageMs),
    });
  }
  return incidents;
}

const TICKETS = [
  {
    id: "TKT10000001",
    vehicleNumber: "HR20AP1234",
    issueType: "false-alcohol-alert",
    title: "Alcohol Detected Incident",
    description: "I was not drinking; the sensor may have misfired near a sanitizer dispenser.",
    incidentDate: "2026-06-10",
    incidentTime: "21:30",
    status: "pending",
    priority: "low",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    adminResponse: "",
  },
  {
    id: "TKT10000002",
    vehicleNumber: "MH12CD5678",
    issueType: "overspeeding",
    title: "Overspeeding Incident",
    description: "Speed reading looks wrong, I was within the limit on the expressway.",
    incidentDate: "2026-06-12",
    incidentTime: "08:15",
    status: "Processing",
    priority: "medium",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    adminResponse: "Reviewing GPS logs around the reported time.",
  },
];

const COMPLAINTS = [
  {
    id: "CMPLT2000001",
    feature: "Drowsiness Detection",
    complaint: "The face camera flags me as drowsy when I wear sunglasses. Vehicle HR20AP1234.",
    status: "Pending",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const FEEDBACK = [
  {
    id: "FDBK3000001",
    type: "Service Quality",
    message: "Really useful dashboard, the live map is great. 5 stars. Vehicle HR20AP1234.",
    status: "Pending",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// A little initial sensor data so cards aren't empty before the simulator runs.
function buildRecentSensors() {
  const now = Date.now();
  const v = "HR20AP1234";
  return {
    alcohol: [{ vehicleNumber: v, sensorValue: 60, timestamp: new Date(now - 30_000) }],
    visibility: [{ vehicleNumber: v, score: 88, timestamp: new Date(now - 30_000) }],
    drowsiness: [{ vehicleNumber: v, state: "Awake", timestamp: new Date(now - 30_000) }],
    obd: [{ vehicleNumber: v, lat: 28.9931, lng: 77.0151, speed: 42, timestamp: new Date(now - 30_000) }],
  };
}

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  console.log(`🚀 Seeding database "${dbName}"...`);

  // Upsert vehicles (don't duplicate).
  for (const v of VEHICLES) {
    await db.collection("vehicles").updateOne(
      { vehicleNumber: v.vehicleNumber },
      { $set: v },
      { upsert: true }
    );
  }
  console.log(`✓ vehicles: ${VEHICLES.length} upserted`);

  // Reset + insert the rest.
  const sensors = buildRecentSensors();
  const sets = {
    incidents: buildIncidents(),
    tickets: TICKETS,
    complaints: COMPLAINTS,
    feedback: FEEDBACK,
    alcohol: sensors.alcohol,
    visibility: sensors.visibility,
    drowsiness: sensors.drowsiness,
    obd: sensors.obd,
  };

  for (const [name, docs] of Object.entries(sets)) {
    await db.collection(name).deleteMany({});
    if (docs.length) await db.collection(name).insertMany(docs);
    console.log(`✓ ${name}: ${docs.length} inserted`);
  }

  await client.close();
  console.log("✅ Seed complete.");
}

run().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
