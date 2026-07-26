import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  FlaskConical,
  Wrench,
  Cpu,
  Building2,
  BarChart3,
  FileText,
  ShieldCheck,
  Bell,
  Search,
  Sun,
  Moon,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Radio,
  Gauge,
  Plug,
  Lock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth, ROLE_LABELS } from "@/lib/auth";
import { ROLE_SCOPE, type RouteKey } from "@/lib/permissions";
import { liveStream, type LiveStatus } from "@/lib/live-stream";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NavItem = { to: RouteKey; label: string; icon: typeof LayoutDashboard };

const NAV: { section: string; items: NavItem[] }[] = [
  { section: "Operations", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/monitoring", label: "Live Monitoring", icon: Activity },
    { to: "/guidance", label: "Hazard Guidance", icon: ShieldCheck },
    { to: "/alerts", label: "Alerts", icon: Bell },
  ]},
  { section: "Records", items: [
    { to: "/incidents", label: "Incidents", icon: AlertTriangle },
    { to: "/chemicals", label: "Chemicals", icon: FlaskConical },
    { to: "/equipment", label: "Equipment", icon: Wrench },
    { to: "/calibration", label: "Calibration", icon: Gauge },
  ]},
  { section: "Infrastructure", items: [
    { to: "/labs", label: "Laboratories", icon: Building2 },
    { to: "/devices", label: "Devices (ESP32)", icon: Cpu },
    { to: "/integration", label: "Hardware Integration", icon: Plug },
  ]},
  { section: "Insights", items: [
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/reports", label: "Reports", icon: FileText },
  ]},
];

export function AppShell() {
  const { user, logout, canVisit } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [wsStatus, setWsStatus] = useState<LiveStatus>(liveStream.status);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const crumbs = path.split("/").filter(Boolean);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    // Keep header status LED in sync with the mock WS.
    const un = liveStream.subscribe(() => setWsStatus(liveStream.status));
    return un;
  }, []);

  if (!user) return null;

  const filteredNav = NAV
    .map((g) => ({ ...g, items: g.items.filter((it) => canVisit(it.to)) }))
    .filter((g) => g.items.length > 0);

  const currentRoute = "/" + (crumbs[0] ?? "dashboard");
  const routeAllowed = canVisit(currentRoute as RouteKey) || crumbs.length === 0;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width]",
          collapsed ? "w-14" : "w-64",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <Radio className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">SENTINEL-G</span>
              <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
                Lab Safety · v1.4
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {filteredNav.map((group) => (
            <div key={group.section} className="mb-3">
              {!collapsed && (
                <div className="px-4 pb-1 pt-2 text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/50">
                  {group.section}
                </div>
              )}
              <ul>
                {group.items.map((it) => {
                  const active = path.startsWith(it.to);
                  const Icon = it.icon;
                  return (
                    <li key={it.to}>
                      <Link
                        to={it.to}
                        className={cn(
                          "mx-2 flex items-center gap-3 rounded-sm px-2 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{it.label}</span>}
                        {!collapsed && active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {!collapsed && (
            <div className="mx-3 mt-2 rounded-sm border border-sidebar-border/60 bg-sidebar-accent/30 p-2.5 text-[10px] leading-relaxed text-sidebar-foreground/70">
              <div className="text-mono text-[9px] uppercase tracking-widest text-sidebar-foreground/60">
                Access scope
              </div>
              <div className="mt-1 text-sidebar-foreground/80">{ROLE_SCOPE[user.role]}</div>
            </div>
          )}
        </nav>

        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/dashboard" className="hover:text-foreground">Home</Link>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-muted-foreground/40">/</span>
                <span className={cn("capitalize", i === crumbs.length - 1 && "text-foreground font-medium")}>
                  {c.replace(/-/g, " ")}
                </span>
              </span>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div
              className={cn(
                "hidden items-center gap-1.5 rounded-sm border px-2 py-1 text-mono text-[10px] uppercase tracking-widest md:inline-flex",
                wsStatus === "open"
                  ? "border-success/30 bg-success/10 text-success"
                  : wsStatus === "connecting"
                  ? "border-warning/30 bg-warning/10 text-warning"
                  : "border-critical/30 bg-critical/10 text-critical",
              )}
              title="Live WebSocket telemetry status"
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  wsStatus === "open" && "bg-success animate-pulse",
                  wsStatus === "connecting" && "bg-warning animate-pulse",
                  wsStatus === "closed" && "bg-critical",
                )}
              />
              WS · {wsStatus}
            </div>

            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search labs, devices, incidents…"
                className="h-8 w-64 rounded-sm pl-8 text-xs"
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1 text-[10px] text-muted-foreground">⌘K</kbd>
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDark((d) => !d)}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" className="relative h-8 w-8" asChild>
              <Link to="/alerts">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-critical" />
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-sm border border-border bg-background px-2 py-1 text-left hover:bg-accent">
                  <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-[11px] font-semibold text-primary-foreground">
                    {user.initials}
                  </div>
                  <div className="hidden text-[11px] leading-tight md:block">
                    <div className="font-semibold text-foreground">{user.name}</div>
                    <div className="text-muted-foreground">{ROLE_LABELS[user.role]}</div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-semibold">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Preferences</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={logout} className="text-critical">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background">
          {routeAllowed ? (
            <Outlet />
          ) : (
            <div className="flex h-full items-center justify-center p-8">
              <div className="w-full max-w-md rounded-sm border border-border bg-card p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm bg-critical/10 text-critical">
                  <Lock className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-base font-semibold">Access restricted</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your role ({ROLE_LABELS[user.role]}) is not authorised for{" "}
                  <code className="text-mono">{currentRoute}</code>. Contact your
                  institution administrator to request elevated scope.
                </p>
                <Button asChild size="sm" className="mt-4 h-8 rounded-sm text-xs">
                  <Link to="/dashboard">Return to dashboard</Link>
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
