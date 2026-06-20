import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS, toClientTimestamp } from "@/lib/drishti";

// GET /api/alcohol[?vehicleNumber=...] — latest MQ-3 alcohol reading.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleNumber = searchParams.get("vehicleNumber");
    const filter = vehicleNumber ? { vehicleNumber } : {};

    const db = await getDb();
    const doc = await db.collection(COLLECTIONS.alcohol).findOne(filter, { sort: { timestamp: -1 } });

    return NextResponse.json({
      success: true,
      alcoholLevel: doc ? Number(doc.sensorValue) || 0 : 0,
      timestamp: doc ? toClientTimestamp(doc.timestamp) : null,
    });
  } catch (err) {
    console.error("Alcohol Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
