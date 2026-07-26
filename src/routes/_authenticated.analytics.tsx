import { createFileRoute } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { INCIDENT_WEEK, INCIDENTS } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · SENTINEL-G" },
      { name: "description", content: "Trends, hazard frequency, equipment health and category breakdowns." },
      { property: "og:title", content: "Analytics · SENTINEL-G" },
      { property: "og:description", content: "Trends, hazard frequency and category breakdowns." },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const bySensor = INCIDENTS.reduce<Record<string, number>>((acc, i) => {
    acc[i.sensor] = (acc[i.sensor] ?? 0) + 1;
    return acc;
  }, {});
  const pie = Object.entries(bySensor).map(([name, value]) => ({ name, value }));
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Aggregate insights across time, sensors, labs and equipment health."
      />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label="Weekly incidents" value="24" delta="+8%" />
          <Kpi label="Avg. Temperature" value="27.1°C" delta="±0.4" />
          <Kpi label="Avg. Air Quality" value="132 ppm" delta="-6%" />
          <Kpi label="Equipment Uptime" value="98.7%" delta="+0.2%" />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-sm border border-border bg-card lg:col-span-2">
            <div className="border-b border-border px-4 py-3">
              <div className="text-sm font-semibold">Incidents by Severity (7d)</div>
              <div className="text-[11px] text-muted-foreground">Stacked by severity class</div>
            </div>
            <div className="h-72 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={INCIDENT_WEEK}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="day" fontSize={10} tick={{ fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} tick={{ fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 11, borderRadius: 4 }} />
                  <Bar dataKey="low" stackId="a" fill="var(--info)" />
                  <Bar dataKey="medium" stackId="a" fill="var(--warning)" />
                  <Bar dataKey="high" stackId="a" fill="var(--chart-3)" />
                  <Bar dataKey="critical" stackId="a" fill="var(--critical)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-sm border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <div className="text-sm font-semibold">Top Incident Categories</div>
              <div className="text-[11px] text-muted-foreground">By triggering sensor</div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="75%" paddingAngle={2}>
                    {pie.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 11, borderRadius: 4 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <div className="text-mono text-2xl font-semibold">{value}</div>
        <div className="text-mono text-[11px] text-muted-foreground">{delta}</div>
      </div>
    </div>
  );
}
