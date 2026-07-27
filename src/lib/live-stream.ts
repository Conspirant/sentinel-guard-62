// Pure Supabase Realtime Telemetry & Stream (Zero Mock Generators)
import { useEffect, useState } from "react";
import { type SensorReading, type Severity } from "./mock-data";
import { supabase } from "./supabase";

export type LiveStatus = "connecting" | "open" | "closed";

export type HazardEvent = {
  id: string;
  sensor: string;
  sensorKey: string;
  lab: string;
  severity: Severity;
  message: string;
  value: number;
  unit: string;
  at: string;
};

export type LiveEvent =
  | { type: "sensor"; readings: SensorReading[]; at: string }
  | ({ type: "hazard" } & HazardEvent);

type Listener = (e: LiveEvent) => void;

// Sensor templates matching ESP32 firmware exact keys & ranges
const DEFAULT_SENSOR_TEMPLATES: SensorReading[] = [
  { key: "mq2", label: "MQ-2 Gas / Smoke", unit: "raw", value: 0, min: 0, max: 4095, warn: 1200, critical: 2200, updatedAt: "" },
  { key: "mq135", label: "MQ-135 Air Quality", unit: "raw", value: 0, min: 0, max: 4095, warn: 1200, critical: 2200, updatedAt: "" },
  { key: "temperature", label: "DHT22 Temperature", unit: "°C", value: 0, min: 0, max: 60, warn: 40, critical: 50, updatedAt: "" },
  { key: "humidity", label: "DHT22 Humidity", unit: "%", value: 0, min: 0, max: 100, warn: 70, critical: 85, updatedAt: "" },
];

class RealtimeTelemetryStream {
  private listeners = new Set<Listener>();
  private readings: SensorReading[] = [...DEFAULT_SENSOR_TEMPLATES];
  private realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
  status: LiveStatus = "connecting";

