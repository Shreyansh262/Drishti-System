// Shared domain helpers for Drishti: collection names, timestamp formatting,
// and the rules that turn a raw sensor reading into a safety incident.

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

// Thresholds used both for the dashboard and for auto-creating incidents.
export const THRESHOLDS = {
  alcoholSensorValue: 200, // raw MQ-3 value above which alcohol is "detected"
  lowVisibilityScore: 40, // visibility % below which it's unsafe
  overspeedKmh: 80, // speed above which it's overspeeding
};

/**
 * Format a Date (stored as UTC in Mongo) into the string the frontend expects.
 * The UI strips the "+05:30" marker and parses the remaining ISO (UTC) value,
 * then renders it in Asia/Kolkata. Keeping this exact shape avoids touching the
 * existing dashboard parsing logic.
 */
export function toClientTimestamp(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString() + "+05:30";
}

/**
 * Given a normalized reading, return any incidents that should be logged.
 * Each returned object is ready to insert into the `incidents` collection.
 *
 * reading: { vehicleNumber, location, alcohol?, visibility?, drowsiness?, obd?, datetime }
 */
export function deriveIncidents(reading) {
  const incidents = [];
  const datetime = reading.datetime || new Date();
  const location = reading.location || "Unknown";
  const vehicleNumber = reading.vehicleNumber || "N/A";

  const push = (type, severity, description) =>
    incidents.push({ vehicleNumber, type, severity, location, description, datetime });

  if (reading.alcohol && Number(reading.alcohol.sensorValue) >= THRESHOLDS.alcoholSensorValue) {
    push("Alcohol Detected", "high", `Alcohol sensor reading ${reading.alcohol.sensorValue}`);
  }

  if (reading.drowsiness && reading.drowsiness.state) {
    const s = String(reading.drowsiness.state).toLowerCase();
    if (s.includes("sleep")) push("Sleepiness Alert", "high", "Driver appears to be sleeping");
    else if (s.includes("drows")) push("Drowsiness Alert", "medium", "Driver showing signs of drowsiness");
  }

  if (reading.visibility && Number(reading.visibility.score) < THRESHOLDS.lowVisibilityScore) {
    push("Low Visibility", "medium", `Front-camera visibility at ${Math.round(reading.visibility.score)}%`);
  }

  if (reading.obd && Number(reading.obd.speed) > THRESHOLDS.overspeedKmh) {
    push("Overspeeding", "medium", `Vehicle speed ${Math.round(reading.obd.speed)} km/h`);
  }

  return incidents;
}
