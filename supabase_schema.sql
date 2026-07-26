-- SENTINEL-G Database Schema for Supabase
-- Project Reference: ywvgwnevbaenqyygbirr
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/ywvgwnevbaenqyygbirr/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'lab_supervisor',
  initials TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Labs Table
CREATE TABLE IF NOT EXISTS public.labs (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'safe',
  devices INTEGER DEFAULT 0,
  incidents INTEGER DEFAULT 0,
  supervisor TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Devices Table (ESP32 telemetry endpoints)
CREATE TABLE IF NOT EXISTS public.devices (
  id TEXT PRIMARY KEY,
  mac TEXT UNIQUE NOT NULL,
  lab TEXT NOT NULL,
  firmware TEXT NOT NULL DEFAULT '1.4.2',
  wifi TEXT NOT NULL DEFAULT 'connected',
  battery INTEGER DEFAULT 100,
  rssi INTEGER DEFAULT -50,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Chemicals Table
CREATE TABLE IF NOT EXISTS public.chemicals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cabinet TEXT NOT NULL,
  quantity TEXT NOT NULL,
  expiry TEXT NOT NULL,
  safety_class TEXT NOT NULL,
  hazard TEXT NOT NULL,
  msds TEXT DEFAULT '#',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Equipment Table
CREATE TABLE IF NOT EXISTS public.equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lab TEXT NOT NULL,
  purchased TEXT NOT NULL,
  warranty TEXT NOT NULL,
  calibration TEXT NOT NULL,
  next_maintenance TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'operational',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Calibrations Table
CREATE TABLE IF NOT EXISTS public.calibrations (
  id TEXT PRIMARY KEY,
  sensor TEXT NOT NULL,
  device TEXT NOT NULL,
  last_calibrated TEXT NOT NULL,
  next_due TEXT NOT NULL,
  technician TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'valid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Incidents Table
CREATE TABLE IF NOT EXISTS public.incidents (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  lab TEXT NOT NULL,
  sensor TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_by TEXT,
  remarks TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Sensor Readings Table (Live Ingest & Realtime)
CREATE TABLE IF NOT EXISTS public.sensor_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT REFERENCES public.devices(id) ON DELETE CASCADE,
  lab_code TEXT,
  sensor_key TEXT NOT NULL,
  label TEXT NOT NULL,
  unit TEXT NOT NULL,
  value NUMERIC NOT NULL,
  min NUMERIC NOT NULL,
  max NUMERIC NOT NULL,
  warn NUMERIC NOT NULL,
  critical NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chemicals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calibrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

-- Allow Public Access Policies (for anon key console access)
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Public read labs" ON public.labs FOR SELECT USING (true);
CREATE POLICY "Public insert labs" ON public.labs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update labs" ON public.labs FOR UPDATE USING (true);
CREATE POLICY "Public delete labs" ON public.labs FOR DELETE USING (true);

CREATE POLICY "Public read devices" ON public.devices FOR SELECT USING (true);
CREATE POLICY "Public insert devices" ON public.devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update devices" ON public.devices FOR UPDATE USING (true);
CREATE POLICY "Public delete devices" ON public.devices FOR DELETE USING (true);

CREATE POLICY "Public read chemicals" ON public.chemicals FOR SELECT USING (true);
CREATE POLICY "Public insert chemicals" ON public.chemicals FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update chemicals" ON public.chemicals FOR UPDATE USING (true);
CREATE POLICY "Public delete chemicals" ON public.chemicals FOR DELETE USING (true);

CREATE POLICY "Public read equipment" ON public.equipment FOR SELECT USING (true);
CREATE POLICY "Public insert equipment" ON public.equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update equipment" ON public.equipment FOR UPDATE USING (true);
CREATE POLICY "Public delete equipment" ON public.equipment FOR DELETE USING (true);

CREATE POLICY "Public read calibrations" ON public.calibrations FOR SELECT USING (true);
CREATE POLICY "Public insert calibrations" ON public.calibrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update calibrations" ON public.calibrations FOR UPDATE USING (true);
CREATE POLICY "Public delete calibrations" ON public.calibrations FOR DELETE USING (true);

CREATE POLICY "Public read incidents" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Public insert incidents" ON public.incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update incidents" ON public.incidents FOR UPDATE USING (true);
CREATE POLICY "Public delete incidents" ON public.incidents FOR DELETE USING (true);

CREATE POLICY "Public read sensor_readings" ON public.sensor_readings FOR SELECT USING (true);
CREATE POLICY "Public insert sensor_readings" ON public.sensor_readings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update sensor_readings" ON public.sensor_readings FOR UPDATE USING (true);

-- Enable Supabase Realtime for Telemetry Tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;

-- Seed Initial Data
INSERT INTO public.labs (id, code, name, location, status, devices, incidents, supervisor) VALUES
  ('chem-01', 'CHM-01', 'Chemistry Lab', 'Block A · Floor 2', 'warning', 6, 2, 'Dr. R. Iyer'),
  ('phy-01', 'PHY-01', 'Physics Lab', 'Block B · Floor 1', 'safe', 4, 0, 'Dr. K. Menon'),
  ('elx-01', 'ELX-01', 'Electronics Lab', 'Block C · Floor 3', 'safe', 8, 1, 'Prof. S. Rao'),
  ('mec-01', 'MEC-01', 'Mechanical Workshop', 'Block D · Ground', 'critical', 5, 3, 'Mr. J. Verma'),
  ('res-01', 'RES-01', 'Research Lab', 'Block A · Floor 4', 'safe', 7, 0, 'Dr. A. Nair')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.devices (id, mac, lab, firmware, wifi, battery, rssi, last_seen) VALUES
  ('ESP32-CHM-01', '24:6F:28:AA:14:22', 'Chemistry Lab', '1.4.2', 'connected', 92, -54, NOW()),
  ('ESP32-CHM-02', '24:6F:28:AA:14:23', 'Chemistry Lab', '1.4.2', 'unstable', 71, -74, NOW() - INTERVAL '2 minutes'),
  ('ESP32-PHY-01', '24:6F:28:BB:04:11', 'Physics Lab', '1.4.1', 'connected', 88, -59, NOW() - INTERVAL '15 seconds'),
  ('ESP32-ELX-01', '24:6F:28:CC:22:9A', 'Electronics Lab', '1.4.2', 'connected', 100, -48, NOW() - INTERVAL '5 seconds'),
  ('ESP32-MEC-01', '24:6F:28:DD:31:07', 'Mechanical Workshop', '1.3.9', 'offline', 12, -95, NOW() - INTERVAL '1 hour'),
  ('ESP32-RES-01', '24:6F:28:EE:41:55', 'Research Lab', '1.4.2', 'connected', 84, -61, NOW() - INTERVAL '8 seconds')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.chemicals (id, name, cabinet, quantity, expiry, safety_class, hazard, msds) VALUES
  ('CHM-A101', 'Sulfuric Acid 98%', 'A-1', '2.5 L', '2027-03-14', 'Class 8 · Corrosive', 'Corrosive', '#'),
  ('CHM-A102', 'Sodium Hydroxide', 'A-2', '1 kg', '2026-11-02', 'Class 8 · Corrosive', 'Corrosive', '#'),
  ('CHM-B201', 'Acetone', 'B-1', '5 L', '2026-09-10', 'Class 3 · Flammable', 'Flammable', '#'),
  ('CHM-B202', 'Ethanol Absolute', 'B-1', '10 L', '2026-08-01', 'Class 3 · Flammable', 'Flammable', '#'),
  ('CHM-C301', 'Methanol', 'C-2', '2 L', '2026-07-30', 'Class 6 · Toxic', 'Toxic', '#'),
  ('CHM-C302', 'Hydrogen Peroxide 30%', 'C-3', '500 mL', '2028-01-20', 'Class 5 · Oxidizer', 'Oxidizer', '#')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.equipment (id, name, lab, purchased, warranty, calibration, next_maintenance, status) VALUES
  ('EQ-2201', 'Fume Hood #2', 'Chemistry Lab', '2022-06-01', '2027-06-01', '2026-04-11', '2026-08-15', 'operational'),
  ('EQ-2202', 'Autoclave 25L', 'Research Lab', '2021-01-14', '2026-01-14', '2026-05-22', '2026-07-28', 'service_due'),
  ('EQ-2203', 'Oscilloscope DSO-X', 'Electronics Lab', '2023-09-19', '2028-09-19', '2026-06-30', '2026-12-30', 'operational'),
  ('EQ-2204', 'Bench Grinder BG-8', 'Mechanical Workshop', '2020-03-12', '2025-03-12', '2026-02-04', '2026-07-26', 'out_of_service'),
  ('EQ-2205', 'Spectrophotometer UV-2600', 'Chemistry Lab', '2024-02-27', '2029-02-27', '2026-07-01', '2026-10-01', 'operational')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.calibrations (id, sensor, device, last_calibrated, next_due, technician, status) VALUES
  ('CAL-9001', 'MQ2', 'ESP32-CHM-01', '2026-04-10', '2026-10-10', 'N. Kapoor', 'valid'),
  ('CAL-9002', 'MQ135', 'ESP32-CHM-01', '2026-03-22', '2026-09-22', 'N. Kapoor', 'due_soon'),
  ('CAL-9003', 'DHT22', 'ESP32-PHY-01', '2026-01-05', '2026-07-05', 'L. Fernandes', 'overdue'),
  ('CAL-9004', 'MQ2', 'ESP32-MEC-01', '2025-12-01', '2026-06-01', 'L. Fernandes', 'overdue'),
  ('CAL-9005', 'MQ135', 'ESP32-ELX-01', '2026-05-18', '2026-11-18', 'N. Kapoor', 'valid')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.incidents (id, timestamp, lab, sensor, severity, status, resolved_by, remarks) VALUES
  ('INC-1042', '2026-07-25T09:14:00Z', 'Chemistry Lab', 'MQ2', 'high', 'acknowledged', 'R. Iyer', 'LPG spike near fume hood 2'),
  ('INC-1041', '2026-07-25T08:02:00Z', 'Mechanical Workshop', 'Temperature', 'critical', 'open', NULL, 'Grinder overheating > 52°C'),
  ('INC-1040', '2026-07-24T22:37:00Z', 'Electronics Lab', 'Smoke', 'medium', 'resolved', 'S. Rao', 'Soldering iron left on'),
  ('INC-1039', '2026-07-24T15:11:00Z', 'Chemistry Lab', 'MQ135', 'low', 'resolved', 'R. Iyer', 'Ventilation cycle short'),
  ('INC-1038', '2026-07-23T11:48:00Z', 'Physics Lab', 'Humidity', 'low', 'resolved', 'K. Menon', 'AC condensation'),
  ('INC-1037', '2026-07-22T17:20:00Z', 'Mechanical Workshop', 'MQ2', 'high', 'resolved', 'J. Verma', 'Welding gas residual')
ON CONFLICT (id) DO NOTHING;
