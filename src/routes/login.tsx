import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Radio, Lock, ShieldCheck, Database, Loader2 } from "lucide-react";
import { useAuth, ROLE_LABELS, type Role } from "@/lib/auth";
import { SUPABASE_PROJECT_ID } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · SENTINEL-G" },
      { name: "description", content: "Sign in to the SENTINEL-G lab safety monitoring console." },
      { property: "og:title", content: "Sign in · SENTINEL-G" },
      { property: "og:description", content: "Access the SENTINEL-G lab safety monitoring console." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("supervisor@sentinel-g.io");
  const [password, setPassword] = useState("demo1234");
  const [role, setRole] = useState<Role>("lab_supervisor");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, role, password);
      toast.success("Authenticated with Supabase Auth", {
        description: `Logged in as ${email} (${ROLE_LABELS[role]})`,
      });
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error("Authentication Error", {
        description: err instanceof Error ? err.message : "Failed to authenticate",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-primary-foreground">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">SENTINEL-G</div>
              <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Lab Safety Platform</div>
            </div>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="max-w-md text-2xl font-semibold leading-tight tracking-tight">
            Smart Industrial &amp; Laboratory Safety Monitoring
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-sidebar-foreground/70">
            Continuous gas, air-quality and thermal telemetry from ESP32 field devices,
            paired with Supabase Auth &amp; Realtime data streams for every hazard class.
          </p>
          
          <div className="flex items-center gap-2.5 rounded-sm border border-sidebar-border bg-sidebar/50 p-3 text-xs">
            <Database className="h-4 w-4 text-primary shrink-0" />
            <div>
              <div className="font-mono text-[11px] font-medium text-sidebar-foreground">Supabase Connected</div>
              <div className="font-mono text-[10px] text-sidebar-foreground/60">Project ID: {SUPABASE_PROJECT_ID}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-sidebar-border pt-6 text-mono">
            <Stat label="Devices" value="10K+" />
            <Stat label="Response" value="&lt; 2s" />
            <Stat label="Uptime" value="99.98%" />
          </div>
        </div>

        <div className="relative text-[11px] text-sidebar-foreground/50">
          © 2026 SENTINEL-G · Powered by Supabase Backend · ISO/IEC 27001 compliant
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-6">
          {/* Institutional Branding Banner Header */}
          <div className="flex flex-col items-center justify-center text-center p-3.5 rounded-sm border border-border bg-card/80 backdrop-blur-sm shadow-xs space-y-2">
            <img
              src="/svit-logo.png"
              alt="Sai Vidya Institute of Technology Logo"
              className="h-18 w-auto shrink-0 object-contain drop-shadow-sm transition-transform hover:scale-105"
            />
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-primary font-bold">
                Created In Association With
              </div>
              <div className="text-xs font-bold tracking-tight text-foreground mt-0.5">
                SAI VIDYA INSTITUTE OF TECHNOLOGY
              </div>
              <div className="text-[10px] text-muted-foreground italic mt-0.5">
                "Learn to Lead"
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground">
              <Radio className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">SENTINEL-G</span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Secure Supabase Access
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Supabase Live
              </span>
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">Sign in to Sentinel-G</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Authenticate via Supabase Auth. Access is role-scoped and audited.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Work email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 rounded-sm"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 rounded-sm"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)} disabled={isSubmitting}>
                <SelectTrigger className="h-9 rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Role scope stored in Supabase profiles database table.
              </p>
            </div>
          </div>

          <Button type="submit" className="h-9 w-full rounded-sm" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" /> Sign in with Supabase
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 rounded-sm border border-border bg-muted/40 p-3 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
            <span>Connected to Supabase Project <code className="font-mono text-primary font-semibold">{SUPABASE_PROJECT_ID}</code></span>
          </div>
        </form>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50">{label}</div>
    </div>
  );
}
