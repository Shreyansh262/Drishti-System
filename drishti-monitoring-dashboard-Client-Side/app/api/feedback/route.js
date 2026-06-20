import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/drishti";

// POST /api/feedback — submit user feedback.
export async function POST(req) {
  try {
    const body = await req.json();
    const { type, message } = body;

    if (!type || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const doc = {
      id: `FDBK${Date.now().toString().slice(-8)}`,
      type,
      message,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    const db = await getDb();
    await db.collection(COLLECTIONS.feedback).insertOne(doc);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/feedback error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
