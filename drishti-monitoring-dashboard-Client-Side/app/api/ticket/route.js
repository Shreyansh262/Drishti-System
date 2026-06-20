import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/drishti";

// GET /api/ticket — list tickets for the vehicle in the `x-vehicle-number` header.
export async function GET(req) {
  try {
    const vehicleNumber = req.headers.get("x-vehicle-number");
    if (!vehicleNumber) {
      return NextResponse.json({ error: "Missing vehicleNumber" }, { status: 400 });
    }

    const db = await getDb();
    const docs = await db
      .collection(COLLECTIONS.tickets)
      .find({ vehicleNumber })
      .sort({ createdAt: -1 })
      .toArray();

    const tickets = docs.map((t) => ({
      id: t.id,
      vehicleNumber: t.vehicleNumber,
      issueType: t.issueType,
      title: t.title,
      description: t.description,
      incidentDate: t.incidentDate,
      incidentTime: t.incidentTime,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt,
      adminResponse: t.adminResponse || null,
    }));

    return NextResponse.json({ tickets });
  } catch (err) {
    console.error("GET /ticket error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/ticket — create a new support ticket.
export async function POST(req) {
  try {
    const body = await req.json();
    const { vehicleNumber, issueType, title, description, date, time } = body;

    if (!vehicleNumber || !issueType || !title || !description || !date || !time) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const newTicket = {
      id: `TKT${Date.now().toString().slice(-8)}`,
      vehicleNumber,
      issueType,
      title,
      description,
      incidentDate: date,
      incidentTime: time,
      status: "pending",
      priority: "low",
      createdAt: new Date().toISOString(),
      adminResponse: "",
    };

    const db = await getDb();
    await db.collection(COLLECTIONS.tickets).insertOne(newTicket);

    return NextResponse.json({ success: true, ticket: newTicket });
  } catch (err) {
    console.error("POST /api/ticket error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
