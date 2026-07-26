import type { Role } from "./auth";

export type RouteKey =
  | "/dashboard"
  | "/monitoring"
  | "/guidance"
  | "/alerts"
  | "/incidents"
  | "/chemicals"
  | "/equipment"
  | "/calibration"
  | "/labs"
  | "/devices"
  | "/analytics"
  | "/reports"
  | "/integration";

export type Action =
  | "write"
  | "admin"
  | "export"
  | "device_manage"
  | "calibrate"
  | "acknowledge"
  | "resolve"
  | "chemicals_manage"
  | "equipment_manage";

const ROUTE_ACCESS: Record<Role, RouteKey[]> = {
  super_admin: [
    "/dashboard", "/monitoring", "/guidance", "/alerts",
    "/incidents", "/chemicals", "/equipment", "/calibration",
    "/labs", "/devices", "/analytics", "/reports", "/integration",
  ],
  institution_admin: [
    "/dashboard", "/monitoring", "/guidance", "/alerts",
    "/incidents", "/chemicals", "/equipment", "/calibration",
    "/labs", "/devices", "/analytics", "/reports", "/integration",
  ],
  lab_supervisor: [
    "/dashboard", "/monitoring", "/guidance", "/alerts",
    "/incidents", "/chemicals", "/equipment", "/calibration",
    "/labs", "/devices", "/analytics", "/reports",
  ],
  faculty: [
    "/dashboard", "/monitoring", "/guidance", "/alerts",
    "/incidents", "/chemicals", "/equipment", "/labs",
    "/analytics", "/reports",
  ],
  technician: [
    "/dashboard", "/monitoring", "/alerts",
    "/incidents", "/equipment", "/calibration",
    "/devices", "/integration",
  ],
  student: ["/dashboard", "/monitoring", "/guidance", "/alerts", "/labs"],
};

const ACTION_ACCESS: Record<Role, Action[]> = {
  super_admin: ["write", "admin", "export", "device_manage", "calibrate", "acknowledge", "resolve", "chemicals_manage", "equipment_manage"],
  institution_admin: ["write", "admin", "export", "device_manage", "calibrate", "acknowledge", "resolve", "chemicals_manage", "equipment_manage"],
  lab_supervisor: ["write", "export", "device_manage", "calibrate", "acknowledge", "resolve", "chemicals_manage", "equipment_manage"],
  faculty: ["write", "export", "acknowledge", "resolve", "chemicals_manage"],
  technician: ["write", "export", "device_manage", "calibrate", "acknowledge", "equipment_manage"],
  student: [],
};

export const ROLE_SCOPE: Record<Role, string> = {
  super_admin: "Global · every tenant, every action",
  institution_admin: "Institution · full read/write, user & policy control",
  lab_supervisor: "Assigned labs · operations, incidents, calibration",
  faculty: "Teaching labs · view + incident triage",
  technician: "Field ops · devices, calibration, maintenance",
  student: "Read-only · dashboard, guidance & alerts",
};

export function canRoute(role: Role, r: RouteKey) {
  return ROUTE_ACCESS[role].includes(r);
}
export function canAction(role: Role, a: Action) {
  return ACTION_ACCESS[role].includes(a);
}
export function allowedRoutes(role: Role) {
  return ROUTE_ACCESS[role];
}
