import { createFileRoute } from "@tanstack/react-router";
import { Gauge } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CALIBRATIONS, type Calibration } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ExportMenu } from "@/components/ExportMenu";
import { AddCalibrationDialog } from "@/components/AddCalibrationDialog";
import { useAuth } from "@/lib/auth";
import { useUserRecords } from "@/lib/user-records";
import type { ExportColumn } from "@/lib/export";
import { cn } from "@/lib/utils";

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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