  private async fetchInitialReadings() {
    try {
      const { data, error } = await supabase
        .from("sensor_readings")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const latestByKey = new Map<string, Record<string, unknown>>();
        for (const row of data) {
          const k = String(row.sensor_key).toLowerCase();
          if (!latestByKey.has(k)) {
            latestByKey.set(k, row);
          }
        }

        const keysPresent = new Set([...latestByKey.keys()]);
        const customRows: SensorReading[] = [];

        // Build list of readings from Supabase
        for (const [k, row] of latestByKey.entries()) {
          const tmpl = DEFAULT_SENSOR_TEMPLATES.find((t) => t.key === k);
          customRows.push({
            key: k,
            label: (row.label as string) || tmpl?.label || k.toUpperCase(),
            unit: (row.unit as string) || tmpl?.unit || "",
            value: Number(row.value ?? 0),
            min: Number(row.min ?? tmpl?.min ?? 0),
            max: Number(row.max ?? tmpl?.max ?? 4095),
            warn: Number(row.warn ?? tmpl?.warn ?? 1200),
            critical: Number(row.critical ?? tmpl?.critical ?? 2200),
            updatedAt: (row.updated_at as string) || new Date().toISOString(),
            labCode: (row.lab_code as string) || undefined,
            deviceId: (row.device_id as string) || undefined,
          });
        }

        // Add default templates for missing keys
        for (const tmpl of DEFAULT_SENSOR_TEMPLATES) {
          if (!keysPresent.has(tmpl.key)) {
            customRows.push(tmpl);
          }
        }

        this.readings = customRows;
        this.emit({ type: "sensor", readings: this.readings, at: new Date().toISOString() });
      }
    } catch (err) {
      console.warn("Error fetching initial sensor readings from Supabase:", err);
    }
  }

  private start() {
    this.status = "connecting";
    this.fetchInitialReadings();

    // Attach Pure Supabase Realtime Channel
    try {
      this.realtimeChannel = supabase
        .channel("sentinel-realtime-telemetry")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "sensor_readings" },
          (payload) => {
            const newRow = payload.new as Record<string, unknown>;
            if (newRow && typeof newRow.sensor_key === "string") {
              const key = newRow.sensor_key.toLowerCase();
              const existingIdx = this.readings.findIndex((r) => r.key === key);
              const updatedItem: SensorReading = {
                key,
                label: (newRow.label as string) || key,
                unit: (newRow.unit as string) || "",
                value: Number(newRow.value),
                min: Number(newRow.min ?? 0),
                max: Number(newRow.max ?? 4095),
                warn: Number(newRow.warn ?? 1200),
                critical: Number(newRow.critical ?? 2200),
                updatedAt: (newRow.updated_at as string) || new Date().toISOString(),
                labCode: (newRow.lab_code as string) || undefined,
                deviceId: (newRow.device_id as string) || undefined,
              };

              if (existingIdx >= 0) {
                this.readings[existingIdx] = updatedItem;
              } else {
                this.readings.push(updatedItem);
              }

              this.emit({ type: "sensor", readings: [...this.readings], at: new Date().toISOString() });
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "incidents" },
          (payload) => {
            const inc = payload.new as Record<string, unknown>;
            if (inc) {
              this.emit({
                type: "hazard",
                id: (inc.id as string) || "INC-REALTIME",
                sensor: (inc.sensor as string) || "MQ2",
                sensorKey: ((inc.sensor as string) || "mq2").toLowerCase(),
                lab: (inc.lab as string) || "Physics Lab",
                severity: (inc.severity as Severity) || "high",
                message: (inc.remarks as string) || "Realtime incident detected",
                value: Number(inc.value ?? 0),
                unit: (inc.unit as string) || "raw",
                at: (inc.timestamp as string) || new Date().toISOString(),
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            this.status = "open";
          }
        });
    } catch (err) {
      console.warn("Supabase Realtime subscription error:", err);
    }
  }

  private stop() {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.status = "closed";
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    if (this.listeners.size === 1) this.start();
    return () => {
      this.listeners.delete(fn);
      if (this.listeners.size === 0) this.stop();
    };
  }

  private emit(e: LiveEvent) {
    this.listeners.forEach((l) => l(e));
  }
}

export const liveStream = new RealtimeTelemetryStream();

export function useLiveStream() {
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [status, setStatus] = useState<LiveStatus>("connecting");

  useEffect(() => {
    setStatus(liveStream.status);
    const unsub = liveStream.subscribe((e) => {
      setEvent(e);
      setStatus(liveStream.status);
    });
    return unsub;
  }, []);

  return { event, status };
}

export function useLiveSensors(labCode?: string) {
  const [readings, setReadings] = useState<SensorReading[]>(DEFAULT_SENSOR_TEMPLATES);
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setStatus(liveStream.status);
    const unsub = liveStream.subscribe((evt) => {
      setStatus(liveStream.status);
      if (evt.type === "sensor") {
        setReadings(evt.readings);
      }
    });
    return unsub;
  }, []);

  // Filter readings matching target labCode (if specified)
  const filtered = labCode
    ? readings.filter((r) => !r.labCode || r.labCode.toLowerCase() === labCode.toLowerCase())
    : readings;

  // Calculate ESP32 connection status
  let latestTs = 0;
  let activeDeviceId: string | null = null;

  for (const r of filtered) {
    if (r.updatedAt) {
      const ts = new Date(r.updatedAt).getTime();
      if (ts > latestTs) {
        latestTs = ts;
        if (r.deviceId) activeDeviceId = r.deviceId;
      }
    }
  }

  const secondsAgo = latestTs > 0 ? Math.max(0, Math.floor((now - latestTs) / 1000)) : null;
  // Consider ESP32 connected if telemetry arrived within last 30 seconds
  const isEsp32Connected = secondsAgo !== null && secondsAgo <= 30;

  return {
    readings: filtered,
    status,
    isEsp32Connected,
    secondsAgo,
    activeDeviceId: activeDeviceId || (labCode ? `ESP32-${labCode.toUpperCase()}` : "ESP32-DEV-01"),
    lastTelemetryIso: latestTs > 0 ? new Date(latestTs).toISOString() : null,
  };
}

