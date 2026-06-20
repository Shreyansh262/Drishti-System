import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS, deriveIncidents } from "@/lib/drishti";

// POST /api/ingest — the endpoint the device (ESP32) or the simulator posts to.
// This is the "server" the project now owns. It validates a reading and writes
// one timestamped document per present sensor, then auto-logs safety incidents.
//
// Body (all sensor blocks optional, send what you have):
// {
//   "vehicleNumber": "HR20AP1234",
//   "location": "NH-44, Sonipat",            // optional, used on incidents
//   "alcohol":    { "sensorValue": 120 },
//   "visibility": { "score": 87 },
//   "drowsiness": { "state": "Awake" },
//   "obd":        { "lat": 28.99, "lng": 77.01, "speed": 54 }
// }

export async function POST(req) {
  try {
    // --- Simple shared-secret auth (skipped only if no key is configured) ---
    const requiredKey = process.env.INGEST_API_KEY;
    if (requiredKey) {
      const provided = req.headers.get("x-ingest-key");
      if (provided !== requiredKey) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    const { vehicleNumber, location, alcohol, visibility, drowsiness, obd } = body || {};

    if (!vehicleNumber) {
      return NextResponse.json({ success: false, error: "vehicleNumber is required" }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date();
    const written = {};

    const writes = [];

    if (alcohol && alcohol.sensorValue != null) {
      writes.push(
        db.collection(COLLECTIONS.alcohol).insertOne({
          vehicleNumber,
          sensorValue: Number(alcohol.sensorValue),
          timestamp: now,
        })
      );
      written.alcohol = true;
    }

    if (visibility && visibility.score != null) {
      writes.push(
        db.collection(COLLECTIONS.visibility).insertOne({
          vehicleNumber,
          score: Number(visibility.score),
          timestamp: now,
        })
      );
      written.visibility = true;
    }

    if (drowsiness && drowsiness.state) {
      writes.push(
        db.collection(COLLECTIONS.drowsiness).insertOne({
          vehicleNumber,
          state: String(drowsiness.state),
          timestamp: now,
        })
      );
      written.drowsiness = true;
    }

    if (obd && obd.lat != null && obd.lng != null) {
      writes.push(
        db.collection(COLLECTIONS.obd).insertOne({
          vehicleNumber,
          lat: Number(obd.lat),
          lng: Number(obd.lng),
          speed: Number(obd.speed) || 0,
          timestamp: now,
        })
      );
      written.obd = true;
    }

    // Auto-create safety incidents from this reading.
    const incidents = deriveIncidents({ vehicleNumber, location, alcohol, visibility, drowsiness, obd, datetime: now });
    if (incidents.length > 0) {
      writes.push(db.collection(COLLECTIONS.incidents).insertMany(incidents));
    }

    await Promise.all(writes);

    return NextResponse.json({
      success: true,
      written,
      incidentsLogged: incidents.length,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error("POST /api/ingest error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
