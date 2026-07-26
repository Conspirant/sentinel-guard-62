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
import { LABS } from "@/lib/mock-data";
import { addEquipment } from "@/lib/user-records";

const STATUS = ["operational", "service_due", "out_of_service"] as const;

export function AddEquipmentDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [lab, setLab] = useState(LABS[0].name);
  const [purchased, setPurchased] = useState("");
  const [warranty, setWarranty] = useState("");
  const [calibration, setCalibration] = useState("");
  const [nextMaintenance, setNextMaintenance] = useState("");
  const [status, setStatus] = useState<typeof STATUS[number]>("operational");

  const submit = () => {
    if (!name || !purchased || !warranty) {
      toast.error("Name, purchase date and warranty are required.");
      return;
    }
    const id = `EQ-${Math.floor(1000 + Math.random() * 9000)}`;
    addEquipment({ id, name, lab, purchased, warranty, calibration: calibration || purchased, nextMaintenance: nextMaintenance || warranty, status });
    toast.success(`${name} registered`, { description: id });
    setOpen(false);
    setName(""); setPurchased(""); setWarranty(""); setCalibration(""); setNextMaintenance("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 rounded-sm text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" />Add equipment
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-sm sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Register equipment</DialogTitle>
          <DialogDescription>Add a new lab asset with warranty and maintenance schedule.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <Field label="Asset name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Centrifuge C-24" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lab">
              <Select value={lab} onValueChange={setLab}>
                <SelectTrigger className="h-9 rounded-sm text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{LABS.map((l) => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={(v) => setStatus(v as typeof STATUS[number])}>
                <SelectTrigger className="h-9 rounded-sm text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Purchased"><Input type="date" value={purchased} onChange={(e) => setPurchased(e.target.value)} /></Field>
            <Field label="Warranty until"><Input type="date" value={warranty} onChange={(e) => setWarranty(e.target.value)} /></Field>
            <Field label="Last calibration"><Input type="date" value={calibration} onChange={(e) => setCalibration(e.target.value)} /></Field>
            <Field label="Next maintenance"><Input type="date" value={nextMaintenance} onChange={(e) => setNextMaintenance(e.target.value)} /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-8 rounded-sm text-xs" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" className="h-8 rounded-sm text-xs" onClick={submit}>Register</Button>
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
