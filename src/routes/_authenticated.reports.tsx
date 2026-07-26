import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports · SENTINEL-G" },
      { name: "description", content: "Generate incident, safety audit, equipment, calibration and chemical reports." },
      { property: "og:title", content: "Reports · SENTINEL-G" },
      { property: "og:description", content: "Generate incident, safety, equipment, calibration and chemical reports." },
    ],
  }),
  component: Reports,
});

const REPORTS = [
  { name: "Incident Report", desc: "Full incident log with severity, resolution and remarks.", period: "Weekly" },
  { name: "Safety Audit", desc: "Compliance snapshot across all labs and equipment.", period: "Monthly" },
  { name: "Equipment Report", desc: "Asset inventory, warranty, calibration & maintenance.", period: "Quarterly" },
  { name: "Calibration Report", desc: "Sensor calibration status and history per device.", period: "Monthly" },
  { name: "Chemical Report", desc: "Chemical inventory with expiry and hazard summary.", period: "Monthly" },
];

function Reports() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate signed reports for compliance, audits and executive review."
      />
      <div className="p-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((r) => (
          <div key={r.name} className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">{r.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{r.desc}</div>
                <div className="mt-2 text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Cadence: {r.period}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
              <Button variant="outline" size="sm" className="h-8 rounded-sm text-xs"><Download className="mr-1.5 h-3.5 w-3.5" />CSV</Button>
              <Button variant="outline" size="sm" className="h-8 rounded-sm text-xs"><Download className="mr-1.5 h-3.5 w-3.5" />Excel</Button>
              <Button size="sm" className="h-8 rounded-sm text-xs"><Download className="mr-1.5 h-3.5 w-3.5" />PDF</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
