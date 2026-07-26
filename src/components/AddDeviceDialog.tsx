import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader,
  DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LABS, DEVICES } from "@/lib/mock-data";
import { addDevice, useUserRecords, isMacTaken, isDeviceIdTaken } from "@/lib/user-records";
import { cn } from "@/lib/utils";

const DEVICE_ID_RE = /^ESP32-[A-Z0-9]{2,6}-\d{2,3}$/;
const MAC_RE = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i;
const FIRMWARE_RE = /^\d+\.\d+\.\d+$/;

const deviceSchema = z.object({
  id: z.string().trim()
    .min(6, "Device ID is too short")
    .max(32, "Device ID must be under 32 chars")
    .regex(DEVICE_ID_RE, "Format must be ESP32-<CODE>-## (e.g. ESP32-CHM-03)"),
  mac: z.string().trim()
    .regex(MAC_RE, "MAC must be AA:BB:CC:DD:EE:FF (hex)"),
  firmware: z.string().trim()
    .regex(FIRMWARE_RE, "Firmware must be semver X.Y.Z"),
});

function randomMac() {
  const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase();
  return `24:6F:28:${hex()}:${hex()}:${hex()}`;
}

export function AddDeviceDialog() {
  const userLabs = useUserRecords("labs");
  const userDevices = useUserRecords("devices");
  const allLabs = userLabs;

  const [open, setOpen] = useState(false);
  const [id, setId] = useState("");
  const [mac, setMac] = useState(randomMac());
  const [lab, setLab] = useState(allLabs[0]?.name ?? "Chemistry Lab");
  const [firmware, setFirmware] = useState("1.4.2");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const takenMacs = useMemo(
    () => userDevices.map((d) => d.mac),
    [userDevices],
  );
  const takenIds = useMemo(
    () => userDevices.map((d) => d.id),
    [userDevices],
  );

  const submit = () => {
    const parsed = deviceSchema.safeParse({ id, mac, firmware });
    const next: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
    }
    if (!next.id && isDeviceIdTaken(id, takenIds)) {
      next.id = "A device with this ID already exists.";
    }
    if (!next.mac && isMacTaken(mac, takenMacs)) {
      next.mac = "This MAC address is already registered.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Fix the highlighted fields before provisioning.");
      return;
    }
    addDevice({
      id: id.trim(),
      mac: mac.trim().toUpperCase(),
      lab,
      firmware: firmware.trim(),
      wifi: "connected",
      battery: 100,
      rssi: -55,
      lastSeen: new Date().toISOString(),
    });
    toast.success(`${id.trim()} provisioned`, { description: `${lab} · fw ${firmware}` });
    setOpen(false);
    setId(""); setMac(randomMac()); setFirmware("1.4.2"); setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setErrors({}); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 rounded-sm text-xs">
          <Package className="mr-1.5 h-3.5 w-3.5" />Provision
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-sm sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Provision ESP32 device</DialogTitle>
          <DialogDescription>
            Register a new field node. Device ID must match <span className="text-mono">ESP32-&lt;CODE&gt;-##</span> and MAC must be unique.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Device ID" error={errors.id}>
              <Input
                value={id}
                onChange={(e) => setId(e.target.value.toUpperCase())}
                placeholder="ESP32-CHM-03"
                className={cn("text-mono", errors.id && "border-critical focus-visible:ring-critical")}
                maxLength={32}
              />
            </Field>
            <Field label="Firmware" error={errors.firmware}>
              <Input
                value={firmware}
                onChange={(e) => setFirmware(e.target.value)}
                placeholder="1.4.2"
                className={cn(errors.firmware && "border-critical focus-visible:ring-critical")}
              />
            </Field>
          </div>
          <Field label="MAC address" error={errors.mac}>
            <div className="flex gap-2">
              <Input
                value={mac}
                onChange={(e) => setMac(e.target.value.toUpperCase())}
                className={cn("text-mono", errors.mac && "border-critical focus-visible:ring-critical")}
                maxLength={17}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-sm text-xs"
                onClick={() => { setMac(randomMac()); setErrors((e) => ({ ...e, mac: "" })); }}
              >
                Random
              </Button>
            </div>
          </Field>
          <Field label="Lab assignment">
            <Select value={lab} onValueChange={setLab}>
              <SelectTrigger className="h-9 rounded-sm text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{allLabs.map((l) => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-8 rounded-sm text-xs" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" className="h-8 rounded-sm text-xs" onClick={submit}>Provision device</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <div className="text-[10px] text-critical">{error}</div>}
    </div>
  );
}
