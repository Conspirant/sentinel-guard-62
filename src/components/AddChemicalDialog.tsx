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
import { addChemical } from "@/lib/user-records";

const HAZARDS = ["Flammable", "Corrosive", "Toxic", "Oxidizer"] as const;

export function AddChemicalDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cabinet, setCabinet] = useState("");
  const [quantity, setQuantity] = useState("");
  const [safetyClass, setSafetyClass] = useState("");
  const [hazard, setHazard] = useState<typeof HAZARDS[number]>("Flammable");
  const [expiry, setExpiry] = useState("");

  const reset = () => {
    setName(""); setCabinet(""); setQuantity(""); setSafetyClass(""); setHazard("Flammable"); setExpiry("");
  };

  const submit = () => {
    if (!name || !cabinet || !quantity || !expiry) {
      toast.error("Please fill name, cabinet, quantity and expiry.");
      return;
    }
    const id = `CHM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    addChemical({ id, name, cabinet, quantity, expiry, safetyClass: safetyClass || `Class · ${hazard}`, hazard, msds: "#" });
    toast.success(`${name} added to inventory`, { description: id });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 rounded-sm text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" />Add chemical
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add chemical</DialogTitle>
          <DialogDescription>Register a new reagent, solvent or oxidizer to the inventory.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <Field label="Chemical name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Toluene" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cabinet"><Input value={cabinet} onChange={(e) => setCabinet(e.target.value)} placeholder="B-2" /></Field>
            <Field label="Quantity"><Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="2 L" /></Field>
          </div>
          <Field label="Safety class"><Input value={safetyClass} onChange={(e) => setSafetyClass(e.target.value)} placeholder="Class 3 · Flammable" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hazard">
              <Select value={hazard} onValueChange={(v) => setHazard(v as typeof HAZARDS[number])}>
                <SelectTrigger className="h-9 rounded-sm text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{HAZARDS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Expiry"><Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-8 rounded-sm text-xs" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" className="h-8 rounded-sm text-xs" onClick={submit}>Add chemical</Button>
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
