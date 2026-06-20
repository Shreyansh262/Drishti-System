import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS, toClientTimestamp } from "@/lib/drishti";

// GET /api/drowsiness[?vehicleNumber=...] — latest driver-state reading.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleNumber = searchParams.get("vehicleNumber");
    const filter = vehicleNumber ? { vehicleNumber } : {};

    const db = await getDb();
    const doc = await db.collection(COLLECTIONS.drowsiness).findOne(filter, { sort: { timestamp: -1 } });

    return NextResponse.json({
      success: true,
      state: doc?.state || "Unknown",
      timestamp: doc ? toClientTimestamp(doc.timestamp) : null,
    });
  } catch (err) {
    console.error("Drowsiness Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
