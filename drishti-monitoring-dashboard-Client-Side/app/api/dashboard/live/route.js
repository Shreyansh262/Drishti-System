import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS, toClientTimestamp } from "@/lib/drishti";

// GET /api/dashboard/live[?vehicleNumber=HR20AP1234]
// Aggregates the latest reading from each sensor collection plus the incident
// history, and returns the exact shape the dashboard UI already consumes.

const DEFAULT_COORDS = { lat: 48.8584, lng: 2.2945 };

function latest(db, name, filter) {
  return db.collection(name).findOne(filter, { sort: { timestamp: -1 } });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleNumber = searchParams.get("vehicleNumber");
    const vehicleFilter = vehicleNumber ? { vehicleNumber } : {};

    const db = await getDb();
    const now = new Date();

    const dashboardData = {
      driverScore: 100,
      alcoholLevel: 0.0,
      alcoholTimestamp: null,
      visibilityScore: 0,
      frontcamTimestamp: null,
      drowsinessState: "Awake",
      dashcamTimestamp: null,
      speed: 0,
      coordinates: DEFAULT_COORDS,
      obdTimestamp: null,
      isConnected: false,
      lastUpdate: null,
      recentIncidents: 0,
      activeIncidents: [],
      totalIncidents: 0,
      monthlyIncidents: 0,
      weeklySafetyScore: "0.00",
    };

    const [alcoholDoc, visibilityDoc, drowsinessDoc, obdDoc, incidentDocs] = await Promise.all([
      latest(db, COLLECTIONS.alcohol, vehicleFilter),
      latest(db, COLLECTIONS.visibility, vehicleFilter),
      latest(db, COLLECTIONS.drowsiness, vehicleFilter),
      latest(db, COLLECTIONS.obd, vehicleFilter),
      db
        .collection(COLLECTIONS.incidents)
        .find(vehicleFilter)
        .sort({ datetime: -1 })
        .limit(1000)
        .toArray(),
    ]);

    // --- Alcohol ---
    if (alcoholDoc) {
      dashboardData.alcoholLevel = (Number(alcoholDoc.sensorValue) || 0) / 180;
      dashboardData.alcoholTimestamp = toClientTimestamp(alcoholDoc.timestamp);
    }

    // --- Visibility ---
    if (visibilityDoc) {
      dashboardData.visibilityScore = Math.round(Number(visibilityDoc.score) || 0);
      dashboardData.frontcamTimestamp = toClientTimestamp(visibilityDoc.timestamp);
    }

    // --- Drowsiness ---
    if (drowsinessDoc) {
      dashboardData.drowsinessState = drowsinessDoc.state || "Unknown";
      dashboardData.dashcamTimestamp = toClientTimestamp(drowsinessDoc.timestamp);
    }

    // --- OBD (speed + GPS) ---
    if (obdDoc) {
      const ageMs = obdDoc.timestamp ? now.getTime() - new Date(obdDoc.timestamp).getTime() : Infinity;
      const isRecent = ageMs <= 60_000;
      const hasCoords = obdDoc.lat != null && obdDoc.lng != null;
      dashboardData.speed = Math.round(Number(obdDoc.speed) || 0);
      dashboardData.coordinates = hasCoords ? { lat: obdDoc.lat, lng: obdDoc.lng } : DEFAULT_COORDS;
      dashboardData.obdTimestamp = toClientTimestamp(obdDoc.timestamp);
      dashboardData.isConnected = isRecent && hasCoords;
    }

    // --- Incident history + driver score ---
    const all = incidentDocs
      .map((doc, i) => {
        const dt = doc.datetime ? new Date(doc.datetime) : null;
        if (!dt || isNaN(dt.getTime())) return null;
        return {
          id: doc._id?.toString() || String(i + 1),
          type: (doc.type || "").trim(),
          severity: (doc.severity || "").trim(),
          location: (doc.location || "").trim(),
          description: (doc.description || "").trim(),
          datetime: dt,
          time: toClientTimestamp(dt),
        };
      })
      .filter(Boolean);

    const ms = (h) => h * 60 * 60 * 1000;
    const twoDaysAgo = new Date(now.getTime() - ms(48));
    const sixHoursAgo = new Date(now.getTime() - ms(6));
    const oneWeekAgo = new Date(now.getTime() - ms(24 * 7));

    const last48Hours = all.filter((x) => x.datetime >= twoDaysAgo && x.datetime <= now);
    const recent = last48Hours.filter((x) => x.datetime >= sixHoursAgo);
    const monthly = all.filter(
      (x) => x.datetime.getMonth() === now.getMonth() && x.datetime.getFullYear() === now.getFullYear()
    );

    let penalty = 0;
    last48Hours.forEach((inc) => {
      if (inc.severity.toLowerCase() === "high") penalty += 0.15;
      else if (inc.severity.toLowerCase() === "medium") penalty += 0.05;
    });

    let score = 100;
    if (recent.length === 0) score += 10; // small bonus for a clean recent window
    const driverScore = Math.max(0, Math.min(100, score - penalty));

    let weeklyPenalty = 0;
    all
      .filter((x) => x.datetime >= oneWeekAgo)
      .forEach((inc) => {
        if (inc.severity.toLowerCase() === "high") weeklyPenalty += 0.2;
        else if (inc.severity.toLowerCase() === "medium") weeklyPenalty += 0.05;
      });
    const weeklyScore = Math.max(0, 100 - weeklyPenalty / 7).toFixed(2);

    dashboardData.totalIncidents = all.length;
    dashboardData.monthlyIncidents = monthly.length;
    dashboardData.weeklySafetyScore = weeklyScore;
    dashboardData.driverScore = driverScore;
    dashboardData.recentIncidents = last48Hours.length;
    dashboardData.activeIncidents = last48Hours.map(({ datetime, ...rest }) => rest);

    dashboardData.lastUpdate = toClientTimestamp(now);
    return NextResponse.json({ success: true, ...dashboardData });
  } catch (err) {
    console.error("API Error (/dashboard/live):", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
