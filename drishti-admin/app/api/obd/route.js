import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/drishti";

// GET /api/obd[?vehicleNumber=&startTime=&endTime=] — recent GPS/speed readings (array).
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
    const docs = await db.collection(COLLECTIONS.obd).find(filter).sort({ timestamp: -1 }).limit(50).toArray();

    return NextResponse.json(
      docs.map((d) => ({
        vehicleNumber: d.vehicleNumber || "N/A",
        Latitude: d.lat,
        Longitude: d.lng,
        Speed: d.speed,
        timestamp: d.timestamp,
        // The admin pages key OBD time off GPSTime/DeviceTime — alias them to the stored timestamp.
        GPSTime: d.timestamp,
        DeviceTime: d.timestamp,
        description: `Speed ${Math.round(Number(d.speed) || 0)} km/h @ (${d.lat}, ${d.lng})`,
      }))
    );
  } catch (error) {
    console.error("Error fetching OBD data:", error.message);
    return NextResponse.json({ message: "Failed to fetch OBD data", error: error.message }, { status: 500 });
  }
}
