import { useSyncExternalStore, useEffect } from "react";
import type { Chemical, Equipment, Calibration, Lab, Device } from "./mock-data";
import { supabase } from "./supabase";

type Stores = {
  chemicals: Chemical[];
  equipment: Equipment[];
  calibrations: Calibration[];
  labs: Lab[];
  devices: Device[];
  hiddenDeviceIds: string[];
  hiddenLabIds: string[];
};

const state: Stores = {
  chemicals: [],
  equipment: [],
  calibrations: [],
  labs: [],
  devices: [],
  hiddenDeviceIds: [],
  hiddenLabIds: [],
};

const listeners = new Set<() => void>();
let initialized = false;
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

function emit() {
  listeners.forEach((l) => l());
}

/** Fetch data from Supabase Postgres tables */
export async function syncFromSupabase() {
  try {
    const [labsRes, devicesRes, chemRes, equipRes, calibRes] = await Promise.all([
      supabase.from("labs").select("*").order("created_at", { ascending: false }),
      supabase.from("devices").select("*").order("created_at", { ascending: false }),
      supabase.from("chemicals").select("*").order("created_at", { ascending: false }),
      supabase.from("equipment").select("*").order("created_at", { ascending: false }),
      supabase.from("calibrations").select("*").order("created_at", { ascending: false }),
    ]);

    if (labsRes.data) {
      state.labs = labsRes.data as Lab[];
    }

    if (devicesRes.data) {
      state.devices = devicesRes.data.map((d: Record<string, unknown>) => ({
        id: String(d.id),
        mac: String(d.mac),
        lab: String(d.lab),
        firmware: String(d.firmware ?? "1.4.2"),
        wifi: (d.wifi as Device["wifi"]) ?? "connected",
        battery: Number(d.battery ?? 100),
        rssi: Number(d.rssi ?? -50),
        lastSeen: (d.last_seen as string) || (d.lastSeen as string) || new Date().toISOString(),
      }));
    }

    if (chemRes.data) {
      state.chemicals = chemRes.data.map((c: Record<string, unknown>) => ({
        id: String(c.id),
        name: String(c.name),
        cabinet: String(c.cabinet),
        quantity: String(c.quantity),
        expiry: String(c.expiry),
        safetyClass: String(c.safety_class ?? c.safetyClass ?? "Class 8"),
        hazard: String(c.hazard),
        msds: String(c.msds ?? "#"),
      }));
    }

    if (equipRes.data) {
      state.equipment = equipRes.data.map((e: Record<string, unknown>) => ({
        id: String(e.id),
        name: String(e.name),
        lab: String(e.lab),
        purchased: String(e.purchased),
        warranty: String(e.warranty),
        calibration: String(e.calibration),
        nextMaintenance: String(e.next_maintenance ?? e.nextMaintenance ?? ""),
        status: (e.status as Equipment["status"]) ?? "operational",
      }));
    }

    if (calibRes.data) {
      state.calibrations = calibRes.data.map((c: Record<string, unknown>) => ({
        id: String(c.id),
        sensor: String(c.sensor),
        device: String(c.device),
        lastCalibrated: String(c.last_calibrated ?? c.lastCalibrated ?? ""),
        nextDue: String(c.next_due ?? c.nextDue ?? ""),
        technician: String(c.technician),
        status: (c.status as Calibration["status"]) ?? "valid",
      }));
    }

    emit();
  } catch (err) {
    console.warn("Supabase fetch error:", err);
  }
}

