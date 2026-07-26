import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Cpu, Wifi, WifiOff, Battery, Signal, UploadCloud, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { DEVICES, LABS, type Device } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { AddDeviceDialog } from "@/components/AddDeviceDialog";
import { useUserRecords, updateDevice, deleteDevice } from "@/lib/user-records";

export const Route = createFileRoute("/_authenticated/devices")({
  head: () => ({
    meta: [
      { title: "Devices · SENTINEL-G" },
      { name: "description", content: "ESP32 fleet: firmware, signal, battery and OTA management." },
      { property: "og:title", content: "Devices · SENTINEL-G" },
      { property: "og:description", content: "ESP32 fleet: firmware, signal, battery and OTA management." },
    ],
  }),
  component: Devices,
});

const LATEST_FIRMWARE = "1.4.3";
const ALL = "__all__";

type Health = "healthy" | "degraded" | "unreachable";
function healthOf(d: Device): Health {
  if (d.wifi === "offline" || d.battery <= 15) return "unreachable";
  if (d.wifi === "unstable" || d.rssi < -80 || d.battery <= 40) return "degraded";
  return "healthy";
}

function Devices() {
  const userDevices = useUserRecords("devices");
  const userLabs = useUserRecords("labs");
  const hiddenDeviceIds = useUserRecords("hiddenDeviceIds");
  const hiddenLabIds = useUserRecords("hiddenLabIds");

  const allLabs = useMemo(() => {
    const hide = new Set(hiddenLabIds);
    return userLabs.filter((l) => !hide.has(l.id));
  }, [userLabs, hiddenLabIds]);

  const activeLabNames = useMemo(() => new Set(allLabs.map((l) => l.name)), [allLabs]);

  const devices = useMemo(() => {
    const hide = new Set(hiddenDeviceIds);
    return userDevices.filter(
      (d) => !hide.has(d.id) && activeLabNames.has(d.lab),
    );
  }, [userDevices, hiddenDeviceIds, activeLabNames]);


  
  const firmwareOptions = useMemo(
    () => Array.from(new Set(devices.map((d) => d.firmware))).sort(),
    [devices],
  );

  const [q, setQ] = useState("");
  const [labFilter, setLabFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [fwFilter, setFwFilter] = useState<string>(ALL);
  const [healthFilter, setHealthFilter] = useState<string>(ALL);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return devices.filter((d) => {
      if (labFilter !== ALL && d.lab !== labFilter) return false;
      if (statusFilter !== ALL && d.wifi !== statusFilter) return false;
      if (fwFilter !== ALL && d.firmware !== fwFilter) return false;
      if (healthFilter !== ALL && healthOf(d) !== healthFilter) return false;
      if (needle) {
        const hay = `${d.id} ${d.mac} ${d.lab} ${d.firmware}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [devices, q, labFilter, statusFilter, fwFilter, healthFilter]);

  const anyFilter =
    q !== "" || labFilter !== ALL || statusFilter !== ALL || fwFilter !== ALL || healthFilter !== ALL;
  const resetFilters = () => {
    setQ(""); setLabFilter(ALL); setStatusFilter(ALL); setFwFilter(ALL); setHealthFilter(ALL);
  };

  const [ota, setOta] = useState<{ open: boolean; device?: Device; bulk?: boolean }>({ open: false });
  const [cfg, setCfg] = useState<{ open: boolean; device?: Device }>({ open: false });
  const [confirmDelete, setConfirmDelete] = useState<Device | null>(null);

  const reboot = (d: Device) => {
    updateDevice(d.id, { wifi: "unstable", lastSeen: new Date().toISOString() });
    toast.info(`Reboot command sent`, { description: `${d.id} · reconnecting…` });
    setTimeout(() => {
      updateDevice(d.id, { wifi: "connected", lastSeen: new Date().toISOString() });
      toast.success(`${d.id} back online`);
    }, 2200);
  };

  const confirmedDelete = () => {
    if (!confirmDelete) return;
    deleteDevice(confirmDelete.id);
    toast.success(`${confirmDelete.id} removed from fleet`);
    setConfirmDelete(null);
  };

  return (
    <div>
      <PageHeader
        title="ESP32 Device Fleet"
        description="Field devices with firmware, uplink health and OTA update controls."
        meta={
          <div className="text-mono text-[11px] text-muted-foreground">
            {filtered.length} of {devices.length} device{devices.length === 1 ? "" : "s"} shown
          </div>
        }
        actions={
          <>
            <AddDeviceDialog />
            <Button
              size="sm"
              className="h-8 rounded-sm text-xs"
              onClick={() => setOta({ open: true, bulk: true })}
            >
              <UploadCloud className="mr-1.5 h-3.5 w-3.5" />Push OTA update
            </Button>
          </>
        }
      />

      {/* Filter bar */}
      <div className="border-b border-border bg-muted/20 px-6 py-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1">
            <Label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ID, MAC, firmware, lab…"
                className="h-9 rounded-sm pl-7 text-mono text-xs"
              />
            </div>
          </div>
          <FilterSelect label="Lab" value={labFilter} onChange={setLabFilter}
            options={[{ v: ALL, l: "All labs" }, ...allLabs.map((l) => ({ v: l.name, l: l.name }))]} />
          <FilterSelect label="Connection" value={statusFilter} onChange={setStatusFilter}
            options={[
              { v: ALL, l: "All" },
              { v: "connected", l: "Connected" },
              { v: "unstable", l: "Unstable" },
              { v: "offline", l: "Offline" },
            ]} />
          <FilterSelect label="Health" value={healthFilter} onChange={setHealthFilter}
            options={[
              { v: ALL, l: "All" },
              { v: "healthy", l: "Healthy" },
              { v: "degraded", l: "Degraded" },
              { v: "unreachable", l: "Unreachable" },
            ]} />
          <FilterSelect label="Firmware" value={fwFilter} onChange={setFwFilter}
            options={[{ v: ALL, l: "All" }, ...firmwareOptions.map((f) => ({ v: f, l: f }))]} />
          {anyFilter && (
            <Button variant="ghost" size="sm" className="h-9 rounded-sm text-xs" onClick={resetFilters}>
              <X className="mr-1 h-3.5 w-3.5" /> Reset
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 && (
          <div className="col-span-full rounded-sm border border-dashed border-border bg-card px-6 py-10 text-center">
            <div className="text-sm font-medium">No devices match the current filters.</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Adjust the search or filters, or provision a new device.
            </div>
          </div>
        )}
        {filtered.map((d) => {
          const health = healthOf(d);
          return (
            <div key={d.id} className="rounded-sm border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-sm",
                    d.wifi === "offline" ? "bg-critical/10 text-critical" : "bg-primary/10 text-primary",
                  )}>
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-mono">{d.id}</div>
                    <div className="text-[10px] text-muted-foreground">{d.lab}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className={cn(
                    "rounded-sm text-mono text-[10px] uppercase",
                    health === "healthy" && "border-success/30 bg-success/10 text-success",
                    health === "degraded" && "border-warning/30 bg-warning/10 text-warning",
                    health === "unreachable" && "border-critical/30 bg-critical/10 text-critical",
                  )}>{health}</Badge>
                  <Badge variant="outline" className={cn(
                    "rounded-sm text-mono text-[10px] uppercase",
                    d.wifi === "connected" && "border-success/30 bg-success/10 text-success",
                    d.wifi === "unstable" && "border-warning/30 bg-warning/10 text-warning",
                    d.wifi === "offline" && "border-critical/30 bg-critical/10 text-critical",
                  )}>
                    {d.wifi === "offline" ? <WifiOff className="mr-1 h-3 w-3" /> : <Wifi className="mr-1 h-3 w-3" />}
                    {d.wifi}
                  </Badge>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3 text-xs">
                <Row label="MAC" value={d.mac} mono />
                <Row label="Firmware" value={d.firmware} mono />
                <Row label="RSSI" value={`${d.rssi} dBm`} mono icon={Signal} />
                <Row label="Battery" value={`${d.battery}%`} mono icon={Battery} />
                <Row label="Last seen" value={new Date(d.lastSeen).toLocaleTimeString()} mono />
                <Row label="Endpoint" value="/api/device/update" mono />
              </dl>
              <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-sm px-2 text-xs text-critical hover:bg-critical/10 hover:text-critical"
                  onClick={() => setConfirmDelete(d)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-7 rounded-sm text-xs" onClick={() => reboot(d)}>Reboot</Button>
                  <Button variant="outline" size="sm" className="h-7 rounded-sm text-xs" onClick={() => setCfg({ open: true, device: d })}>Configure</Button>
                  <Button size="sm" className="h-7 rounded-sm text-xs" onClick={() => setOta({ open: true, device: d })}>OTA</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <OtaDialog
        open={ota.open}
        device={ota.device}
        bulk={!!ota.bulk}
        targets={filtered}
        onOpenChange={(o) => setOta((s) => ({ ...s, open: o }))}
      />
      <ConfigureDialog
        open={cfg.open}
        device={cfg.device}
        onOpenChange={(o) => setCfg((s) => ({ ...s, open: o }))}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove device from fleet?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="text-mono">{confirmDelete?.id}</span> will stop appearing in the fleet grid,
              monitoring pages and lab views. This does not power down the physical unit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-sm bg-critical text-critical-foreground hover:bg-critical/90"
              onClick={confirmedDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="min-w-[130px]">
      <Label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 rounded-sm text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.v} value={o.v} className="text-xs">{o.l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function OtaDialog({
  open, onOpenChange, device, bulk, targets,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  device?: Device;
  bulk: boolean;
  targets: Device[];
}) {
  const [version, setVersion] = useState(LATEST_FIRMWARE);
  const [channel, setChannel] = useState("stable");
  const [pushing, setPushing] = useState(false);

  const scope = bulk
    ? targets.filter((t) => t.wifi !== "offline")
    : device
      ? [device]
      : [];

  const submit = async () => {
    if (!/^\d+\.\d+\.\d+$/.test(version.trim())) { toast.error("Firmware must be semver X.Y.Z."); return; }
    setPushing(true);
    toast.info(`OTA push started`, { description: `${scope.length} device(s) · v${version} · ${channel}` });
    for (const t of scope) {
      updateDevice(t.id, { wifi: "unstable" });
      await new Promise((r) => setTimeout(r, 300));
      updateDevice(t.id, { firmware: version, wifi: "connected", lastSeen: new Date().toISOString() });
    }
    toast.success(`OTA complete`, { description: `Upgraded ${scope.length} device(s) to v${version}` });
    setPushing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{bulk ? "Push OTA to fleet" : `OTA · ${device?.id ?? ""}`}</DialogTitle>
          <DialogDescription>
            {bulk
              ? `${scope.length} online device(s) will receive the update. Offline nodes are skipped.`
              : `Target ${device?.lab} · current fw ${device?.firmware}`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <FieldSm label="Firmware version"><Input value={version} onChange={(e) => setVersion(e.target.value)} /></FieldSm>
          <FieldSm label="Release channel">
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="h-9 rounded-sm text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="stable">stable</SelectItem>
                <SelectItem value="beta">beta</SelectItem>
                <SelectItem value="canary">canary</SelectItem>
              </SelectContent>
            </Select>
          </FieldSm>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-8 rounded-sm text-xs" onClick={() => onOpenChange(false)} disabled={pushing}>Cancel</Button>
          <Button size="sm" className="h-8 rounded-sm text-xs" onClick={submit} disabled={pushing}>
            {pushing ? "Pushing…" : `Push to ${scope.length} device${scope.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfigureDialog({
  open, onOpenChange, device,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  device?: Device;
}) {
  const [interval, setInterval] = useState("5");
  const [threshold, setThreshold] = useState("800");
  const [mode, setMode] = useState("auto");

  if (!device) return null;

  const submit = () => {
    updateDevice(device.id, { lastSeen: new Date().toISOString() });
    toast.success(`Config applied to ${device.id}`, {
      description: `interval=${interval}s · MQ2=${threshold}ppm · mode=${mode}`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure · {device.id}</DialogTitle>
          <DialogDescription>{device.lab} · {device.mac}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <FieldSm label="Sample interval (s)"><Input type="number" value={interval} onChange={(e) => setInterval(e.target.value)} /></FieldSm>
            <FieldSm label="MQ2 alert (ppm)"><Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} /></FieldSm>
          </div>
          <FieldSm label="Operating mode">
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="h-9 rounded-sm text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">auto</SelectItem>
                <SelectItem value="manual">manual</SelectItem>
                <SelectItem value="silent">silent (no buzzer)</SelectItem>
              </SelectContent>
            </Select>
          </FieldSm>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-8 rounded-sm text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="h-8 rounded-sm text-xs" onClick={submit}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, mono, icon: Icon }: { label: string; value: string; mono?: boolean; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn("flex items-center justify-end gap-1 text-right", mono && "text-mono")}>
        {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
        {value}
      </dd>
    </>
  );
}

function FieldSm({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
