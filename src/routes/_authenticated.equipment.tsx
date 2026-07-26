import { createFileRoute } from "@tanstack/react-router";
import { Wrench, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EQUIPMENT, type Equipment as EquipmentT } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ExportMenu } from "@/components/ExportMenu";
import { AddEquipmentDialog } from "@/components/AddEquipmentDialog";
import { useAuth } from "@/lib/auth";
import { useUserRecords, deleteEquipment } from "@/lib/user-records";
import type { ExportColumn } from "@/lib/export";
import { cn } from "@/lib/utils";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/equipment")({
  head: () => ({
    meta: [
      { title: "Equipment Registry · SENTINEL-G" },
      { name: "description", content: "Equipment registry with warranty, calibration and maintenance tracking." },
      { property: "og:title", content: "Equipment Registry · SENTINEL-G" },
      { property: "og:description", content: "Equipment registry with warranty, calibration and maintenance tracking." },
    ],
  }),
  component: Equipment,
});

function daysUntil(iso: string) {
  return Math.round((+new Date(iso) - Date.now()) / 86400000);
}

const EQ_COLS: ExportColumn<EquipmentT>[] = [
  { key: "id", header: "Asset ID" },
  { key: "name", header: "Name" },
  { key: "lab", header: "Lab" },
  { key: "purchased", header: "Purchased" },
  { key: "warranty", header: "Warranty" },
  { key: "warrantyDays", header: "Days to Warranty End", format: (r) => daysUntil(r.warranty) },
  { key: "calibration", header: "Last Calibration" },
  { key: "nextMaintenance", header: "Next Maintenance" },
  { key: "maintenanceDays", header: "Days to Maintenance", format: (r) => daysUntil(r.nextMaintenance) },
  { key: "status", header: "Status" },
];

function Equipment() {
  const { can } = useAuth();
  const added = useUserRecords("equipment");
  const rows = [...added, ...EQUIPMENT];
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <div>
      <PageHeader
        title="Equipment Registry"
        description="Lab equipment with warranty, calibration and preventive maintenance schedules."
        actions={
          <>
            <ExportMenu
              rows={rows}
              columns={EQ_COLS}
              meta={{ title: "Equipment Registry", filename: "sentinel-equipment", subtitle: `${rows.length} assets` }}
            />
            {can("equipment_manage") && <AddEquipmentDialog />}
          </>
        }
      />

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-sm border border-border bg-card p-6 shadow-lg max-w-sm w-full mx-4">
            <h3 className="text-sm font-semibold text-foreground">Delete Equipment</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Are you sure you want to delete <strong>{confirmId}</strong>? This will remove it permanently.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirmId(null)} className="rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60">Cancel</button>
              <button onClick={() => { deleteEquipment(confirmId); setConfirmId(null); }} className="rounded-sm bg-critical px-3 py-1.5 text-xs font-medium text-white hover:bg-critical/90">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="overflow-hidden rounded-sm border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-medium">Asset</th>
                <th className="px-4 py-2 font-medium">Lab</th>
                <th className="px-4 py-2 font-medium">Purchased</th>
                <th className="px-4 py-2 font-medium">Warranty</th>
                <th className="px-4 py-2 font-medium">Last Calibration</th>
                <th className="px-4 py-2 font-medium">Next Maintenance</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary/10 text-primary">
                        <Wrench className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{e.name}</div>
                        <div className="text-mono text-[10px] text-muted-foreground">{e.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{e.lab}</td>
                  <td className="px-4 py-2.5 text-mono text-xs">{e.purchased}</td>
                  <td className="px-4 py-2.5 text-mono text-xs">{e.warranty}</td>
                  <td className="px-4 py-2.5 text-mono text-xs">{e.calibration}</td>
                  <td className="px-4 py-2.5 text-mono text-xs">{e.nextMaintenance}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={cn(
                      "rounded-sm text-mono text-[10px] uppercase",
                      e.status === "operational" && "border-success/30 bg-success/10 text-success",
                      e.status === "service_due" && "border-warning/30 bg-warning/10 text-warning",
                      e.status === "out_of_service" && "border-critical/30 bg-critical/10 text-critical",
                    )}>{e.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => setConfirmId(e.id)} className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[10px] font-medium text-critical hover:bg-critical/10 transition-colors" title="Delete equipment">
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
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
