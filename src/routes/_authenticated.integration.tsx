import { createFileRoute } from "@tanstack/react-router";
import { Plug, Wifi, Radio, Cpu, ShieldCheck, Terminal, ArrowRight, Boxes, KeyRound, Cable, Database, ExternalLink } from "lucide-react";
import { PageHeader, StatusDot } from "@/components/PageHeader";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_PROJECT_ID } from "@/lib/supabase";

export const Route = createFileRoute("/_authenticated/integration")({
  head: () => ({
    meta: [
      { title: "Hardware & Supabase Integration · SENTINEL-G" },
      { name: "description", content: "Developer guide for wiring ESP32 field devices directly to Supabase REST and Realtime on project ywvgwnevbaenqyygbirr." },
      { property: "og:title", content: "Hardware & Supabase Integration · SENTINEL-G" },
      { property: "og:description", content: "Wire ESP32, Supabase REST API and Realtime telemetry to SENTINEL-G." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntegrationPage,
});

const ESP32_SUPABASE_CODE = `#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "DHT.h"

// ==========================================
// WIFI & SUPABASE CONFIGURATION
// ==========================================
const char* WIFI_SSID       = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD   = "YOUR_WIFI_PASSWORD";

const char* SB_URL          = "${SUPABASE_URL}";
const char* SB_KEY          = "${SUPABASE_ANON_KEY}";
const char* DEVICE_ID       = "ESP32-PHY-01";   // Unique per hardware node
const char* LAB_CODE        = "PHY-01";          // Must match a lab in dashboard

// ==========================================
// PIN CONFIGURATION (matches hardware wiring)
// ==========================================
#define DHTPIN       4        // Digital pin → DHT22
#define DHTTYPE      DHT22

#define MQ2_PIN      34       // Analog pin → MQ-2 (AO)
#define MQ135_PIN    35       // Analog pin → MQ-135 (AO)

#define LED_GREEN    18       // Green LED
#define LED_YELLOW   19       // Yellow LED
#define LED_RED      21       // Red LED

#define BUZZER_PIN   25       // Active Buzzer
#define RELAY_PIN    23       // Relay module control

DHT dht(DHTPIN, DHTTYPE);

// ==========================================
// THRESHOLD VALUES (ESP32 ADC: 0–4095)
// ==========================================
const int MQ2_WARNING_THRESHOLD   = 1200;
const int MQ2_DANGER_THRESHOLD    = 2200;
const int MQ135_WARNING_THRESHOLD = 1200;
const int MQ135_DANGER_THRESHOLD  = 2200;

const float TEMP_WARNING  = 40.0;   // °C
const float TEMP_DANGER   = 50.0;
const float HUM_WARNING   = 70.0;   // %
const float HUM_DANGER    = 85.0;

// ==========================================
// SUPABASE TELEMETRY – POST one sensor row
// ==========================================
void postReading(const char* key, const char* label,
                 const char* unit, float value,
                 float mn, float mx, float wrn, float crit) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String endpoint = String(SB_URL) + "/rest/v1/sensor_readings";
  http.begin(endpoint);
  http.addHeader("Content-Type",  "application/json");
  http.addHeader("apikey",        SB_KEY);
  http.addHeader("Authorization", "Bearer " + String(SB_KEY));
  http.addHeader("Prefer",        "return=minimal");

  StaticJsonDocument<384> doc;
  doc["device_id"]  = DEVICE_ID;
  doc["lab_code"]   = LAB_CODE;
  doc["sensor_key"] = key;
  doc["label"]      = label;
  doc["unit"]       = unit;
  doc["value"]      = value;
  doc["min"]        = mn;
  doc["max"]        = mx;
  doc["warn"]       = wrn;
  doc["critical"]   = crit;

  String payload;
  serializeJson(doc, payload);
  int code = http.POST(payload);
  Serial.printf("[SB] %s → HTTP %d\\n", key, code);
  http.end();
}

// ==========================================
// LOCAL ACTUATOR CONTROL
// ==========================================
enum SafetyLevel { SAFE, WARNING, DANGER };

void setIndicators(SafetyLevel level) {
  switch (level) {
    case SAFE:
      digitalWrite(LED_GREEN, HIGH);
      digitalWrite(LED_YELLOW, LOW);
      digitalWrite(LED_RED, LOW);
      noTone(BUZZER_PIN);
      digitalWrite(RELAY_PIN, LOW);  // Relay off
      break;
    case WARNING:
      digitalWrite(LED_GREEN, LOW);
      digitalWrite(LED_YELLOW, HIGH);
      digitalWrite(LED_RED, LOW);
      tone(BUZZER_PIN, 1000, 200);   // Short beep
      digitalWrite(RELAY_PIN, LOW);
      break;
    case DANGER:
      digitalWrite(LED_GREEN, LOW);
      digitalWrite(LED_YELLOW, LOW);
      digitalWrite(LED_RED, HIGH);
      tone(BUZZER_PIN, 2000);        // Continuous alarm
      digitalWrite(RELAY_PIN, HIGH); // Activate relay (e.g. exhaust fan)
      break;
  }
}

SafetyLevel getOverallLevel(int mq2, int mq135, float t, float h) {
  if (mq2 > MQ2_DANGER_THRESHOLD   || mq135 > MQ135_DANGER_THRESHOLD ||
      t   > TEMP_DANGER             || h     > HUM_DANGER)
    return DANGER;
  if (mq2 > MQ2_WARNING_THRESHOLD  || mq135 > MQ135_WARNING_THRESHOLD ||
      t   > TEMP_WARNING            || h     > HUM_WARNING)
    return WARNING;
  return SAFE;
}

// ==========================================
// SETUP
// ==========================================
void setup() {
  Serial.begin(115200);

  // LED & actuator pins
  pinMode(LED_GREEN,  OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED,    OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RELAY_PIN,  OUTPUT);

  dht.begin();

  // Connect WiFi
  Serial.print("[SENTINEL-G] Connecting WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println(" Connected!");
  Serial.println("[SENTINEL-G] IP: " + WiFi.localIP().toString());
  setIndicators(SAFE);
}

// ==========================================
// MAIN LOOP – read, act locally, post to Supabase
// ==========================================
void loop() {
  // 1. Read sensors
  int   mq2Val   = analogRead(MQ2_PIN);
  int   mq135Val = analogRead(MQ135_PIN);
  float temp     = dht.readTemperature();
  float hum      = dht.readHumidity();

  if (isnan(temp)) temp = 0;
  if (isnan(hum))  hum  = 0;

  // 2. Local safety response (LEDs, buzzer, relay)
  SafetyLevel level = getOverallLevel(mq2Val, mq135Val, temp, hum);
  setIndicators(level);

  // 3. Print to serial monitor
  Serial.printf("MQ2=%d  MQ135=%d  Temp=%.1f°C  Hum=%.1f%%  Level=%s\\n",
    mq2Val, mq135Val, temp, hum,
    level == DANGER ? "DANGER" : level == WARNING ? "WARNING" : "SAFE");

  // 4. Post all four readings to Supabase
  postReading("mq2",         "MQ-2 Gas/Smoke",  "raw",  mq2Val,   0, 4095, MQ2_WARNING_THRESHOLD,   MQ2_DANGER_THRESHOLD);
  postReading("mq135",       "MQ-135 Air Quality","raw", mq135Val, 0, 4095, MQ135_WARNING_THRESHOLD, MQ135_DANGER_THRESHOLD);
  postReading("temperature", "DHT22 Temperature","°C",   temp,     0, 60,   TEMP_WARNING,            TEMP_DANGER);
  postReading("humidity",    "DHT22 Humidity",   "%",    hum,      0, 100,  HUM_WARNING,             HUM_DANGER);

  delay(2000);  // Post every 2 seconds
}`;

const REST_EXAMPLE = `# Direct Supabase REST Ingest from ESP32 / Gateway / cURL
curl -X POST "${SUPABASE_URL}/rest/v1/sensor_readings" \\
  -H "apikey: ${SUPABASE_ANON_KEY}" \\
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=minimal" \\
  -d '{
    "device_id": "ESP32-PHY-01",
    "lab_code": "PHY-01",
    "sensor_key": "mq2",
    "label": "MQ-2 Gas/Smoke",
    "unit": "raw",
    "value": 850,
    "min": 0, "max": 4095, "warn": 1200, "critical": 2200
  }'`;

const WS_EXAMPLE = `// Supabase Realtime WebSocket feed
import { createClient } from "@supabase/supabase-js";

const supabase = createClient("${SUPABASE_URL}", "${SUPABASE_ANON_KEY}");

const channel = supabase
  .channel("realtime-telemetry")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "sensor_readings" }, (payload) => {
    console.log("Live Telemetry Event:", payload.new);
  })
  .subscribe();`;

const ENDPOINTS = [
  { topic: "/rest/v1/sensor_readings", direction: "device → Supabase", desc: "Post live sensor measurements directly to database" },
  { topic: "/rest/v1/incidents", direction: "device → Supabase", desc: "Report automatic threshold breach / panic button events" },
  { topic: "/realtime/v1/websocket", direction: "Supabase → clients", desc: "Broadcast live telemetry to dashboard web sockets" },
  { topic: "/auth/v1", direction: "device ↔ Supabase", desc: "Device authentication and JWT token issuance" },
];

const STEPS = [
  { n: "01", title: "Supabase Project", body: `Connected to project ${SUPABASE_PROJECT_ID}. Database tables (labs, devices, sensor_readings, incidents) ready.` },
  { n: "02", title: "Provision ESP32", body: "Flash merged firmware with WiFi, Supabase creds, and pin config. Hardware controls LEDs, buzzer & relay locally while posting to cloud." },
  { n: "03", title: "Post Telemetry", body: "Firmware posts MQ-2, MQ-135, Temperature & Humidity to /rest/v1/sensor_readings every 2s. Supabase validates & stores." },
  { n: "04", title: "Realtime Broadcast", body: "Dashboard subscribes to Supabase Realtime channels. Zero polling needed; sub-second end-to-end latency." },
];

function IntegrationPage() {
  return (
    <div>
      <PageHeader
        title="Hardware & Supabase Integration"
        description="Wire ESP32 field hardware directly to Supabase REST and Realtime services in under 10 minutes."
        meta={
          <div className="flex flex-wrap items-center gap-3 text-mono text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><StatusDot tone="success" /> Supabase · Live</span>
            <span>·</span>
            <span>Project: {SUPABASE_PROJECT_ID}</span>
            <span>·</span>
            <span>Protocols: Supabase REST · WebSockets · MQTT Bridge</span>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Active Supabase Connection Info Box */}
        <div className="rounded-sm border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-500 text-white shrink-0">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Active Supabase Backend</h3>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-medium">
                  CONNECTED
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                URL: <code className="font-mono text-primary font-medium">{SUPABASE_URL}</code>
              </p>
            </div>
          </div>
          <a
            href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline bg-card border border-border px-3 py-1.5 rounded-sm shrink-0"
          >
            Open Supabase Dashboard <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Quickstart steps */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-sm border border-border bg-card p-4">
              <div className="text-mono text-[10px] uppercase tracking-widest text-primary">Step {s.n}</div>
              <div className="mt-1 text-sm font-semibold">{s.title}</div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Wiring diagram / pinout */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-sm border border-border bg-card p-4 lg:col-span-1">
            <div className="flex items-center gap-2">
              <Cable className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">Reference wiring · ESP32-DevKit v1</div>
            </div>
            <table className="mt-3 w-full text-mono text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="pb-1.5 font-medium">Component</th>
                  <th className="pb-1.5 font-medium">Pin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><td className="py-1.5">MQ-2 (Gas / Smoke) AO</td><td className="py-1.5">GPIO 34</td></tr>
                <tr><td className="py-1.5">MQ-135 (Air Quality) AO</td><td className="py-1.5">GPIO 35</td></tr>
                <tr><td className="py-1.5">DHT22 · Data</td><td className="py-1.5">GPIO 4</td></tr>
                <tr><td className="py-1.5">LED Green (Safe)</td><td className="py-1.5">GPIO 18</td></tr>
                <tr><td className="py-1.5">LED Yellow (Warning)</td><td className="py-1.5">GPIO 19</td></tr>
                <tr><td className="py-1.5">LED Red (Danger)</td><td className="py-1.5">GPIO 21</td></tr>
                <tr><td className="py-1.5">Buzzer (Active)</td><td className="py-1.5">GPIO 25</td></tr>
                <tr><td className="py-1.5">Relay Module</td><td className="py-1.5">GPIO 23</td></tr>
                <tr><td className="py-1.5">Power</td><td className="py-1.5">5V · GND</td></tr>
              </tbody>
            </table>
            <div className="mt-3 rounded-sm border border-border bg-muted/40 p-2 text-[10px] leading-relaxed text-muted-foreground">
              Warm-up MQ-series sensors for ≥ 24 hours before first calibration.
              Keep analog lines &lt; 30 cm and away from mains wiring.
            </div>
          </div>

          <div className="rounded-sm border border-border bg-card p-4 lg:col-span-2">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">Supabase Endpoint Map</div>
            </div>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 font-medium">Endpoint</th>
                  <th className="pb-2 font-medium">Direction</th>
                  <th className="pb-2 font-medium">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {ENDPOINTS.map((t) => (
                  <tr key={t.topic} className="border-t border-border">
                    <td className="py-2 text-mono text-xs">{t.topic}</td>
                    <td className="py-2 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><ArrowRight className="h-3 w-3" />{t.direction}</span>
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">{t.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3 text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <div>REST URL <span className="block text-foreground normal-case tracking-normal truncate">{SUPABASE_URL}/rest/v1</span></div>
              <div>Realtime WS <span className="block text-foreground normal-case tracking-normal truncate">wss://{SUPABASE_PROJECT_ID}.supabase.co/realtime/v1</span></div>
              <div>Auth Token <span className="block text-foreground normal-case tracking-normal truncate">Bearer Anon Key</span></div>
            </div>
          </div>
        </div>

        {/* Code samples */}
        <CodeBlock title="1. ESP32 Supabase C++ Firmware · Arduino" icon={Cpu} code={ESP32_SUPABASE_CODE} lang="cpp" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <CodeBlock title="2. Direct Supabase REST Ingest" icon={Terminal} code={REST_EXAMPLE} lang="bash" />
          <CodeBlock title="3. Supabase Realtime Consumer" icon={Wifi} code={WS_EXAMPLE} lang="ts" />
        </div>

        {/* Security & Envelope */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" />
              <div className="text-sm font-semibold">Security &amp; RLS Policies</div>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li className="flex gap-2"><KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> API Key Authentication via HTTP header <code className="text-mono">apikey: {SUPABASE_ANON_KEY.slice(0, 15)}...</code>.</li>
              <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> Row Level Security (RLS) enabled on all tables in Supabase Postgres.</li>
              <li className="flex gap-2"><Plug className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> HTTPS TLS 1.3 encryption on all REST and WebSocket connections.</li>
              <li className="flex gap-2"><Boxes className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> SQL Schema file <code className="text-mono">supabase_schema.sql</code> provided in project root.</li>
            </ul>
          </div>

          <div className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">Canonical Sensor Ingest Envelope</div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Post JSON records directly to <code className="text-mono">/rest/v1/sensor_readings</code>. Supabase validates
              the payload against column types and broadcasts events to Realtime subscribers.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-sm border border-border bg-muted/40 p-3 text-mono text-[11px] leading-relaxed">
{`{
  "device_id":  "ESP32-PHY-01",
  "lab_code":   "PHY-01",
  "sensor_key": "mq2",
  "label":      "MQ-2 Gas/Smoke",
  "unit":       "raw",
  "value":      850,
  "min":        0,
  "max":        4095,
  "warn":       1200,
  "critical":   2200
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({
  title,
  code,
  lang,
  icon: Icon,
}: {
  title: string;
  code: string;
  lang: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-primary" />
          <div className="text-xs font-semibold">{title}</div>
        </div>
        <div className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">{lang}</div>
      </div>
      <pre className="max-h-[420px] overflow-auto p-4 text-mono text-[11px] leading-relaxed">
        {code}
      </pre>
    </div>
  );
}
