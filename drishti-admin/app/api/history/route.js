import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/drishti";

// GET /api/history[?vehicleNumber=&startTime=&endTime=]
// Returns an array of incident records (admin history + ticket views consume this).
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleNumber = searchParams.get("vehicleNumber");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    const filter = {};
    if (vehicleNumber) filter.vehicleNumber = vehicleNumber;
    if (startTime || endTime) {
      filter.datetime = {};
      if (startTime) filter.datetime.$gte = new Date(startTime);
      if (endTime) filter.datetime.$lte = new Date(endTime);
    }

    const db = await getDb();
    const docs = await db
      .collection(COLLECTIONS.incidents)
      .find(filter)
      .sort({ datetime: -1 })
      .limit(2000)
      .toArray();

    const records = docs.map((d) => ({
      id: d._id?.toString(),
      vehicleNumber: d.vehicleNumber || "N/A",
      datetime: d.datetime,
      fault_type: d.type || "",
      type: d.type || "",
      severity: d.severity || "",
      location: d.location || "",
      description: d.description || "",
    }));

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching history data:", error.message);
    return NextResponse.json({ message: "Failed to fetch history data", error: error.message }, { status: 500 });
  }
}