export function useHazardEvents(limit = 10) {
  const [hazards, setHazards] = useState<HazardEvent[]>([]);

  useEffect(() => {
    // Fetch initial incidents from Supabase
    supabase
      .from("incidents")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setHazards(
            data.map((inc) => ({
              id: inc.id,
              sensor: inc.sensor,
              sensorKey: inc.sensor ? inc.sensor.toLowerCase() : "mq2",
              lab: inc.lab,
              severity: inc.severity as Severity,
              message: inc.remarks || "Incident recorded",
              value: Number(inc.value ?? 0),
              unit: inc.unit || "",
              at: inc.timestamp,
            }))
          );
        }
      });

    const unsub = liveStream.subscribe((evt) => {
      if (evt.type === "hazard") {
        const { type: _, ...hz } = evt;
        setHazards((prev) => [hz, ...prev.filter((p) => p.id !== hz.id)].slice(0, limit));
      }
    });
    return unsub;
  }, [limit]);

  return hazards;
}

export type TelemetryHistoryPoint = {
  time: string;
  mq2: number;
  mq135: number;
  temperature: number;
  humidity: number;
};

/** Realtime telemetry history hook -- streams pure ESP32 data points as they arrive */
export function useTelemetryHistory(labCode?: string, maxPoints = 25) {
  const [history, setHistory] = useState<TelemetryHistoryPoint[]>([]);

  useEffect(() => {
    // Fetch historical telemetry rows from Supabase
    let query = supabase.from("sensor_readings").select("*").order("updated_at", { ascending: false }).limit(100);
    if (labCode) {
      query = query.eq("lab_code", labCode);
    }

    query.then(({ data }) => {
      if (data && data.length > 0) {
        // Group by timestamp or time string
        const byTime = new Map<string, TelemetryHistoryPoint>();
        for (const row of data.reverse()) {
          const timeStr = row.updated_at
            ? new Date(row.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            : new Date().toLocaleTimeString();

          const pt = byTime.get(timeStr) || { time: timeStr, mq2: 0, mq135: 0, temperature: 0, humidity: 0 };
          const key = String(row.sensor_key).toLowerCase();
          const val = Number(row.value ?? 0);
          if (key === "mq2") pt.mq2 = val;
          else if (key === "mq135") pt.mq135 = val;
          else if (key === "temperature" || key === "temp") pt.temperature = val;
          else if (key === "humidity") pt.humidity = val;
          byTime.set(timeStr, pt);
        }

        const initialPoints = Array.from(byTime.values()).slice(-maxPoints);
        if (initialPoints.length > 0) {
          setHistory(initialPoints);
        }
      }
    });

    // Subscribe to live incoming sensor readings
    const unsub = liveStream.subscribe((evt) => {
      if (evt.type === "sensor") {
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const pt: TelemetryHistoryPoint = { time: timeStr, mq2: 0, mq135: 0, temperature: 0, humidity: 0 };

        for (const r of evt.readings) {
          if (labCode && r.labCode && r.labCode.toLowerCase() !== labCode.toLowerCase()) continue;
          const k = r.key.toLowerCase();
          if (k === "mq2") pt.mq2 = r.value;
          else if (k === "mq135") pt.mq135 = r.value;
          else if (k === "temperature" || k === "temp") pt.temperature = r.value;
          else if (k === "humidity") pt.humidity = r.value;
        }

        setHistory((prev) => {
          // If last entry has same time string, update it; otherwise append
          if (prev.length > 0 && prev[prev.length - 1].time === timeStr) {
            const updated = [...prev];
            updated[updated.length - 1] = pt;
            return updated;
          }
          return [...prev, pt].slice(-maxPoints);
        });
      }
    });

    return unsub;
  }, [labCode, maxPoints]);

  return history;
}
