import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS, toClientTimestamp } from "@/lib/drishti";

// GET /api/visibility[?vehicleNumber=...] — latest front-camera visibility score.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleNumber = searchParams.get("vehicleNumber");
    const filter = vehicleNumber ? { vehicleNumber } : {};

    const db = await getDb();
    const doc = await db.collection(COLLECTIONS.visibility).findOne(filter, { sort: { timestamp: -1 } });

    return NextResponse.json({
      success: true,
      visibilityScore: doc ? Math.round(Number(doc.score) || 0) : 0,
      timestamp: doc ? toClientTimestamp(doc.timestamp) : null,
    });
  } catch (err) {
    console.error("Visibility Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
