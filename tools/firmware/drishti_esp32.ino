/*
 * Drishti — ESP32 reference firmware
 * -----------------------------------
 * Reference sketch showing how real hardware feeds the SAME pipeline the
 * simulator uses: read sensors, build a JSON payload, HTTP POST it to the
 * Drishti ingest API over WiFi.
 *
 * This is documentation/reference — wire up your own sensors and fill in the
 * read* helpers. The JSON shape must match what /api/ingest expects.
 *
 * Libraries (Arduino IDE → Library Manager):
 *   - ArduinoJson (by Benoit Blanchon)
 *   - WiFi + HTTPClient (bundled with the ESP32 board package)
 *
 * Hardware (example): MQ-3 alcohol sensor (analog), GPS module (UART),
 * camera/ML module for drowsiness + visibility scoring.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ---- Configuration (do NOT hardcode secrets in committed code) ----
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Your deployed client app, e.g. https://drishti.vercel.app/api/ingest
const char* INGEST_URL     = "https://YOUR_APP.vercel.app/api/ingest";
const char* INGEST_API_KEY = "YOUR_INGEST_API_KEY";   // must match server env
const char* VEHICLE_NUMBER = "HR20AP1234";

const unsigned long SEND_INTERVAL_MS = 5000;
unsigned long lastSend = 0;

// ---- Sensor pins (example) ----
const int MQ3_PIN = 34; // analog input for the MQ-3 alcohol sensor

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected: " + WiFi.localIP().toString());
}

// ---- Replace these stubs with real sensor reads ----
int   readAlcoholSensorValue() { return analogRead(MQ3_PIN); }     // 0..4095 on ESP32
int   readVisibilityScore()    { return 85;  /* from camera ML */ }
String readDriverState()       { return "Awake"; /* Awake | Drowsiness | Sleepiness */ }
float readLatitude()           { return 28.9931; /* from GPS */ }
float readLongitude()          { return 77.0151; /* from GPS */ }
int   readSpeedKmh()           { return 45;  /* from GPS/OBD */ }

void sendReading() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
  }

  // Build the JSON payload — same shape as the simulator / /api/ingest.
  StaticJsonDocument<512> doc;
  doc["vehicleNumber"] = VEHICLE_NUMBER;
  doc["location"]      = "NH-44, Sonipat";
  doc["alcohol"]["sensorValue"] = readAlcoholSensorValue();
  doc["visibility"]["score"]    = readVisibilityScore();
  doc["drowsiness"]["state"]    = readDriverState();
  JsonObject obd = doc.createNestedObject("obd");
  obd["lat"]   = readLatitude();
  obd["lng"]   = readLongitude();
  obd["speed"] = readSpeedKmh();

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.begin(INGEST_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-ingest-key", INGEST_API_KEY);

  int code = http.POST(body);
  Serial.printf("POST %s -> %d\n", INGEST_URL, code);
  if (code > 0) {
    Serial.println(http.getString());
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  connectWifi();
}

void loop() {
  unsigned long now = millis();
  if (now - lastSend >= SEND_INTERVAL_MS) {
    lastSend = now;
    sendReading();
  }
}
