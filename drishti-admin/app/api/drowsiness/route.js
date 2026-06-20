import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/drishti";

// GET /api/drowsiness[?vehicleNumber=&startTime=&endTime=] — recent driver-state readings (array).
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
    const docs = await db.collection(COLLECTIONS.drowsiness).find(filter).sort({ timestamp: -1 }).limit(50).toArray();

    return NextResponse.json(
      docs.map((d) => ({
        vehicleNumber: d.vehicleNumber || "N/A",
        state: d.state,
        timestamp: d.timestamp,
        description: `Driver state: ${d.state}`,
      }))
    );
  } catch (error) {
    console.error("Error fetching drowsiness data:", error.message);
    return NextResponse.json({ message: "Failed to fetch drowsiness data", error: error.message }, { status: 500 });
  }
}
