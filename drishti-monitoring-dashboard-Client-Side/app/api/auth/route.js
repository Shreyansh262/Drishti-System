import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/drishti";

// POST /api/auth — demo-grade login: validate a vehicle number against the
// `vehicles` collection (no passwords; this is a portfolio demo, not real auth).
export async function POST(req) {
  try {
    const { vehicleNumber } = await req.json();
    if (!vehicleNumber) {
      return NextResponse.json({ valid: false, error: "vehicleNumber is required" }, { status: 400 });
    }

    const normalized = String(vehicleNumber).toUpperCase().trim();
    const db = await getDb();
    const vehicle = await db.collection(COLLECTIONS.vehicles).findOne({ vehicleNumber: normalized });

    if (!vehicle) {
      return NextResponse.json({ valid: false, error: "Vehicle not registered" }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      vehicleNumber: vehicle.vehicleNumber,
      ownerName: vehicle.ownerName || null,
    });
  } catch (err) {
    console.error("POST /api/auth error:", err);
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 });
  }
}
