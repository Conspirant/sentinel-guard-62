import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ShieldAlert, Radio, Phone } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { HAZARD_GUIDANCE, LIVE_SENSORS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SeverityBadge } from "./_authenticated.dashboard";

export const Route = createFileRoute("/_authenticated/guidance")({
  head: () => ({
    meta: [
      { title: "Hazard Guidance · SENTINEL-G" },
      { name: "description", content: "Codified Standard Operating Procedures for every detected hazard class." },
      { property: "og:title", content: "Hazard Guidance · SENTINEL-G" },
      { property: "og:description", content: "SOP-driven hazard response with PPE, precautions and emergency contacts." },
    ],
  }),
  component: Guidance,
});

function Guidance() {
  const keys = Object.keys(HAZARD_GUIDANCE);
  const [active, setActive] = useState(keys[0]);
  const g = HAZARD_GUIDANCE[active];
  const sensor = LIVE_SENSORS.find((s) => s.key === active);

  return (
    <div>
      <PageHeader
        title="Hazard Guidance"
        description="SOP-driven response playbooks. Automatically triggered when sensor thresholds are exceeded."
        actions={
          <Button variant="outline" size="sm" className="h-8 rounded-sm text-xs">
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Simulate Alert
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        {/* Hazard classes */}
        <aside className="border-r border-border bg-card">
          <div className="border-b border-border px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            Hazard Classes
          </div>
          <ul>
            {keys.map((k) => {
              const gg = HAZARD_GUIDANCE[k];
              return (
                <li key={k}>
                  <button
                    onClick={() => setActive(k)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left hover:bg-muted/40",
                      active === k && "bg-muted/60",
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm",
                      gg.severity === "critical" ? "bg-critical/10 text-critical" :
                      gg.severity === "high" ? "bg-warning/10 text-warning" :
                      gg.severity === "medium" ? "bg-warning/10 text-warning" : "bg-info/10 text-info",
                    )}>
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{gg.hazard}</div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-mono text-[10px] uppercase text-muted-foreground">{k}</span>
                        <SeverityBadge severity={gg.severity} />
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Detail */}
        <div className="p-6 space-y-4">
          <div className="rounded-sm border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Active playbook</div>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">{g.hazard}</h2>
                <div className="mt-2 flex items-center gap-2">
                  <SeverityBadge severity={g.severity} />
                  {sensor && (
                    <Badge variant="outline" className="rounded-sm text-mono text-[10px]">
                      <Radio className="mr-1 h-3 w-3" /> Trigger: {sensor.label}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right text-mono text-[10px] uppercase text-muted-foreground">
                SOP-{active.toUpperCase()}-001
                <div className="text-muted-foreground/70">Rev 3 · Verified 2026-07-01</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Card title="Immediate Actions" tone="critical" items={g.immediate} numbered />
            <Card title="Required PPE" tone="info" items={g.ppe} />
            <Card title="Safety Precautions" tone="warning" items={g.precautions} />
            <Card title="Emergency SOP" tone="warning" items={g.sop} numbered />
          </div>

          <div className="rounded-sm border border-border bg-card">
            <div className="border-b border-border px-4 py-3 text-sm font-semibold">Emergency Contacts</div>
            <ul className="divide-y divide-border">
              {g.contacts.map((c) => (
                <li key={c.name} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-critical/10 text-critical">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-mono text-xs text-muted-foreground">{c.phone}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 rounded-sm text-xs">Call</Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, items, tone, numbered }: {
  title: string; items: string[]; tone: "critical" | "warning" | "info"; numbered?: boolean;
}) {
  return (
    <div className="rounded-sm border border-border bg-card">
      <div className={cn(
        "flex items-center justify-between border-b border-border px-4 py-2.5",
      )}>
        <div className="text-sm font-semibold">{title}</div>
        <span className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "critical" && "bg-critical",
          tone === "warning" && "bg-warning",
          tone === "info" && "bg-info",
        )} />
      </div>
      <ol className="p-4 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 py-1.5">
            <span className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-mono text-[10px] font-semibold",
              tone === "critical" && "bg-critical/10 text-critical",
              tone === "warning" && "bg-warning/10 text-warning",
              tone === "info" && "bg-info/10 text-info",
            )}>
              {numbered ? i + 1 : "•"}
            </span>
            <span className="text-foreground/90">{it}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
