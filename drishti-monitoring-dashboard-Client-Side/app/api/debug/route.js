import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/drishti";

// GET /api/debug — health check for the database connection + collection counts.
// Handy for confirming env vars/connectivity on a fresh deploy.
export async function GET() {
  try {
    const db = await getDb();

    const counts = {};
    await Promise.all(
      Object.values(COLLECTIONS).map(async (name) => {
        counts[name] = await db.collection(name).countDocuments();
      })
    );

    const [latestAlcohol, latestObd] = await Promise.all([
      db.collection(COLLECTIONS.alcohol).findOne({}, { sort: { timestamp: -1 } }),
      db.collection(COLLECTIONS.obd).findOne({}, { sort: { timestamp: -1 } }),
    ]);

    return NextResponse.json({
      success: true,
      debug: {
        environment: process.env.NODE_ENV,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        currentTime: new Date().toISOString(),
        db: {
          connected: true,
          name: process.env.MONGODB_DB || "drishti",
          counts,
          latestAlcoholAt: latestAlcohol?.timestamp || null,
          latestObdAt: latestObd?.timestamp || null,
        },
      },
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        debug: {
          environment: process.env.NODE_ENV,
          currentTime: new Date().toISOString(),
          envVars: {
            MONGODB_URI: process.env.MONGODB_URI ? "SET" : "NOT SET",
            MONGODB_DB: process.env.MONGODB_DB ? "SET" : "NOT SET",
          },
        },
      },
      { status: 500 }
    );
  }
}
