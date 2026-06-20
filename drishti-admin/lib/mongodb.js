import { MongoClient } from "mongodb";

// Shared, cached MongoDB connection for Next.js (admin app).
// Connects to the SAME database as the client app so admin sees live data.

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "drishti";

if (!uri) {
  console.warn("[mongodb] MONGODB_URI is not set — DB calls will fail until configured.");
}

let clientPromise;

function getClientPromise() {
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set.");
  }

  if (process.env.NODE_ENV === "development") {
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

export async function getDb() {
  const client = await getClientPromise();
  return client.db(dbName);
}

export async function getCollection(name) {
  const db = await getDb();
  return db.collection(name);
}
