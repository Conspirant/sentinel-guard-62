// Central dummy data. Swap these with API responses to go live with ESP32 hardware.

export type Severity = "normal" | "low" | "medium" | "high" | "critical";
export type LabStatus = "safe" | "warning" | "critical";

export interface SensorReading {
  key: string;
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  warn: number;
  critical: number;
  updatedAt: string;
  labCode?: string;
  deviceId?: string;
}

export interface Lab {
  id: string;
  name: string;
  code: string;
  location: string;
  status: LabStatus;
  devices: number;
  incidents: number;
  supervisor: string;
}

export const LABS: Lab[] = [
  { id: "chem-01", code: "CHM-01", name: "Chemistry Lab", location: "Block A · Floor 2", status: "warning", devices: 6, incidents: 2, supervisor: "Dr. R. Iyer" },
  { id: "phy-01", code: "PHY-01", name: "Physics Lab", location: "Block B · Floor 1", status: "safe", devices: 4, incidents: 0, supervisor: "Dr. K. Menon" },
  { id: "elx-01", code: "ELX-01", name: "Electronics Lab", location: "Block C · Floor 3", status: "safe", devices: 8, incidents: 1, supervisor: "Prof. S. Rao" },
  { id: "mec-01", code: "MEC-01", name: "Mechanical Workshop", location: "Block D · Ground", status: "critical", devices: 5, incidents: 3, supervisor: "Mr. J. Verma" },
  { id: "res-01", code: "RES-01", name: "Research Lab", location: "Block A · Floor 4", status: "safe", devices: 7, incidents: 0, supervisor: "Dr. A. Nair" },
];

export const LIVE_SENSORS: SensorReading[] = [
  { key: "mq2", label: "MQ2 · LPG / Smoke", unit: "ppm", value: 312, min: 0, max: 2000, warn: 400, critical: 800, updatedAt: nowISO() },
  { key: "mq135", label: "MQ135 · Air Quality", unit: "ppm", value: 128, min: 0, max: 1000, warn: 300, critical: 600, updatedAt: nowISO() },
  { key: "temp", label: "Temperature", unit: "°C", value: 27.4, min: -10, max: 80, warn: 35, critical: 45, updatedAt: nowISO() },
  { key: "humidity", label: "Humidity", unit: "%", value: 54, min: 0, max: 100, warn: 75, critical: 85, updatedAt: nowISO() },
  { key: "smoke", label: "Smoke Density", unit: "%", value: 4, min: 0, max: 100, warn: 20, critical: 40, updatedAt: nowISO() },
];

export const ACTUATORS = [
  { key: "relay", label: "Main Relay", state: "ON" as const },
  { key: "fan", label: "Exhaust Fan", state: "AUTO" as const },
  { key: "buzzer", label: "Buzzer", state: "OFF" as const },
];

export interface Incident {
  id: string;
  timestamp: string;
  lab: string;
  sensor: string;
  severity: Severity;
  status: "open" | "acknowledged" | "resolved";
  resolvedBy?: string;
  remarks: string;
}

export const INCIDENTS: Incident[] = [
  { id: "INC-1042", timestamp: "2026-07-25T09:14:00Z", lab: "Chemistry Lab", sensor: "MQ2", severity: "high", status: "acknowledged", resolvedBy: "R. Iyer", remarks: "LPG spike near fume hood 2" },
  { id: "INC-1041", timestamp: "2026-07-25T08:02:00Z", lab: "Mechanical Workshop", sensor: "Temperature", severity: "critical", status: "open", remarks: "Grinder overheating > 52°C" },
  { id: "INC-1040", timestamp: "2026-07-24T22:37:00Z", lab: "Electronics Lab", sensor: "Smoke", severity: "medium", status: "resolved", resolvedBy: "S. Rao", remarks: "Soldering iron left on" },
  { id: "INC-1039", timestamp: "2026-07-24T15:11:00Z", lab: "Chemistry Lab", sensor: "MQ135", severity: "low", status: "resolved", resolvedBy: "R. Iyer", remarks: "Ventilation cycle short" },
  { id: "INC-1038", timestamp: "2026-07-23T11:48:00Z", lab: "Physics Lab", sensor: "Humidity", severity: "low", status: "resolved", resolvedBy: "K. Menon", remarks: "AC condensation" },
  { id: "INC-1037", timestamp: "2026-07-22T17:20:00Z", lab: "Mechanical Workshop", sensor: "MQ2", severity: "high", status: "resolved", resolvedBy: "J. Verma", remarks: "Welding gas residual" },
];