/** Subscribe to Realtime Postgres Changes across all database entities */
function setupRealtimeSubscriptions() {
  if (realtimeChannel) return;

  try {
    realtimeChannel = supabase
      .channel("sentinel-db-realtime-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "labs" }, () => syncFromSupabase())
      .on("postgres_changes", { event: "*", schema: "public", table: "devices" }, () => syncFromSupabase())
      .on("postgres_changes", { event: "*", schema: "public", table: "chemicals" }, () => syncFromSupabase())
      .on("postgres_changes", { event: "*", schema: "public", table: "equipment" }, () => syncFromSupabase())
      .on("postgres_changes", { event: "*", schema: "public", table: "calibrations" }, () => syncFromSupabase())
      .subscribe();
  } catch (err) {
    console.warn("Supabase Realtime DB changes subscription error:", err);
  }
}

export function addChemical(c: Chemical) {
  state.chemicals = [c, ...state.chemicals.filter((x) => x.id !== c.id)];
  emit();

  supabase
    .from("chemicals")
    .upsert({
      id: c.id,
      name: c.name,
      cabinet: c.cabinet,
      quantity: c.quantity,
      expiry: c.expiry,
      safety_class: c.safetyClass,
      hazard: c.hazard,
      msds: c.msds,
    })
    .then(({ error }) => {
      if (error) console.warn("Supabase insert chemical error:", error);
    });
}

export function addEquipment(e: Equipment) {
  state.equipment = [e, ...state.equipment.filter((x) => x.id !== e.id)];
  emit();

  supabase
    .from("equipment")
    .upsert({
      id: e.id,
      name: e.name,
      lab: e.lab,
      purchased: e.purchased,
      warranty: e.warranty,
      calibration: e.calibration,
      next_maintenance: e.nextMaintenance,
      status: e.status,
    })
    .then(({ error }) => {
      if (error) console.warn("Supabase insert equipment error:", error);
    });
}

export function addCalibration(c: Calibration) {
  state.calibrations = [c, ...state.calibrations.filter((x) => x.id !== c.id)];
  emit();

  supabase
    .from("calibrations")
    .upsert({
      id: c.id,
      sensor: c.sensor,
      device: c.device,
      last_calibrated: c.lastCalibrated,
      next_due: c.nextDue,
      technician: c.technician,
      status: c.status,
    })
    .then(({ error }) => {
      if (error) console.warn("Supabase insert calibration error:", error);
    });
}

export function addLab(l: Lab) {
  state.labs = [l, ...state.labs.filter((x) => x.id !== l.id)];
  state.hiddenLabIds = state.hiddenLabIds.filter((id) => id !== l.id);
  emit();

  supabase
    .from("labs")
    .upsert([l])
    .then(({ error }) => {
      if (error) console.warn("Supabase insert lab error:", error);
    });
}

export function addDevice(d: Device) {
  state.devices = [d, ...state.devices.filter((x) => x.id !== d.id)];
  state.hiddenDeviceIds = state.hiddenDeviceIds.filter((id) => id !== d.id);
  emit();

  supabase
    .from("devices")
    .upsert([
      {
        id: d.id,
        mac: d.mac,
        lab: d.lab,
        firmware: d.firmware,
        wifi: d.wifi,
        battery: d.battery,
        rssi: d.rssi,
        last_seen: d.lastSeen,
      },
    ])
    .then(({ error }) => {
      if (error) console.warn("Supabase insert device error:", error);
    });
}

export function updateDevice(id: string, patch: Partial<Device>) {
  state.devices = state.devices.map((d) => (d.id === id ? { ...d, ...patch } : d));
  emit();

  const supabasePatch: Record<string, unknown> = { ...patch };
  if (patch.lastSeen) {
    supabasePatch.last_seen = patch.lastSeen;
    delete supabasePatch.lastSeen;
  }

  supabase.from("devices").update(supabasePatch).eq("id", id).then(({ error }) => {
    if (error) console.warn("Supabase update device error:", error);
  });
}

export function deleteDevice(id: string) {
  state.devices = state.devices.filter((d) => d.id !== id);
  if (!state.hiddenDeviceIds.includes(id)) {
    state.hiddenDeviceIds = [...state.hiddenDeviceIds, id];
  }
  emit();

  supabase.from("devices").delete().eq("id", id).then(({ error }) => {
    if (error) console.warn("Supabase delete device error:", error);
  });
}

export function deleteLab(id: string) {
  state.labs = state.labs.filter((l) => l.id !== id);
  if (!state.hiddenLabIds.includes(id)) {
    state.hiddenLabIds = [...state.hiddenLabIds, id];
  }
  emit();

  supabase.from("labs").delete().eq("id", id).then(({ error }) => {
    if (error) console.warn("Supabase delete lab error:", error);
  });
}

export function deleteChemical(id: string) {
  state.chemicals = state.chemicals.filter((c) => c.id !== id);
  emit();

  supabase.from("chemicals").delete().eq("id", id).then(({ error }) => {
    if (error) console.warn("Supabase delete chemical error:", error);
  });
}

export function deleteEquipment(id: string) {
  state.equipment = state.equipment.filter((e) => e.id !== id);
  emit();

  supabase.from("equipment").delete().eq("id", id).then(({ error }) => {
    if (error) console.warn("Supabase delete equipment error:", error);
  });
}

export function deleteCalibration(id: string) {
  state.calibrations = state.calibrations.filter((c) => c.id !== id);
  emit();

  supabase.from("calibrations").delete().eq("id", id).then(({ error }) => {
    if (error) console.warn("Supabase delete calibration error:", error);
  });
}

export function isMacTaken(mac: string, existingMacs: string[]) {
  const norm = mac.trim().toUpperCase();
  if (existingMacs.some((m) => m.toUpperCase() === norm)) return true;
  return state.devices.some((d) => d.mac.toUpperCase() === norm);
}

export function isDeviceIdTaken(id: string, existingIds: string[]) {
  const norm = id.trim();
  if (existingIds.some((x) => x === norm)) return true;
  return state.devices.some((d) => d.id === norm);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!initialized) {
    initialized = true;
    syncFromSupabase();
    setupRealtimeSubscriptions();
  }
  return () => listeners.delete(cb);
}

export function useUserRecords<K extends keyof Stores>(key: K): Stores[K] {
  useEffect(() => {
    if (!initialized) {
      initialized = true;
      syncFromSupabase();
      setupRealtimeSubscriptions();
    }
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => state[key],
    () => state[key]
  );
}
