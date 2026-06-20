import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/drishti";

// GET /api/visibility[?vehicleNumber=&startTime=&endTime=] — recent visibility readings (array).
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleNumber = searchParams.get("vehicleNumber");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    const filter = {};
    if (vehicleNumber) filter.vehicleNumber = vehicleNumber;
    if (startTime || endTime) {
      filter.timestamp = {};
      if (startTime) filter.timestamp.$gte = new Date(startTime);
      if (endTime) filter.timestamp.$lte = new Date(endTime);
    }

    const db = await getDb();
    const docs = await db.collection(COLLECTIONS.visibility).find(filter).sort({ timestamp: -1 }).limit(50).toArray();

    return NextResponse.json(
      docs.map((d) => ({
        vehicleNumber: d.vehicleNumber || "N/A",
        score: d.score,
        timestamp: d.timestamp,
        description: `Visibility ${Math.round(Number(d.score) || 0)}%`,
      }))
    );
  } catch (error) {
    console.error("Error fetching visibility data:", error.message);
    return NextResponse.json({ message: "Failed to fetch visibility data", error: error.message }, { status: 500 });
  }
}
