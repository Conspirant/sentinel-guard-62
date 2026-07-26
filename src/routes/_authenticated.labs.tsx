import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building2, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { LABS, type Lab } from "@/lib/mock-data";
import { LabBadge } from "./_authenticated.dashboard";
import { AddLabDialog } from "@/components/AddLabDialog";
import { useUserRecords, deleteLab } from "@/lib/user-records";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/labs")({
  head: () => ({
    meta: [
      { title: "Laboratories · SENTINEL-G" },
      { name: "description", content: "Every laboratory under SENTINEL-G supervision with per-lab safety posture." },
      { property: "og:title", content: "Laboratories · SENTINEL-G" },
      { property: "og:description", content: "Every laboratory under SENTINEL-G supervision." },
    ],
  }),
  component: Labs,
});

function Labs() {
  const userLabs = useUserRecords("labs");
  const hiddenLabIds = useUserRecords("hiddenLabIds");
  const labs = useMemo(() => {
    const hide = new Set(hiddenLabIds);
    return userLabs.filter((l) => !hide.has(l.id));
  }, [userLabs, hiddenLabIds]);

  const [confirm, setConfirm] = useState<Lab | null>(null);

  const remove = () => {
    if (!confirm) return;
    deleteLab(confirm.id);
    toast.success(`${confirm.name} removed`);
    setConfirm(null);
  };

  return (
    <div>
      <PageHeader
        title="Laboratories"
        description="Each facility runs its own device group, incident stream and equipment registry."
        actions={<AddLabDialog />}
      />
      <div className="p-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {labs.map((l) => (
          <div key={l.id} className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{l.name}</div>
                  <div className="text-mono text-[10px] text-muted-foreground">{l.code} · {l.location}</div>
                </div>
              </div>
              <LabBadge status={l.status} />
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-mono">
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Devices</dt>
                <dd className="text-lg font-semibold">{l.devices}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Incidents</dt>
                <dd className="text-lg font-semibold">{l.incidents}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Supervisor</dt>
                <dd className="truncate text-xs">{l.supervisor}</dd>
              </div>
            </dl>
            <div className="mt-3 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-sm px-2 text-xs text-critical hover:bg-critical/10 hover:text-critical"
                onClick={() => setConfirm(l)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
              </Button>
              <a
                href={`/monitoring/${l.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Open live monitoring <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove laboratory?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">{confirm?.name}</span> ({confirm?.code}) will disappear from
              the registry, monitoring pages and lab-scoped dashboards. Devices assigned to this lab will
              also be hidden until reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-sm bg-critical text-critical-foreground hover:bg-critical/90"
              onClick={remove}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
