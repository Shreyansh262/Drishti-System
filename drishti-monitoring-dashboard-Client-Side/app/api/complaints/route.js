import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/drishti";

// POST /api/complaints — file a complaint about a feature.
export async function POST(req) {
  try {
    const body = await req.json();
    const { feature, complaint } = body;

    if (!feature || !complaint) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const doc = {
      id: `CMPLT${Date.now().toString().slice(-8)}`,
      feature,
      complaint,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    const db = await getDb();
    await db.collection(COLLECTIONS.complaints).insertOne(doc);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/complaints error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
