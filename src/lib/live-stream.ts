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

// Default empty sensor slots before hardware transmits telemetry
const DEFAULT_SENSOR_TEMPLATES: SensorReading[] = [
  { key: "mq2", label: "MQ2 · LPG / Smoke", unit: "ppm", value: 0, min: 0, max: 2000, warn: 400, critical: 800, updatedAt: new Date().toISOString() },
  { key: "mq135", label: "MQ135 · Air Quality", unit: "ppm", value: 0, min: 0, max: 1000, warn: 300, critical: 600, updatedAt: new Date().toISOString() },
  { key: "temp", label: "Temperature", unit: "°C", value: 0, min: -10, max: 80, warn: 35, critical: 45, updatedAt: new Date().toISOString() },
  { key: "humidity", label: "Humidity", unit: "%", value: 0, min: 0, max: 100, warn: 75, critical: 85, updatedAt: new Date().toISOString() },
  { key: "smoke", label: "Smoke Density", unit: "%", value: 0, min: 0, max: 100, warn: 20, critical: 40, updatedAt: new Date().toISOString() },
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
          if (!latestByKey.has(row.sensor_key)) {
            latestByKey.set(row.sensor_key, row);
          }
        }

        this.readings = DEFAULT_SENSOR_TEMPLATES.map((tmpl) => {
          const row = latestByKey.get(tmpl.key);
          if (row) {
            return {
              key: tmpl.key,
              label: (row.label as string) || tmpl.label,
              unit: (row.unit as string) || tmpl.unit,
              value: Number(row.value ?? tmpl.value),
              min: Number(row.min ?? tmpl.min),
              max: Number(row.max ?? tmpl.max),
              warn: Number(row.warn ?? tmpl.warn),
              critical: Number(row.critical ?? tmpl.critical),
              updatedAt: (row.updated_at as string) || new Date().toISOString(),
              labCode: (row.lab_code as string) || undefined,
              deviceId: (row.device_id as string) || undefined,
            };
          }
          return tmpl;
        });

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
              const updated = this.readings.map((r) => {
                if (r.key === newRow.sensor_key) {
                  return {
                    ...r,
                    value: Number(newRow.value),
                    updatedAt: (newRow.updated_at as string) || new Date().toISOString(),
                    labCode: (newRow.lab_code as string) || r.labCode,
                    deviceId: (newRow.device_id as string) || r.deviceId,
                  };
                }
                return r;
              });
              this.readings = updated;
              this.emit({ type: "sensor", readings: this.readings, at: new Date().toISOString() });
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
                lab: (inc.lab as string) || "Chemistry Lab",
                severity: (inc.severity as Severity) || "high",
                message: (inc.remarks as string) || "Realtime incident detected",
                value: Number(inc.value ?? 0),
                unit: (inc.unit as string) || "ppm",
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

  const filteredReadings = labCode
    ? readings.map((r) => {
        // If a reading specifically belongs to this lab_code or is default template, return exact value
        if (r.labCode && r.labCode.toLowerCase() !== labCode.toLowerCase()) {
          return r;
        }
        return r;
      })
    : readings;

  return { readings: filteredReadings, status };
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
