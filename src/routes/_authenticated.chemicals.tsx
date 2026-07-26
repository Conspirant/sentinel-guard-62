import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CHEMICALS, type Chemical } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ExportMenu } from "@/components/ExportMenu";
import { AddChemicalDialog } from "@/components/AddChemicalDialog";
import { useAuth } from "@/lib/auth";
import { useUserRecords } from "@/lib/user-records";
import type { ExportColumn } from "@/lib/export";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chemicals")({
  head: () => ({
    meta: [
      { title: "Chemical Inventory · SENTINEL-G" },
      { name: "description", content: "Chemicals inventory with hazard class, cabinet, quantity, expiry and MSDS." },
      { property: "og:title", content: "Chemical Inventory · SENTINEL-G" },
      { property: "og:description", content: "Chemical inventory with hazard class, expiry alerts and MSDS." },
    ],
  }),
  component: Chemicals,
});

function daysUntil(iso: string) {
  return Math.round((+new Date(iso) - Date.now()) / 86400000);
}

const CHEM_COLS: ExportColumn<Chemical>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Chemical" },
  { key: "cabinet", header: "Cabinet" },
  { key: "quantity", header: "Quantity" },
  { key: "safetyClass", header: "Safety Class" },
  { key: "hazard", header: "Hazard" },
  { key: "expiry", header: "Expiry" },
  { key: "daysToExpiry", header: "Days to Expiry", format: (r) => daysUntil(r.expiry) },
  {
    key: "expiryStatus",
    header: "Expiry Status",
    format: (r) => {
      const d = daysUntil(r.expiry);
      if (d < 0) return "expired";
      if (d < 30) return "critical";
      if (d < 90) return "due soon";
      return "ok";
    },
  },
];

function Chemicals() {
  const { can } = useAuth();
  const added = useUserRecords("chemicals");
  const rows = [...added, ...CHEMICALS];
  return (
    <div>
      <PageHeader
        title="Chemical Inventory"
        description="Tracked reagents, solvents and oxidizers with expiry, hazard class and MSDS reference."
        actions={
          <>
            <ExportMenu
              rows={rows}
              columns={CHEM_COLS}
              meta={{ title: "Chemical Inventory", filename: "sentinel-chemicals", subtitle: `${rows.length} entries` }}
            />
            {can("chemicals_manage") && <AddChemicalDialog />}
          </>
        }
      />




      <div className="p-6">
        <div className="overflow-hidden rounded-sm border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-medium">ID</th>
                <th className="px-4 py-2 font-medium">Chemical</th>
                <th className="px-4 py-2 font-medium">Cabinet</th>
                <th className="px-4 py-2 font-medium">Quantity</th>
                <th className="px-4 py-2 font-medium">Class</th>
                <th className="px-4 py-2 font-medium">Hazard</th>
                <th className="px-4 py-2 font-medium">Expiry</th>
                <th className="px-4 py-2 font-medium">MSDS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const days = daysUntil(c.expiry);
                const expiryTone = days < 30 ? "critical" : days < 90 ? "warning" : "muted";
                return (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-2.5 text-mono text-xs">{c.id}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary/10 text-primary">
                          <FlaskConical className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-mono text-xs">{c.cabinet}</td>
                    <td className="px-4 py-2.5 text-mono text-xs">{c.quantity}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{c.safetyClass}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={cn(
                        "rounded-sm text-mono text-[10px] uppercase",
                        c.hazard === "Flammable" && "border-warning/30 bg-warning/10 text-warning",
                        c.hazard === "Corrosive" && "border-critical/30 bg-critical/10 text-critical",
                        c.hazard === "Toxic" && "border-critical/30 bg-critical/10 text-critical",
                        c.hazard === "Oxidizer" && "border-warning/30 bg-warning/10 text-warning",
                      )}>{c.hazard}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-mono text-xs">{c.expiry}</span>
                        {days < 90 && (
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-mono text-[10px]",
                            expiryTone === "critical" && "bg-critical/10 text-critical",
                            expiryTone === "warning" && "bg-warning/10 text-warning",
                          )}>
                            <AlertTriangle className="h-3 w-3" />
                            {days}d
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <a href={c.msds} className="text-xs text-primary hover:underline">View →</a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
