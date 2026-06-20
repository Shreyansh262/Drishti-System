import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/drishti";

// GET /api/alcohol[?vehicleNumber=&startTime=&endTime=] — recent alcohol readings (array).
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
    const docs = await db.collection(COLLECTIONS.alcohol).find(filter).sort({ timestamp: -1 }).limit(50).toArray();

    return NextResponse.json(
      docs.map((d) => ({
        vehicleNumber: d.vehicleNumber || "N/A",
        sensorValue: d.sensorValue,
        alcoholLevel: Number(d.sensorValue) || 0,
        timestamp: d.timestamp,
        description: `Alcohol sensor value ${d.sensorValue}`,
      }))
    );
  } catch (error) {
    console.error("Error fetching alcohol data:", error.message);
    return NextResponse.json({ message: "Failed to fetch alcohol data", error: error.message }, { status: 500 });
  }
}
