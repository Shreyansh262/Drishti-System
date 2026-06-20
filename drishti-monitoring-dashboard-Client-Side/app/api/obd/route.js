import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS, toClientTimestamp } from "@/lib/drishti";

// GET /api/obd[?vehicleNumber=...] — latest GPS + speed reading.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleNumber = searchParams.get("vehicleNumber");
    const filter = vehicleNumber ? { vehicleNumber } : {};

    const db = await getDb();
    const doc = await db.collection(COLLECTIONS.obd).findOne(filter, { sort: { timestamp: -1 } });

    if (!doc) {
      return NextResponse.json({ success: true, speed: 0, coordinates: null, timestamp: null, isLive: false });
    }

    const ageMs = doc.timestamp ? Date.now() - new Date(doc.timestamp).getTime() : Infinity;

    return NextResponse.json({
      success: true,
      speed: Math.round(Number(doc.speed) || 0),
      coordinates: { lat: doc.lat, lng: doc.lng },
      timestamp: toClientTimestamp(doc.timestamp),
      isLive: ageMs <= 60_000,
    });
  } catch (err) {
    console.error("OBD Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
