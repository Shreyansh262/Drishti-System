import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS, extractVehicleNumber } from "@/lib/drishti";

// GET /api/complaints — list complaints for the admin panel.
export async function GET() {
  try {
    const db = await getDb();
    const docs = await db.collection(COLLECTIONS.complaints).find({}).sort({ createdAt: -1 }).toArray();

    const complaints = docs.map((d) => {
      const category = d.feature || d.category || "Complaint";
      const description = d.complaint || d.description || "";
      return {
        id: d.id,
        category,
        title: category,
        description,
        status: d.status || "Pending",
        vehicleNumber: extractVehicleNumber(description) || "N/A",
        date: d.createdAt || null,
        adminResponse: d.adminResponse || "",
      };
    });

    return NextResponse.json(complaints);
  } catch (error) {
    console.error("Error fetching complaints data:", error.message);
    return NextResponse.json({ message: "Failed to fetch complaints data", error: error.message }, { status: 500 });
  }
}