export interface Chemical {
  id: string;
  name: string;
  cabinet: string;
  quantity: string;
  expiry: string;
  safetyClass: string;
  hazard: string;
  msds: string;
}

export const CHEMICALS: Chemical[] = [
  { id: "CHM-A101", name: "Sulfuric Acid 98%", cabinet: "A-1", quantity: "2.5 L", expiry: "2027-03-14", safetyClass: "Class 8 · Corrosive", hazard: "Corrosive", msds: "#" },
  { id: "CHM-A102", name: "Sodium Hydroxide", cabinet: "A-2", quantity: "1 kg", expiry: "2026-11-02", safetyClass: "Class 8 · Corrosive", hazard: "Corrosive", msds: "#" },
  { id: "CHM-B201", name: "Acetone", cabinet: "B-1", quantity: "5 L", expiry: "2026-09-10", safetyClass: "Class 3 · Flammable", hazard: "Flammable", msds: "#" },
  { id: "CHM-B202", name: "Ethanol Absolute", cabinet: "B-1", quantity: "10 L", expiry: "2026-08-01", safetyClass: "Class 3 · Flammable", hazard: "Flammable", msds: "#" },
  { id: "CHM-C301", name: "Methanol", cabinet: "C-2", quantity: "2 L", expiry: "2026-07-30", safetyClass: "Class 6 · Toxic", hazard: "Toxic", msds: "#" },
  { id: "CHM-C302", name: "Hydrogen Peroxide 30%", cabinet: "C-3", quantity: "500 mL", expiry: "2028-01-20", safetyClass: "Class 5 · Oxidizer", hazard: "Oxidizer", msds: "#" },
];

export interface Equipment {
  id: string;
  name: string;
  lab: string;
  purchased: string;
  warranty: string;
  calibration: string;
  nextMaintenance: string;
  status: "operational" | "service_due" | "out_of_service";
}

export const EQUIPMENT: Equipment[] = [
  { id: "EQ-2201", name: "Fume Hood #2", lab: "Chemistry Lab", purchased: "2022-06-01", warranty: "2027-06-01", calibration: "2026-04-11", nextMaintenance: "2026-08-15", status: "operational" },
  { id: "EQ-2202", name: "Autoclave 25L", lab: "Research Lab", purchased: "2021-01-14", warranty: "2026-01-14", calibration: "2026-05-22", nextMaintenance: "2026-07-28", status: "service_due" },
  { id: "EQ-2203", name: "Oscilloscope DSO-X", lab: "Electronics Lab", purchased: "2023-09-19", warranty: "2028-09-19", calibration: "2026-06-30", nextMaintenance: "2026-12-30", status: "operational" },
  { id: "EQ-2204", name: "Bench Grinder BG-8", lab: "Mechanical Workshop", purchased: "2020-03-12", warranty: "2025-03-12", calibration: "2026-02-04", nextMaintenance: "2026-07-26", status: "out_of_service" },
  { id: "EQ-2205", name: "Spectrophotometer UV-2600", lab: "Chemistry Lab", purchased: "2024-02-27", warranty: "2029-02-27", calibration: "2026-07-01", nextMaintenance: "2026-10-01", status: "operational" },
];

export interface Device {
  id: string;
  mac: string;
  lab: string;
  firmware: string;
  wifi: "connected" | "unstable" | "offline";
  battery: number;
  rssi: number;
  lastSeen: string;
}

