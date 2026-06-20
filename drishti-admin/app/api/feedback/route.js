import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS, extractVehicleNumber, extractRating } from "@/lib/drishti";

// GET /api/feedback — list feedback for the admin panel.
export async function GET() {
  try {
    const db = await getDb();
    const docs = await db.collection(COLLECTIONS.feedback).find({}).sort({ createdAt: -1 }).toArray();

    const feedbacks = docs.map((d) => {
      const category = d.type || d.category || "Feedback";
      const description = d.message || d.description || "";
      return {
        id: d.id,
        category,
        title: category,
        type: category,
        message: description,
        description,
        status: d.status || "Pending",
        rating: extractRating(description),
        vehicleNumber: extractVehicleNumber(description) || "N/A",
        date: d.createdAt || null,
        adminResponse: d.adminResponse || "",
      };
    });

    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedback data:", error.message);
    return NextResponse.json({ message: "Failed to fetch feedback data", error: error.message }, { status: 500 });
  }
}
