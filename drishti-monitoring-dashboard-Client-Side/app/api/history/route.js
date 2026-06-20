import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/drishti";

// GET /api/history[?vehicleNumber=...] — full incident history + summary stats.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleNumber = searchParams.get("vehicleNumber");
    const filter = vehicleNumber ? { vehicleNumber } : {};

    const db = await getDb();
    const docs = await db
      .collection(COLLECTIONS.incidents)
      .find(filter)
      .sort({ datetime: -1 })
      .limit(2000)
      .toArray();

    const allIncidents = docs
      .map((doc, index) => {
        const time = doc.datetime ? new Date(doc.datetime) : null;
        if (!time || isNaN(time.getTime())) return null;
        return {
          id: doc._id?.toString() || String(index + 1),
          type: (doc.type || "").trim(),
          severity: (doc.severity || "").trim(),
          location: (doc.location || "").trim(),
          description: (doc.description || "").trim(),
          time: time.toISOString(),
        };
      })
      .filter(Boolean);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyIncidents = allIncidents.filter((incident) => {
      const t = new Date(incident.time);
      return t.getMonth() === currentMonth && t.getFullYear() === currentYear;
    }).length;

    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let penalty = 0;
    allIncidents
      .filter((incident) => new Date(incident.time) >= oneWeekAgo)
      .forEach((incident) => {
        const severity = incident.severity.toLowerCase();
        if (severity === "high") penalty += 0.2;
        else if (severity === "medium") penalty += 0.05;
      });

    const weeklySafetyScore = Math.max(0, 100 - penalty / 7).toFixed(2);

    return NextResponse.json({
      success: true,
      totalIncidents: allIncidents.length,
      monthlyIncidents,
      weeklySafetyScore,
      incidents: allIncidents,
    });
  } catch (err) {
    console.error("API /history error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
