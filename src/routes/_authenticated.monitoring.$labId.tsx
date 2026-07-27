import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { ArrowLeft, ChevronRight, Wifi, WifiOff, AlertTriangle, MapPin, User2, Building2 } from "lucide-react";
import { PageHeader, StatusDot } from "@/components/PageHeader";
import { DEVICES, LABS, sensorSeverity, type SensorReading, type Lab } from "@/lib/mock-data";
import { useLiveSensors, useHazardEvents, useTelemetryHistory } from "@/lib/live-stream";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUserRecords } from "@/lib/user-records";

export const Route = createFileRoute("/_authenticated/monitoring/$labId")({
  head: ({ params }) => {
    const lab = LABS.find((l) => l.id === params.labId);
    const name = lab?.name ?? "Laboratory";
    return {
      meta: [
        { title: `${name} · Live Monitoring · SENTINEL-G` },
        { name: "description", content: `Realtime sensor gauges, telemetry and device uplinks for ${name}.` },
        { property: "og:title", content: `${name} · Live Monitoring · SENTINEL-G` },
        { property: "og:description", content: `Dedicated live monitoring dashboard for ${name}.` },
      ],
    };
  },
  component: LabMonitoring,
});

function LabMonitoring() {
  const { labId } = Route.useParams();
  const userLabs = useUserRecords("labs");
  const userDevices = useUserRecords("devices");
  const hiddenDeviceIds = useUserRecords("hiddenDeviceIds");
  const hiddenLabIds = useUserRecords("hiddenLabIds");
  const hideLabs = useMemo(() => new Set(hiddenLabIds), [hiddenLabIds]);
  const allLabs = useMemo<Lab[]>(
    () => [...userLabs, ...LABS].filter((l) => !hideLabs.has(l.id)),
    [userLabs, hideLabs],
  );
  const lab = allLabs.find((l) => l.id === labId);
  const { readings, status, isEsp32Connected, secondsAgo, activeDeviceId } = useLiveSensors(lab?.code);
  const hazards = useHazardEvents(20);
  const history = useTelemetryHistory(lab?.code);

  const labDevices = useMemo(() => {
    if (!lab) return [];
    const hideDev = new Set(hiddenDeviceIds);
    return [...userDevices, ...DEVICES].filter(
      (d) => d.lab === lab.name && !hideDev.has(d.id),
    );
  }, [lab, userDevices, hiddenDeviceIds]);
  const labHazards = lab ? hazards.filter((h) => h.lab === lab.name) : [];

  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    setPulse((p) => p + 1);
  }, [readings]);

  const statusTone = status === "open" ? "success" : status === "connecting" ? "warning" : "critical";

  if (!lab) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-md rounded-sm border border-border bg-card p-6 text-center">
          <div className="text-sm font-semibold">Laboratory not found</div>
          <div className="mt-1 text-xs text-muted-foreground">
            <span className="text-mono">{labId}</span> is not registered. It may only exist in another
            session — user-created labs live in this browser tab's session store.
          </div>
          <Link
            to="/monitoring"
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Back to all labs
          </Link>
        </div>
      </div>
    );
  }

  const labTone = lab.status === "critical" ? "critical" : lab.status === "warning" ? "warning" : "success";

  return (
    <div>
      <PageHeader
        title={lab.name}
        description={`Dedicated live monitoring for ${lab.code} — supervised by ${lab.supervisor}.`}
        meta={
          <div className="flex flex-wrap items-center gap-3 text-mono text-[11px] text-muted-foreground">
            <Link to="/monitoring" className="inline-flex items-center gap-1 text-primary hover:underline">
              <ArrowLeft className="h-3 w-3" /> All labs
            </Link>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> {lab.location}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <User2 className="h-3 w-3" /> {lab.supervisor}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <StatusDot tone={isEsp32Connected ? "success" : "critical"} /> ESP32 · {isEsp32Connected ? "ONLINE" : "OFFLINE"}
            </span>
            <span>·</span>
            <span>Frame #{pulse}</span>
          </div>
        }
        actions={
          <Badge
            variant="outline"
            className={cn(
              "rounded-sm text-mono text-[10px] uppercase",
              labTone === "critical" && "border-critical/30 bg-critical/10 text-critical",
              labTone === "warning" && "border-warning/30 bg-warning/10 text-warning",
              labTone === "success" && "border-success/30 bg-success/10 text-success",
            )}
          >
            {lab.status}
          </Badge>
        }
      />

      <div className="p-6 space-y-6">
        {/* Prominent ESP32 Connection Status Card */}
        {isEsp32Connected ? (
          <div className="rounded-sm border border-emerald-500/50 bg-emerald-500/10 p-4 text-xs font-medium text-foreground shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-500 text-white shrink-0 shadow-sm">
                  <Wifi className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide">
                      ESP32 FIELD DEVICE ONLINE & CONNECTED
                    </h3>
                    <span className="font-mono text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      LIVE UPLINK ACTIVE
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
                    <span>Node ID: <strong className="text-foreground">{activeDeviceId}</strong></span>
                    <span>·</span>
                    <span>Target Lab: <strong className="text-foreground">{lab.name} ({lab.code})</strong></span>
                    <span>·</span>
                    <span>Last Telemetry: <strong className="text-emerald-600 dark:text-emerald-400">{secondsAgo}s ago</strong></span>
                  </div>
                </div>
              </div>
              <div className="text-right text-mono text-[11px] text-muted-foreground">
                <div className="text-emerald-700 dark:text-emerald-400 font-semibold">SUPABASE REALTIME ACTIVE</div>
                <div>Pure Hardware Telemetry</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-sm border border-amber-500/40 bg-amber-500/10 p-4 text-xs font-medium text-foreground shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-amber-500 text-white shrink-0">
                  <WifiOff className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                      ESP32 FIELD DEVICE DISCONNECTED / OFFLINE
                    </h3>
                    <span className="font-mono text-[10px] bg-amber-500/30 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      NO LIVE TELEMETRY
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
                    <span>Target Device: <strong className="text-foreground">{activeDeviceId}</strong></span>
                    <span>·</span>
                    <span>Lab: <strong className="text-foreground">{lab.name} ({lab.code})</strong></span>
                    <span>·</span>
                    <span>Status: <span className="text-amber-600 dark:text-amber-400 font-semibold">{secondsAgo !== null ? `Last seen ${secondsAgo}s ago` : "Waiting for ESP32 HTTP POST..."}</span></span>
                  </div>
                </div>
              </div>
              <Link
                to="/integration"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline bg-card border border-border px-3 py-1.5 rounded-sm shrink-0 shadow-xs"
              >
                Flash / Connect ESP32 →
              </Link>
            </div>
          </div>
        )}

        {/* Quick lab switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Jump to</span>
          {allLabs.map((l) => {
            const active = l.id === lab.id;
            return (
              <Link
                key={l.id}
                to="/monitoring/$labId"
                params={{ labId: l.id }}
                className={cn(
                  "rounded-sm border px-2 py-1 text-mono text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1.5",
                  active
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                    : "border-border text-muted-foreground hover:bg-muted/40",
                )}
              >
                {active && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                {l.code}
              </Link>
            );
          })}
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KPI label="Devices" value={labDevices.length.toString()} />
          <KPI
            label="Online"
            value={labDevices.filter((d) => d.wifi === "connected").length.toString()}
            tone="success"
          />
          <KPI
            label="Unstable / Offline"
            value={labDevices.filter((d) => d.wifi !== "connected").length.toString()}
            tone="warning"
          />
          <KPI label="Incidents (30d)" value={lab.incidents.toString()} tone={lab.incidents > 0 ? "warning" : "success"} />
        </div>

        {/* Gauges scoped to this lab */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {readings.map((s) => {
            const sev = sensorSeverity(s);
            const tone = sev === "critical" ? "critical" : sev === "medium" ? "warning" : "success";
            const pct = Math.min(100, Math.max(0, ((s.value - s.min) / (s.max - s.min)) * 100));
            const display =
              Math.abs(s.value) >= 100 ? Math.round(s.value).toString() : s.value.toFixed(1);
            return (
              <div key={s.key} className="rounded-sm border border-border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  <StatusDot tone={tone} />
                </div>
                <div className="relative mt-3 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="72%"
                      outerRadius="100%"
                      data={[{ v: pct }]}
                      startAngle={225}
                      endAngle={-45}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar
                        dataKey="v"
                        cornerRadius={2}
                        fill={
                          tone === "critical"
                            ? "var(--critical)"
                            : tone === "warning"
                            ? "var(--warning)"
                            : "var(--success)"
                        }
                        background={{ fill: "var(--muted)" }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-2">
                    <div className="text-mono text-xl font-semibold leading-none tabular-nums">{display}</div>
                    <div className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground">{s.unit}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-mono text-[10px] text-muted-foreground">
                  <div>
                    <div>Min</div>
                    <div className="text-foreground">{s.min}</div>
                  </div>
                  <div>
                    <div>Warn</div>
                    <div className="text-warning">{s.warn}</div>
                  </div>
                  <div>
                    <div>Crit</div>
                    <div className="text-critical">{s.critical}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Realtime Telemetry Timeseries + hazard feed */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-sm border border-border bg-card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <div className="text-sm font-semibold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Realtime Telemetry Stream · {lab.code}
                </div>
                <div className="text-[11px] text-muted-foreground">Live ESP32 telemetry feed · updating in realtime</div>
              </div>
              <Badge variant="outline" className="rounded-sm text-mono text-[10px] uppercase">
                {history.length} samples
              </Badge>
            </div>
            <div className="h-72 p-2">
              {history.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-6">
                  <div className="text-xs text-muted-foreground font-mono">
                    Waiting for ESP32 live telemetry samples...
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Connect ESP32 or run the test command to start plotting live points.
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                    <XAxis
                      dataKey="time"
                      fontSize={10}
                      tick={{ fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      fontSize={10}
                      tick={{ fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        fontSize: 11,
                        borderRadius: 4,
                      }}
                    />
                    <Line type="monotone" dataKey="mq2" name="MQ-2 Gas" stroke="var(--chart-1)" dot={false} strokeWidth={1.6} />
                    <Line type="monotone" dataKey="mq135" name="MQ-135 Air" stroke="var(--chart-2)" dot={false} strokeWidth={1.6} />
                    <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="var(--chart-3)" dot={false} strokeWidth={1.6} />
                    <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="var(--chart-5)" dot={false} strokeWidth={1.6} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-sm border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <div className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Hazard Feed
                </div>
                <div className="text-[11px] text-muted-foreground">Events scoped to {lab.code}</div>
              </div>
              <Badge variant="outline" className="rounded-sm text-mono text-[10px] uppercase">
                {labHazards.length}
              </Badge>
            </div>
            <ul className="max-h-72 divide-y divide-border overflow-y-auto">
              {labHazards.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-muted-foreground">
                  No events for this lab yet.
                </li>
              )}
              {labHazards.map((h) => (
                <li key={h.id} className="flex items-start gap-2 px-4 py-2.5">
                  <span
                    className={cn(
                      "mt-1 h-2 w-2 shrink-0 rounded-full",
                      h.severity === "critical" && "bg-critical animate-pulse",
                      h.severity === "high" && "bg-warning animate-pulse",
                      h.severity === "medium" && "bg-warning",
                      h.severity === "low" && "bg-info",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-mono text-[10px] text-muted-foreground">
                      <span>{h.id}</span>
                      <span>·</span>
                      <span>{new Date(h.at).toLocaleTimeString()}</span>
                    </div>
                    <div className="truncate text-xs">{h.message}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Devices in this lab */}
        <div className="rounded-sm border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="text-sm font-semibold">Devices · {lab.code}</div>
              <div className="text-[11px] text-muted-foreground">
                ESP32 uplinks assigned to this laboratory
              </div>
            </div>
            <Link
              to="/devices"
              className="inline-flex items-center gap-1 text-mono text-[10px] uppercase tracking-wider text-primary hover:underline"
            >
              Fleet <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {labDevices.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              No devices are currently registered under {lab.name}.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Device</th>
                  <th className="px-4 py-2 font-medium">Firmware</th>
                  <th className="px-4 py-2 font-medium">RSSI</th>
                  <th className="px-4 py-2 font-medium">Battery</th>
                  <th className="px-4 py-2 font-medium">Last seen</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {labDevices.map((d) => (
                  <tr key={d.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-2.5 text-mono text-xs">{d.id}</td>
                    <td className="px-4 py-2.5 text-mono text-xs">{d.firmware}</td>
                    <td className="px-4 py-2.5 text-mono text-xs">{d.rssi} dBm</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full",
                              d.battery > 40 ? "bg-success" : d.battery > 15 ? "bg-warning" : "bg-critical",
                            )}
                            style={{ width: `${d.battery}%` }}
                          />
                        </div>
                        <span className="text-mono text-xs">{d.battery}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-mono text-[11px] text-muted-foreground">
                      {new Date(d.lastSeen).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-sm text-mono text-[10px] uppercase",
                          d.wifi === "connected" && "border-success/30 bg-success/10 text-success",
                          d.wifi === "unstable" && "border-warning/30 bg-warning/10 text-warning",
                          d.wifi === "offline" && "border-critical/30 bg-critical/10 text-critical",
                        )}
                      >
                        {d.wifi === "offline" ? (
                          <WifiOff className="mr-1 h-3 w-3" />
                        ) : (
                          <Wifi className="mr-1 h-3 w-3" />
                        )}
                        {d.wifi}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "muted" | "success" | "warning" | "critical";
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 text-mono text-2xl font-semibold tabular-nums",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "critical" && "text-critical",
        )}
      >
        {value}
      </div>
    </div>
  );
}
