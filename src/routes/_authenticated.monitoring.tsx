import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { RefreshCw, Wifi, WifiOff, AlertTriangle, ExternalLink, Building2 } from "lucide-react";
import { PageHeader, StatusDot } from "@/components/PageHeader";
import { DEVICES, LABS, TREND_24H, sensorSeverity } from "@/lib/mock-data";
import { useLiveSensors, useHazardEvents } from "@/lib/live-stream";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUserRecords } from "@/lib/user-records";
import { AddLabDialog } from "@/components/AddLabDialog";

export const Route = createFileRoute("/_authenticated/monitoring")({
  head: () => ({
    meta: [
      { title: "Live Monitoring · SENTINEL-G" },
      { name: "description", content: "Realtime sensor gauges, time-series and device uplink telemetry." },
      { property: "og:title", content: "Live Monitoring · SENTINEL-G" },
      { property: "og:description", content: "Realtime gauges and telemetry across every ESP32 device." },
    ],
  }),
  component: MonitoringLayout,
});

function MonitoringLayout() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <Monitoring />;
}

function Monitoring() {
  const { readings: sensors, status, isEsp32Connected, secondsAgo, activeDeviceId } = useLiveSensors();
  const hazards = useHazardEvents(12);
  const [pulse, setPulse] = useState(0);
  useEffect(() => { setPulse((p) => p + 1); }, [sensors]);

  const statusTone = status === "open" ? "success" : status === "connecting" ? "warning" : "critical";
  const userLabs = useUserRecords("labs");
  const userDevices = useUserRecords("devices");
  const hiddenLabIds = useUserRecords("hiddenLabIds");
  const hiddenDeviceIds = useUserRecords("hiddenDeviceIds");
  const hideLabs = new Set(hiddenLabIds);
  const hideDevs = new Set(hiddenDeviceIds);
  const allLabs = userLabs.filter((l) => !hideLabs.has(l.id));
  const labNameSet = new Set(allLabs.map((l) => l.name));
  const allDevices = userDevices.filter(
    (d) => !hideDevs.has(d.id) && labNameSet.has(d.lab),
  );

  return (
    <div>
      <PageHeader
        title="Live Monitoring"
        description="Realtime gauges and telemetry from all connected ESP32 field devices."
        meta={
          <div className="flex flex-wrap items-center gap-3 text-mono text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <StatusDot tone={isEsp32Connected ? "success" : "critical"} />
              ESP32 Field Status · {isEsp32Connected ? "ONLINE" : "OFFLINE"}
            </span>
            <span>·</span>
            <span>wss://ywvgwnevbaenqyygbirr.supabase.co/realtime/v1</span>
            <span>·</span>
            <span>Frame #{pulse}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <AddLabDialog />
            <Button variant="outline" size="sm" className="h-8 rounded-sm text-xs">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
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
                      ESP32 FIELD HARDWARE ONLINE & CONNECTED
                    </h3>
                    <span className="font-mono text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      LIVE UPLINK ACTIVE (0.5 Hz)
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
                    <span>Active Node: <strong className="text-foreground">{activeDeviceId}</strong></span>
                    <span>·</span>
                    <span>Telemetry Status: <strong className="text-emerald-600 dark:text-emerald-400">Receiving field data ({secondsAgo}s ago)</strong></span>
                  </div>
                </div>
              </div>
              <div className="text-right text-mono text-[11px] text-muted-foreground">
                <div className="text-emerald-700 dark:text-emerald-400 font-semibold">SUPABASE REALTIME ACTIVE</div>
                <div>Sub-second Telemetry Broadcast</div>
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
                      ESP32 FIELD HARDWARE DISCONNECTED / OFFLINE
                    </h3>
                    <span className="font-mono text-[10px] bg-amber-500/30 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      NO LIVE TELEMETRY
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
                    <span>Expected Device: <strong className="text-foreground">{activeDeviceId}</strong></span>
                    <span>·</span>
                    <span>Status: <span className="text-amber-600 dark:text-amber-400 font-semibold">{secondsAgo !== null ? `Last seen ${secondsAgo}s ago` : "Waiting for ESP32 HTTP POST..."}</span></span>
                  </div>
                </div>
              </div>
              <a
                href="/integration"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline bg-card border border-border px-3 py-1.5 rounded-sm shrink-0 shadow-xs"
              >
                Flash / Connect ESP32 →
              </a>
            </div>
          </div>
        )}

        {/* Laboratory selector — drills into per-lab live monitoring */}
        <div className="rounded-sm border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-primary" /> Monitored Laboratories
              </div>
              <div className="text-[11px] text-muted-foreground">
                Click any lab below to open its dedicated live stream page with pure readings
              </div>
            </div>
            <Badge variant="outline" className="rounded-sm text-mono text-[10px] uppercase">
              {allLabs.length} labs
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {allLabs.map((lab) => {
              const tone = lab.status === "critical" ? "critical" : lab.status === "warning" ? "warning" : "success";
              const devicesInLab = allDevices.filter((d) => d.lab === lab.name).length;
              return (
                <a
                  key={lab.id}
                  href={`/monitoring/${lab.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col gap-2 bg-card p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">{lab.code}</div>
                      <div className="mt-0.5 text-sm font-semibold group-hover:text-primary transition-colors">{lab.name}</div>
                    </div>
                    <StatusDot tone={tone} />
                  </div>
                  <div className="text-[11px] text-muted-foreground">{lab.location}</div>
                  <div className="mt-auto flex items-center justify-between pt-2 text-mono text-[10px] text-muted-foreground">
                    <span>{devicesInLab} devices · {lab.incidents} incidents</span>
                    <span className="flex items-center gap-1 text-primary text-[10px] font-medium">
                      Open <ExternalLink className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Hazard event feed */}
        <div className="rounded-sm border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Live Hazard Events
              </div>
              <div className="text-[11px] text-muted-foreground">Streamed from WS · threshold breaches only</div>
            </div>
            <Badge variant="outline" className="rounded-sm text-mono text-[10px] uppercase">
              {hazards.length} in feed
            </Badge>
          </div>
          <ul className="max-h-56 divide-y divide-border overflow-y-auto">
            {hazards.length === 0 && (
              <li className="px-4 py-6 text-center text-xs text-muted-foreground">
                No hazard events. Feed is quiet — all sensors within thresholds.
              </li>
            )}
            {hazards.map((h) => (
              <li key={h.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  h.severity === "critical" && "bg-critical animate-pulse",
                  h.severity === "high" && "bg-warning animate-pulse",
                  h.severity === "medium" && "bg-warning",
                  h.severity === "low" && "bg-info",
                )} />
                <span className="text-mono text-[10px] text-muted-foreground">{h.id}</span>
                <span className="text-mono text-[10px] text-muted-foreground">
                  {new Date(h.at).toLocaleTimeString()}
                </span>
                <span className="text-xs font-medium">{h.lab}</span>
                <span className="text-xs text-muted-foreground">· {h.message}</span>
                <Badge variant="outline" className={cn(
                  "ml-auto rounded-sm text-mono text-[10px] uppercase",
                  h.severity === "critical" && "border-critical/30 bg-critical/10 text-critical",
                  h.severity === "high" && "border-warning/40 bg-warning/15 text-warning",
                  h.severity === "medium" && "border-warning/30 bg-warning/10 text-warning",
                  h.severity === "low" && "border-info/30 bg-info/10 text-info",
                )}>{h.severity}</Badge>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {sensors.map((s) => {
            const sev = sensorSeverity(s);
            const tone = sev === "critical" ? "critical" : sev === "medium" ? "warning" : "success";
            const pct = Math.min(100, Math.max(0, ((s.value - s.min) / (s.max - s.min)) * 100));
            const display = Number.isFinite(s.value)
              ? Math.abs(s.value) >= 100
                ? Math.round(s.value).toString()
                : s.value.toFixed(1)
              : "—";
            return (
              <div key={s.key} className="rounded-sm border border-border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  <StatusDot tone={tone} />
                </div>
                <div className="relative mt-3 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ v: pct }]} startAngle={225} endAngle={-45}>
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar dataKey="v" cornerRadius={2}
                        fill={tone === "critical" ? "var(--critical)" : tone === "warning" ? "var(--warning)" : "var(--success)"}
                        background={{ fill: "var(--muted)" }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-2">
                    <div className="text-mono text-xl font-semibold leading-none tabular-nums">{display}</div>
                    <div className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground">{s.unit}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-mono text-[10px] text-muted-foreground">
                  <div><div>Min</div><div className="text-foreground">{s.min}</div></div>
                  <div><div>Warn</div><div className="text-warning">{s.warn}</div></div>
                  <div><div>Crit</div><div className="text-critical">{s.critical}</div></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-sm border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="text-sm font-semibold">Rolling 24h Timeseries</div>
              <div className="text-[11px] text-muted-foreground">Sample rate: 60s · aggregated</div>
            </div>
          </div>
          <div className="h-72 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND_24H} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="hour" fontSize={10} tick={{ fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} tick={{ fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 11, borderRadius: 4 }} />
                <Line type="monotone" dataKey="mq2" stroke="var(--chart-1)" dot={false} strokeWidth={1.6} />
                <Line type="monotone" dataKey="mq135" stroke="var(--chart-2)" dot={false} strokeWidth={1.6} />
                <Line type="monotone" dataKey="temperature" stroke="var(--chart-3)" dot={false} strokeWidth={1.6} />
                <Line type="monotone" dataKey="humidity" stroke="var(--chart-5)" dot={false} strokeWidth={1.6} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-sm border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="text-sm font-semibold">Device Uplinks</div>
              <div className="text-[11px] text-muted-foreground">POST <code>/api/device/update</code> — MQTT topic <code>sentinel/&lt;deviceId&gt;/state</code></div>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-medium">Device</th>
                <th className="px-4 py-2 font-medium">Lab</th>
                <th className="px-4 py-2 font-medium">Firmware</th>
                <th className="px-4 py-2 font-medium">RSSI</th>
                <th className="px-4 py-2 font-medium">Battery</th>
                <th className="px-4 py-2 font-medium">Last seen</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {allDevices.map((d) => (
                <tr key={d.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-2.5 text-mono text-xs">{d.id}</td>
                  <td className="px-4 py-2.5 text-xs">{d.lab}</td>
                  <td className="px-4 py-2.5 text-mono text-xs">{d.firmware}</td>
                  <td className="px-4 py-2.5 text-mono text-xs">{d.rssi} dBm</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full",
                          d.battery > 40 ? "bg-success" : d.battery > 15 ? "bg-warning" : "bg-critical",
                        )} style={{ width: `${d.battery}%` }} />
                      </div>
                      <span className="text-mono text-xs">{d.battery}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-mono text-[11px] text-muted-foreground">
                    {new Date(d.lastSeen).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={cn(
                      "rounded-sm text-mono text-[10px] uppercase",
                      d.wifi === "connected" && "border-success/30 bg-success/10 text-success",
                      d.wifi === "unstable" && "border-warning/30 bg-warning/10 text-warning",
                      d.wifi === "offline" && "border-critical/30 bg-critical/10 text-critical",
                    )}>
                      {d.wifi === "offline" ? <WifiOff className="mr-1 h-3 w-3" /> : <Wifi className="mr-1 h-3 w-3" />}
                      {d.wifi}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