export const DEVICES: Device[] = [
  { id: "ESP32-CHM-01", mac: "24:6F:28:AA:14:22", lab: "Chemistry Lab", firmware: "1.4.2", wifi: "connected", battery: 92, rssi: -54, lastSeen: nowISO() },
  { id: "ESP32-CHM-02", mac: "24:6F:28:AA:14:23", lab: "Chemistry Lab", firmware: "1.4.2", wifi: "unstable", battery: 71, rssi: -74, lastSeen: nowISO(-120) },
  { id: "ESP32-PHY-01", mac: "24:6F:28:BB:04:11", lab: "Physics Lab", firmware: "1.4.1", wifi: "connected", battery: 88, rssi: -59, lastSeen: nowISO(-15) },
  { id: "ESP32-ELX-01", mac: "24:6F:28:CC:22:9A", lab: "Electronics Lab", firmware: "1.4.2", wifi: "connected", battery: 100, rssi: -48, lastSeen: nowISO(-5) },
  { id: "ESP32-MEC-01", mac: "24:6F:28:DD:31:07", lab: "Mechanical Workshop", firmware: "1.3.9", wifi: "offline", battery: 12, rssi: -95, lastSeen: nowISO(-3600) },
  { id: "ESP32-RES-01", mac: "24:6F:28:EE:41:55", lab: "Research Lab", firmware: "1.4.2", wifi: "connected", battery: 84, rssi: -61, lastSeen: nowISO(-8) },
];

export interface Calibration {
  id: string;
  sensor: string;
  device: string;
  lastCalibrated: string;
  nextDue: string;
  technician: string;
  status: "valid" | "due_soon" | "overdue";
}

export const CALIBRATIONS: Calibration[] = [
  { id: "CAL-9001", sensor: "MQ2", device: "ESP32-CHM-01", lastCalibrated: "2026-04-10", nextDue: "2026-10-10", technician: "N. Kapoor", status: "valid" },
  { id: "CAL-9002", sensor: "MQ135", device: "ESP32-CHM-01", lastCalibrated: "2026-03-22", nextDue: "2026-09-22", technician: "N. Kapoor", status: "due_soon" },
  { id: "CAL-9003", sensor: "DHT22", device: "ESP32-PHY-01", lastCalibrated: "2026-01-05", nextDue: "2026-07-05", technician: "L. Fernandes", status: "overdue" },
  { id: "CAL-9004", sensor: "MQ2", device: "ESP32-MEC-01", lastCalibrated: "2025-12-01", nextDue: "2026-06-01", technician: "L. Fernandes", status: "overdue" },
  { id: "CAL-9005", sensor: "MQ135", device: "ESP32-ELX-01", lastCalibrated: "2026-05-18", nextDue: "2026-11-18", technician: "N. Kapoor", status: "valid" },
];

export const TREND_24H = Array.from({ length: 24 }, (_, i) => {
  const base = 20 + Math.sin(i / 3) * 6 + (i > 14 && i < 18 ? 8 : 0);
  const mq2 = 200 + Math.max(0, Math.sin(i / 2.4) * 220) + (i === 9 ? 380 : 0);
  const mq135 = 90 + Math.abs(Math.sin(i / 4) * 90);
  return {
    hour: `${String(i).padStart(2, "0")}:00`,
    temperature: Number(base.toFixed(1)),
    mq2: Math.round(mq2),
    mq135: Math.round(mq135),
    humidity: Math.round(45 + Math.cos(i / 5) * 12),
  };
});

export const INCIDENT_WEEK = [
  { day: "Mon", low: 3, medium: 1, high: 0, critical: 0 },
  { day: "Tue", low: 2, medium: 2, high: 1, critical: 0 },
  { day: "Wed", low: 4, medium: 1, high: 0, critical: 0 },
  { day: "Thu", low: 1, medium: 3, high: 1, critical: 1 },
  { day: "Fri", low: 5, medium: 2, high: 2, critical: 0 },
  { day: "Sat", low: 1, medium: 0, high: 0, critical: 0 },
  { day: "Sun", low: 0, medium: 1, high: 0, critical: 0 },
];

