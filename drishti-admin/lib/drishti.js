// Shared domain helpers for the Drishti admin app.
// Collection names must match the client app (same database).

export const COLLECTIONS = {
  alcohol: "alcohol",
  visibility: "visibility",
  drowsiness: "drowsiness",
  obd: "obd",
  incidents: "incidents",
  tickets: "tickets",
  complaints: "complaints",
  feedback: "feedback",
  vehicles: "vehicles",
};

/** Pull an Indian-format vehicle number out of free text, if present. */
export function extractVehicleNumber(text) {
  if (!text) return null;
  const patterns = [
    /[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}/g,
    /[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{1,4}/g,
  ];
  for (const pattern of patterns) {
    const match = String(text).toUpperCase().match(pattern);
    if (match) return match[0];
  }
  return null;
}

/** Pull a 1–5 rating out of free text, defaulting to 5. */
export function extractRating(text) {
  if (!text) return 5;
  const patterns = [/(\d+)\s*stars?/i, /rating[:\s]*(\d+)/i, /(\d+)\/5/i, /(\d+)\s*out\s*of\s*5/i];
  for (const pattern of patterns) {
    const match = String(text).match(pattern);
    if (match) {
      const rating = parseInt(match[1], 10);
      if (rating >= 1 && rating <= 5) return rating;
    }
  }
  return 5;
}
