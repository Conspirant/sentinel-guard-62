import { createFileRoute } from "@tanstack/react-router";
import { Gauge, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CALIBRATIONS, type Calibration } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ExportMenu } from "@/components/ExportMenu";
import { AddCalibrationDialog } from "@/components/AddCalibrationDialog";
import { useAuth } from "@/lib/auth";
import { useUserRecords, deleteCalibration } from "@/lib/user-records";
import type { ExportColumn } from "@/lib/export";
import { cn } from "@/lib/utils";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/calibration")({
  head: () => ({
    meta: [
      { title: "Calibration · SENTINEL-G" },
      { name: "description", content: "Sensor calibration logs and automatic due-date reminders." },
      { property: "og:title", content: "Calibration · SENTINEL-G" },
      { property: "og:description", content: "Sensor calibration logs and automatic reminders." },
    ],
  }),
  component: CalibrationPage,
});

function daysUntil(iso: string) {
  return Math.round((+new Date(iso) - Date.now()) / 86400000);
}

const CAL_COLS: ExportColumn<Calibration>[] = [
  { key: "id", header: "Record" },
  { key: "sensor", header: "Sensor" },
  { key: "device", header: "Device" },
  { key: "lastCalibrated", header: "Last Calibrated" },
  { key: "nextDue", header: "Next Due" },
  { key: "daysToDue", header: "Days to Due", format: (r) => daysUntil(r.nextDue) },
  { key: "technician", header: "Technician" },
  { key: "status", header: "Status" },
];

function CalibrationPage() {
  const { can } = useAuth();
  const added = useUserRecords("calibrations");
  const rows = [...added, ...CALIBRATIONS];
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <div>
      <PageHeader
        title="Calibration Records"
        description="MQ2, MQ135, DHT22 and future sensors — with automatic recalibration reminders."
        actions={
          <>
            <ExportMenu
              rows={rows}
              columns={CAL_COLS}
              meta={{ title: "Calibration Records", filename: "sentinel-calibration", subtitle: `${rows.length} records` }}
            />
            {can("calibrate") && <AddCalibrationDialog />}
          </>
        }
      />

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-sm border border-border bg-card p-6 shadow-lg max-w-sm w-full mx-4">
            <h3 className="text-sm font-semibold text-foreground">Delete Calibration Record</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Are you sure you want to delete <strong>{confirmId}</strong>? This will remove it permanently.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirmId(null)} className="rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60">Cancel</button>
              <button onClick={() => { deleteCalibration(confirmId); setConfirmId(null); }} className="rounded-sm bg-critical px-3 py-1.5 text-xs font-medium text-white hover:bg-critical/90">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="overflow-hidden rounded-sm border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-medium">Record</th>
                <th className="px-4 py-2 font-medium">Sensor</th>
                <th className="px-4 py-2 font-medium">Device</th>
                <th className="px-4 py-2 font-medium">Last Calibrated</th>
                <th className="px-4 py-2 font-medium">Next Due</th>
                <th className="px-4 py-2 font-medium">Technician</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-2.5 text-mono text-xs">{c.id}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-3.5 w-3.5 text-primary" />
                      <span className="text-mono text-xs">{c.sensor}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-mono text-xs">{c.device}</td>
                  <td className="px-4 py-2.5 text-mono text-xs">{c.lastCalibrated}</td>
                  <td className="px-4 py-2.5 text-mono text-xs">{c.nextDue}</td>
                  <td className="px-4 py-2.5 text-xs">{c.technician}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={cn(
                      "rounded-sm text-mono text-[10px] uppercase",
                      c.status === "valid" && "border-success/30 bg-success/10 text-success",
                      c.status === "due_soon" && "border-warning/30 bg-warning/10 text-warning",
                      c.status === "overdue" && "border-critical/30 bg-critical/10 text-critical",
                    )}>{c.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => setConfirmId(c.id)} className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[10px] font-medium text-critical hover:bg-critical/10 transition-colors" title="Delete calibration record">
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
