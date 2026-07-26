import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
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
import { DEVICES } from "@/lib/mock-data";
import { addCalibration } from "@/lib/user-records";
import { useAuth } from "@/lib/auth";

const SENSORS = ["MQ2", "MQ135", "DHT22", "Smoke", "Temperature"] as const;

function addMonths(iso: string, months: number) {
  if (!iso) return "";
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function AddCalibrationDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sensor, setSensor] = useState<typeof SENSORS[number]>("MQ2");
  const [device, setDevice] = useState(DEVICES[0].id);
  const [lastCalibrated, setLastCalibrated] = useState(new Date().toISOString().slice(0, 10));
  const [technician, setTechnician] = useState(user?.name ?? "");

  const submit = () => {
    if (!lastCalibrated || !technician) {
      toast.error("Calibration date and technician are required.");
      return;
    }
    const nextDue = addMonths(lastCalibrated, 6);
    const days = Math.round((+new Date(nextDue) - Date.now()) / 86400000);
    const status = days < 0 ? "overdue" : days < 45 ? "due_soon" : "valid";
    const id = `CAL-${Math.floor(9000 + Math.random() * 999)}`;
    addCalibration({ id, sensor, device, lastCalibrated, nextDue, technician, status });
    toast.success(`Calibration logged for ${sensor}`, { description: `${id} · next due ${nextDue}` });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 rounded-sm text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" />New record
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log calibration</DialogTitle>
          <DialogDescription>Next due date is set to 6 months from calibration.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sensor">
              <Select value={sensor} onValueChange={(v) => setSensor(v as typeof SENSORS[number])}>
                <SelectTrigger className="h-9 rounded-sm text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{SENSORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Device">
              <Select value={device} onValueChange={setDevice}>
                <SelectTrigger className="h-9 rounded-sm text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{DEVICES.map((d) => <SelectItem key={d.id} value={d.id}>{d.id}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Calibration date"><Input type="date" value={lastCalibrated} onChange={(e) => setLastCalibrated(e.target.value)} /></Field>
          <Field label="Technician"><Input value={technician} onChange={(e) => setTechnician(e.target.value)} placeholder="Full name" /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-8 rounded-sm text-xs" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" className="h-8 rounded-sm text-xs" onClick={submit}>Save record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
