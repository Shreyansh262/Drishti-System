import { MongoClient } from "mongodb";

// Shared, cached MongoDB connection for Next.js.
// In dev, the client is cached on `global` so hot-reloads don't open a new
// connection on every request. In production (serverless) the module scope is
// reused across warm invocations, which keeps connection counts low.

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "drishti";

if (!uri) {
  // Don't throw at import time (it would crash the whole route on cold deploys
  // before env vars are set). We throw lazily inside getDb() instead.
  console.warn("[mongodb] MONGODB_URI is not set — DB calls will fail until configured.");
}

let clientPromise;

function getClientPromise() {
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set.");
  }

  if (process.env.NODE_ENV === "development") {
    // Reuse the connection across HMR reloads in dev.
    if (!global._drishtiMongoClientPromise) {
      const client = new MongoClient(uri);
      global._drishtiMongoClientPromise = client.connect();
    }
    return global._drishtiMongoClientPromise;
  }

  if (!clientPromise) {
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

/**
 * Returns the shared Db instance.
 */
export async function getDb() {
  const client = await getClientPromise();
  return client.db(dbName);
}

/**
 * Convenience helper to get a single collection.
 */
export async function getCollection(name) {
  const db = await getDb();
  return db.collection(name);
}
