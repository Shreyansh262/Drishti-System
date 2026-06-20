import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/drishti";

function normalize(t) {
  return {
    id: t.id,
    vehicleNumber: t.vehicleNumber || "N/A",
    issueType: t.issueType || "",
    title: t.title || "",
    description: t.description || "",
    incidentDate: t.incidentDate || "",
    incidentTime: t.incidentTime || "",
    status: t.status || "pending",
    priority: t.priority || "low",
    createdAt: t.createdAt || null,
    updatedAt: t.updatedAt || null,
    adminResponse: t.adminResponse || "",
  };
}

// GET /api/tickets — list all tickets (admin view).
export async function GET() {
  try {
    const db = await getDb();
    const docs = await db.collection(COLLECTIONS.tickets).find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(docs.map(normalize));
  } catch (error) {
    console.error("Error fetching tickets:", error.message);
    return NextResponse.json({ message: "Failed to fetch tickets", error: error.message }, { status: 500 });
  }
}

// PUT /api/tickets?id=TKT... — update status / priority / adminResponse.
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("id");
    if (!ticketId) {
      return NextResponse.json({ message: "Ticket ID is required" }, { status: 400 });
    }

    const { status, priority, adminResponse } = await request.json();
    if ([status, priority, adminResponse].every((v) => v === undefined)) {
      return NextResponse.json({ message: "No update data provided" }, { status: 400 });
    }

    const update = { updatedAt: new Date().toISOString() };
    if (status !== undefined) update.status = status;
    if (priority !== undefined) update.priority = priority;
    if (adminResponse !== undefined) update.adminResponse = adminResponse;

    const db = await getDb();
    const result = await db.collection(COLLECTIONS.tickets).updateOne({ id: ticketId }, { $set: update });

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Ticket updated successfully" });
  } catch (error) {
    console.error("Error updating ticket:", error.message);
    return NextResponse.json({ message: "Failed to update ticket", error: error.message }, { status: 500 });
  }
}
