import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Filter, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { INCIDENTS, type Severity } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "./_authenticated.dashboard";
import { ExportMenu } from "@/components/ExportMenu";
import type { ExportColumn } from "@/lib/export";
import type { Incident } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/incidents")({
  head: () => ({
    meta: [
      { title: "Incidents · SENTINEL-G" },
      { name: "description", content: "Chronological incident log with severity, resolution and export to CSV / PDF." },
      { property: "og:title", content: "Incidents · SENTINEL-G" },
      { property: "og:description", content: "Chronological incident log with severity, resolution and export." },
    ],
  }),
  component: Incidents,
});

const INCIDENT_COLS: ExportColumn<Incident>[] = [
  { key: "id", header: "Incident ID" },
  { key: "timestamp", header: "Timestamp (ISO)", format: (r) => new Date(r.timestamp).toISOString() },
  { key: "lab", header: "Laboratory" },
  { key: "sensor", header: "Sensor" },
  { key: "severity", header: "Severity" },
  { key: "status", header: "Status" },
  { key: "resolvedBy", header: "Resolved By", format: (r) => r.resolvedBy ?? "—" },
  { key: "remarks", header: "Remarks" },
];

function Incidents() {
  const [q, setQ] = useState("");
  const [sev, setSev] = useState<Severity | "all">("all");

  const filtered = INCIDENTS.filter((i) => {
    if (sev !== "all" && i.severity !== sev) return false;
    if (q && !`${i.id} ${i.lab} ${i.sensor} ${i.remarks}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Incident Log"
        description="Every threshold breach and manual entry, signed and timestamped."
        actions={
          <ExportMenu
            rows={filtered}
            columns={INCIDENT_COLS}
            meta={{
              title: "Incident Log",
              filename: "sentinel-incidents",
              subtitle: `${filtered.length} incident${filtered.length === 1 ? "" : "s"} · severity filter: ${sev}`,
            }}
          />
        }
      />


      <div className="p-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2 rounded-sm border border-border bg-card p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, lab, sensor…" className="h-8 w-72 rounded-sm pl-7 text-xs" />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Severity:
          </div>
          {(["all", "low", "medium", "high", "critical"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSev(s as Severity | "all")}
              className={cn(
                "rounded-sm border px-2 py-1 text-mono text-[10px] uppercase tracking-wider",
                sev === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/40",
              )}
            >{s}</button>
          ))}
          <div className="ml-auto text-mono text-[11px] text-muted-foreground">{filtered.length} of {INCIDENTS.length}</div>
        </div>

        <div className="overflow-hidden rounded-sm border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-medium">ID</th>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Lab</th>
                <th className="px-4 py-2 font-medium">Sensor</th>
                <th className="px-4 py-2 font-medium">Severity</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Resolved by</th>
                <th className="px-4 py-2 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-2.5 text-mono text-xs">{i.id}</td>
                  <td className="px-4 py-2.5 text-mono text-[11px] text-muted-foreground">
                    {new Date(i.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-xs">{i.lab}</td>
                  <td className="px-4 py-2.5 text-mono text-xs">{i.sensor}</td>
                  <td className="px-4 py-2.5"><SeverityBadge severity={i.severity} /></td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={cn(
                      "rounded-sm text-mono text-[10px] uppercase",
                      i.status === "open" && "border-critical/30 bg-critical/10 text-critical",
                      i.status === "acknowledged" && "border-warning/30 bg-warning/10 text-warning",
                      i.status === "resolved" && "border-success/30 bg-success/10 text-success",
                    )}>{i.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{i.resolvedBy ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{i.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
