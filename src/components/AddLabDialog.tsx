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
import { addLab } from "@/lib/user-records";
import type { LabStatus } from "@/lib/mock-data";

const STATUSES: LabStatus[] = ["safe", "warning", "critical"];

export function AddLabDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [status, setStatus] = useState<LabStatus>("safe");

  const reset = () => {
    setName(""); setCode(""); setLocation(""); setSupervisor(""); setStatus("safe");
  };

  const submit = () => {
    if (!name || !code || !location || !supervisor) {
      toast.error("Please fill name, code, location and supervisor.");
      return;
    }
    const slug = code.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const id = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
    addLab({ id, name, code: code.toUpperCase(), location, supervisor, status, devices: 0, incidents: 0 });
    toast.success(`${name} created`, {
      description: `Opening dedicated monitoring for ${code.toUpperCase()}…`,
    });
    // Open the new lab's monitoring dashboard in a new browser tab.
    if (typeof window !== "undefined") {
      window.open(`/monitoring/${id}`, "_blank", "noopener,noreferrer");
    }
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 rounded-sm text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" />New laboratory
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New laboratory</DialogTitle>
          <DialogDescription>
            Register a new laboratory. A dedicated live monitoring dashboard opens in a new tab.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <Field label="Lab name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nanomaterials Lab" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code"><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="NANO-01" /></Field>
            <Field label="Status">
              <Select value={status} onValueChange={(v) => setStatus(v as LabStatus)}>
                <SelectTrigger className="h-9 rounded-sm text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Location"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Block E · Floor 2" /></Field>
          <Field label="Supervisor"><Input value={supervisor} onChange={(e) => setSupervisor(e.target.value)} placeholder="Dr. P. Kumar" /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-8 rounded-sm text-xs" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" className="h-8 rounded-sm text-xs" onClick={submit}>Create & open</Button>
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