export const HAZARD_GUIDANCE: Record<string, {
  hazard: string;
  severity: Severity;
  immediate: string[];
  ppe: string[];
  precautions: string[];
  sop: string[];
  contacts: { name: string; phone: string }[];
}> = {
  mq2: {
    hazard: "LPG / Combustible Gas Leak",
    severity: "high",
    immediate: [
      "Activate exhaust fan and open ventilation dampers",
      "Evacuate all personnel from the affected zone",
      "Shut off gas supply at main valve",
      "Do NOT operate electrical switches",
      "Notify the laboratory supervisor immediately",
    ],
    ppe: ["Full-face respirator", "Anti-static gloves", "Flame-retardant lab coat", "Safety goggles"],
    precautions: [
      "No open flames or sparks within 15m radius",
      "Keep ignition sources isolated",
      "Verify gas cylinder regulators for leaks",
    ],
    sop: [
      "Log incident in Sentinel-G with severity and timestamp",
      "Perform gas-detector sweep post evacuation",
      "Re-entry only after MQ2 reading < 200 ppm for 10 minutes",
    ],
    contacts: [
      { name: "Lab Supervisor", phone: "+91 98450 00001" },
      { name: "Campus Safety", phone: "+91 98450 00099" },
      { name: "Fire Services", phone: "101" },
    ],
  },
  mq135: {
    hazard: "Poor Air Quality / VOC Exposure",
    severity: "medium",
    immediate: [
      "Increase ventilation rate",
      "Identify and cap open solvent containers",
      "Move personnel to fresh air",
    ],
    ppe: ["N95/P2 respirator", "Nitrile gloves", "Safety goggles"],
    precautions: ["Restrict solvent use to fume hood", "Inspect HVAC filters"],
    sop: ["Log reading trend", "Trigger extended ventilation cycle", "Report to supervisor if > 500 ppm sustained"],
    contacts: [
      { name: "Lab Supervisor", phone: "+91 98450 00001" },
      { name: "Facilities", phone: "+91 98450 00042" },
    ],
  },
  temp: {
    hazard: "Thermal Runaway / Overheat",
    severity: "critical",
    immediate: [
      "Cut power to affected equipment via relay",
      "Do not use water on electrical fires",
      "Deploy CO₂ extinguisher if flames observed",
      "Evacuate and seal the room",
    ],
    ppe: ["Heat-resistant gloves", "Face shield", "Flame-retardant coat"],
    precautions: ["Avoid re-energizing until inspected", "Isolate combustibles"],
    sop: ["Trigger emergency shutdown sequence", "Notify Fire Services", "Preserve incident evidence for audit"],
    contacts: [
      { name: "Fire Services", phone: "101" },
      { name: "Campus Safety", phone: "+91 98450 00099" },
    ],
  },
  smoke: {
    hazard: "Smoke Detected",
    severity: "high",
    immediate: ["Trigger fire alarm", "Evacuate via nearest exit", "Close fire doors"],
    ppe: ["Smoke hood", "Damp cloth over mouth if hood unavailable"],
    precautions: ["Do not use elevators", "Assemble at muster point"],
    sop: ["Account for all occupants", "Await fire marshal clearance"],
    contacts: [{ name: "Fire Services", phone: "101" }],
  },
  humidity: {
    hazard: "Humidity Threshold Exceeded",
    severity: "low",
    immediate: ["Enable dehumidifier", "Check for condensation on instruments"],
    ppe: ["Standard PPE"],
    precautions: ["Protect sensitive electronics", "Log affected instruments"],
    sop: ["Verify HVAC cycle", "Re-inspect after 30 minutes"],
    contacts: [{ name: "Facilities", phone: "+91 98450 00042" }],
  },
};

function nowISO(offsetSec = 0) {
  return new Date(Date.now() - offsetSec * 1000).toISOString();
}

export function severityColor(s: Severity): string {
  switch (s) {
    case "normal": return "success";
    case "low": return "info";
    case "medium": return "warning";
    case "high": return "warning";
    case "critical": return "critical";
  }
}

export function sensorSeverity(r: SensorReading): Severity {
  if (r.value >= r.critical) return "critical";
  if (r.value >= r.warn) return "medium";
  return "normal";
}
