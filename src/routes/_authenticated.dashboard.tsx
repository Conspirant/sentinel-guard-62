import { createFileRoute, Link } from "@tanstack/react-router";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import {
  ShieldCheck, AlertTriangle, ShieldAlert, Activity, Wind, Thermometer,
  Droplets, Flame, Power, Fan, Wifi, ArrowUpRight, Cpu,
} from "lucide-react";
import { PageHeader, StatusDot } from "@/components/PageHeader";
import { ACTUATORS, LABS, DEVICES, INCIDENTS, TREND_24H, sensorSeverity } from "@/lib/mock-data";
import { useLiveSensors } from "@/lib/live-stream";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Console · SENTINEL-G" },
      { name: "description", content: "Live safety status across every connected laboratory — gas, air, thermal and device telemetry with hazard triage." },
      { property: "og:title", content: "Command Console · SENTINEL-G" },
      { property: "og:description", content: "Live safety status across every connected laboratory in one console." },
    ],
  }),
  component: Dashboard,
});

const SENSOR_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  mq2: Flame, mq135: Wind, temp: Thermometer, humidity: Droplets, smoke: Activity,
};

function Dashboard() {
  const { readings: liveSensors, status: wsStatus } = useLiveSensors();
  const totalDevices = DEVICES.length;
  const onlineDevices = DEVICES.filter((d) => d.wifi !== "offline").length;
  const openIncidents = INCIDENTS.filter((i) => i.status !== "resolved").length;
  const criticalLabs = LABS.filter((l) => l.status === "critical").length;

  return (
    <div>
      <PageHeader
        title="Command Console"
        description="Aggregate safety posture across all connected laboratories and field devices."
        meta={
          <div className="flex flex-wrap items-center gap-3 text-mono text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <StatusDot tone={wsStatus === "open" ? "success" : wsStatus === "connecting" ? "warning" : "critical"} />
              WS · {wsStatus}
            </span>
            <span>·</span>
            <span>SYNC {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            <span>·</span>
            <span>UPLINK MQTT/REST/WS</span>
          </div>
        }
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 rounded-sm text-xs" asChild>
              <Link to="/reports"><ArrowUpRight className="mr-1 h-3.5 w-3.5" /> Export snapshot</Link>
            </Button>
            <Button size="sm" className="h-8 rounded-sm text-xs" asChild>
              <Link to="/monitoring">Open Live Monitoring</Link>
            </Button>
          </>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label="Laboratories" value={String(LABS.length)} sub={`${criticalLabs} critical`} tone={criticalLabs ? "critical" : "success"} icon={ShieldCheck} />
          <Kpi label="Devices online" value={`${onlineDevices}/${totalDevices}`} sub="ESP32 uplink" tone={onlineDevices === totalDevices ? "success" : "warning"} icon={Cpu} />
          <Kpi label="Open incidents" value={String(openIncidents)} sub="past 24h" tone={openIncidents > 0 ? "warning" : "success"} icon={AlertTriangle} />
          <Kpi label="Response SLA" value="1.4s" sub="ingest → alert" tone="success" icon={Activity} />
        </div>

        {/* Sensors */}
        <section>
          <SectionTitle title="Live Sensors" note="Realtime · updates every 2s (dummy feed)" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {liveSensors.map((s) => {
              const sev = sensorSeverity(s);
              const Icon = SENSOR_ICON[s.key] ?? Activity;
              const pct = Math.min(100, Math.max(0, ((s.value - s.min) / (s.max - s.min)) * 100));
              const tone = sev === "critical" ? "critical" : sev === "medium" ? "warning" : "success";
              return (
                <div key={s.key} className="rounded-sm border border-border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-sm",
                        tone === "critical" && "bg-critical/10 text-critical",
                        tone === "warning" && "bg-warning/10 text-warning",
                        tone === "success" && "bg-success/10 text-success",
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
                        <div className="text-mono text-xl font-semibold text-foreground">
                          {s.value}<span className="ml-0.5 text-xs text-muted-foreground">{s.unit}</span>
                        </div>
                      </div>
                    </div>
                    <StatusDot tone={tone === "critical" ? "critical" : tone === "warning" ? "warning" : "success"} />
                  </div>

                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full",
                          tone === "critical" && "bg-critical",
                          tone === "warning" && "bg-warning",
                          tone === "success" && "bg-success",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-mono text-[10px] text-muted-foreground">
                      <span>{s.min}</span>
                      <span>WARN {s.warn}</span>
                      <span className="text-critical/80">CRIT {s.critical}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Trend + actuators */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-sm border border-border bg-card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <div className="text-sm font-semibold">24h Environmental Trend</div>
                <div className="text-[11px] text-muted-foreground">MQ2 · MQ135 · Temperature</div>
              </div>
              <div className="flex gap-2 text-[10px] text-mono uppercase tracking-wider text-muted-foreground">
                <LegendDot color="var(--chart-1)" label="MQ2" />
                <LegendDot color="var(--chart-2)" label="MQ135" />
                <LegendDot color="var(--chart-3)" label="Temp" />
              </div>
            </div>
            <div className="h-64 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TREND_24H} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="hour" fontSize={10} tick={{ fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} tick={{ fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)", border: "1px solid var(--border)",
                      fontSize: 11, borderRadius: 4,
                    }}
                  />
                  <Area type="monotone" dataKey="mq2" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={1.6} />
                  <Area type="monotone" dataKey="mq135" stroke="var(--chart-2)" fill="url(#g2)" strokeWidth={1.6} />
                  <Area type="monotone" dataKey="temperature" stroke="var(--chart-3)" fill="none" strokeWidth={1.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-sm border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <div className="text-sm font-semibold">Actuator State</div>
              <div className="text-[11px] text-muted-foreground">Relays, fans, alarms</div>
            </div>
            <div className="divide-y divide-border">
              {ACTUATORS.map((a) => {
                const Icon = a.key === "fan" ? Fan : a.key === "buzzer" ? ShieldAlert : Power;
                const on = a.state === "ON";
                return (
                  <div key={a.key} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-4 w-4", on ? "text-success" : "text-muted-foreground")} />
                      <div>
                        <div className="text-sm font-medium">{a.label}</div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{a.key}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      "rounded-sm text-mono text-[10px]",
                      on && "border-success/30 bg-success/10 text-success",
                      a.state === "AUTO" && "border-info/30 bg-info/10 text-info",
                    )}>{a.state}</Badge>
                  </div>
                );
              })}

              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Wifi className="h-4 w-4 text-success" />
                  <div>
                    <div className="text-sm font-medium">MQTT Broker</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">mqtt://sentinel.local:1883</div>
                  </div>
                </div>
                <Badge variant="outline" className="rounded-sm border-success/30 bg-success/10 text-mono text-[10px] text-success">CONNECTED</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Labs + incidents */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-sm border border-border bg-card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="text-sm font-semibold">Laboratory Status</div>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                <Link to="/labs">All labs →</Link>
              </Button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Lab</th>
                  <th className="px-4 py-2 font-medium">Location</th>
                  <th className="px-4 py-2 font-medium">Devices</th>
                  <th className="px-4 py-2 font-medium">Incidents</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {LABS.map((l) => (
                  <tr key={l.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{l.name}</div>
                      <div className="text-mono text-[10px] text-muted-foreground">{l.code}</div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{l.location}</td>
                    <td className="px-4 py-2.5 text-mono text-xs">{l.devices}</td>
                    <td className="px-4 py-2.5 text-mono text-xs">{l.incidents}</td>
                    <td className="px-4 py-2.5">
                      <LabBadge status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-sm border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="text-sm font-semibold">Recent Incidents</div>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                <Link to="/incidents">View all →</Link>
              </Button>
            </div>
            <ul className="divide-y divide-border">
              {INCIDENTS.slice(0, 5).map((i) => (
                <li key={i.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-mono text-[11px] text-muted-foreground">{i.id}</div>
                    <SeverityBadge severity={i.severity} />
                  </div>
                  <div className="mt-1 text-sm font-medium">{i.lab} · {i.sensor}</div>
                  <div className="line-clamp-1 text-xs text-muted-foreground">{i.remarks}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Kpi({
  label, value, sub, tone, icon: Icon,
}: {
  label: string; value: string; sub: string;
  tone: "success" | "warning" | "critical";
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <Icon className={cn(
          "h-4 w-4",
          tone === "critical" && "text-critical",
          tone === "warning" && "text-warning",
          tone === "success" && "text-success",
        )} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-mono text-2xl font-semibold tracking-tight">{value}</div>
        <div className={cn(
          "text-[10px] uppercase tracking-widest",
          tone === "critical" && "text-critical",
          tone === "warning" && "text-warning",
          tone === "success" && "text-success",
        )}>{sub}</div>
      </div>
    </div>
  );
}

export function LabBadge({ status }: { status: "safe" | "warning" | "critical" }) {
  const map = {
    safe: { label: "Safe", cls: "border-success/30 bg-success/10 text-success" },
    warning: { label: "Warning", cls: "border-warning/30 bg-warning/10 text-warning" },
    critical: { label: "Critical", cls: "border-critical/30 bg-critical/10 text-critical" },
  } as const;
  const m = map[status];
  return <Badge variant="outline" className={cn("rounded-sm text-mono text-[10px] uppercase tracking-wider", m.cls)}>{m.label}</Badge>;
}

export function SeverityBadge({ severity }: { severity: "normal" | "low" | "medium" | "high" | "critical" }) {
  const map = {
    normal: "border-success/30 bg-success/10 text-success",
    low: "border-info/30 bg-info/10 text-info",
    medium: "border-warning/30 bg-warning/10 text-warning",
    high: "border-warning/40 bg-warning/15 text-warning",
    critical: "border-critical/30 bg-critical/10 text-critical",
  } as const;
  return (
    <Badge variant="outline" className={cn("rounded-sm text-mono text-[10px] uppercase tracking-wider", map[severity])}>
      {severity}
    </Badge>
  );
}
