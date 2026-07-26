import { createClient } from "@supabase/supabase-js";

// Read Supabase environment variables or use user-provided defaults
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://ywvgwnevbaenqyygbirr.supabase.co";

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3dmd3bmV2YmFlbnF5eWdiaXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNDYwODgsImV4cCI6MjEwMDYyMjA4OH0.lWurOJGdbN4Drt3JiMWsEsME57d_9Hs3Bjs4Bqf5wB0";

export const SUPABASE_PROJECT_ID =
  import.meta.env.VITE_SUPABASE_PROJECT_ID || "ywvgwnevbaenqyygbirr";

// Create singleton Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database record types for Supabase sync
export interface SupabaseLab {
  id: string;
  code: string;
  name: string;
  location: string;
  status: "safe" | "warning" | "critical";
  devices: number;
  incidents: number;
  supervisor: string;
}

export interface SupabaseDevice {
  id: string;
  mac: string;
  lab: string;
  firmware: string;
  wifi: "connected" | "unstable" | "offline";
  battery: number;
  rssi: number;
  last_seen?: string;
  lastSeen?: string;
}

export interface SupabaseChemical {
  id: string;
  name: string;
  cabinet: string;
  quantity: string;
  expiry: string;
  safety_class?: string;
  safetyClass?: string;
  hazard: string;
  msds: string;
}

export interface SupabaseEquipment {
  id: string;
  name: string;
  lab: string;
  purchased: string;
  warranty: string;
  calibration: string;
  next_maintenance?: string;
  nextMaintenance?: string;
  status: "operational" | "service_due" | "out_of_service";
}

export interface SupabaseCalibration {
  id: string;
  sensor: string;
  device: string;
  last_calibrated?: string;
  lastCalibrated?: string;
  next_due?: string;
  nextDue?: string;
  technician: string;
  status: "valid" | "due_soon" | "overdue";
}

export interface SupabaseIncident {
  id: string;
  timestamp: string;
  lab: string;
  sensor: string;
  severity: "normal" | "low" | "medium" | "high" | "critical";
  status: "open" | "acknowledged" | "resolved";
  resolved_by?: string;
  resolvedBy?: string;
  remarks: string;
}

/** Check if Supabase connection is healthy */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from("labs").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
