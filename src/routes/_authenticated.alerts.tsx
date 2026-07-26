import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Smartphone, Bell, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { INCIDENTS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SeverityBadge } from "./_authenticated.dashboard";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({
    meta: [
      { title: "Notification Center · SENTINEL-G" },
      { name: "description", content: "Configure email, SMS, WhatsApp and push notifications for hazards." },
      { property: "og:title", content: "Notification Center · SENTINEL-G" },
      { property: "og:description", content: "Configure email, SMS, WhatsApp and push notifications." },
    ],
  }),
  component: Alerts,
});

const CHANNELS = [
  { key: "email", label: "Email", icon: Mail, desc: "SMTP relay · sentinel@ops.example", enabled: true },
  { key: "sms", label: "SMS", icon: Smartphone, desc: "Twilio gateway ready", enabled: true },
  { key: "wa", label: "WhatsApp", icon: MessageCircle, desc: "Meta Cloud API ready", enabled: false },
  { key: "push", label: "Push Notifications", icon: Bell, desc: "Web + mobile push service", enabled: true },
];

function Alerts() {
  return (
    <div>
      <PageHeader
        title="Notification Center"
        description="Route hazards to the right responders through multiple channels."
      />
      <div className="p-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-sm border border-border bg-card">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">Channels</div>
          <ul className="divide-y divide-border">
            {CHANNELS.map((c) => (
              <li key={c.key} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary/10 text-primary">
                    <c.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{c.label}</div>
                    <div className="text-xs text-muted-foreground">{c.desc}</div>
                  </div>
                </div>
                <Switch defaultChecked={c.enabled} />
              </li>
            ))}
          </ul>
          <div className="border-t border-border p-3 text-right">
            <Button size="sm" className="h-8 rounded-sm text-xs">Save routing</Button>
          </div>
        </div>

        <div className="rounded-sm border border-border bg-card">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">Recent Notifications</div>
          <ul className="divide-y divide-border">
            {INCIDENTS.slice(0, 6).map((i) => (
              <li key={i.id} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5">
                  {i.status === "resolved"
                    ? <CheckCircle2 className="h-4 w-4 text-success" />
                    : <Bell className="h-4 w-4 text-warning" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{i.lab} · {i.sensor}</div>
                    <SeverityBadge severity={i.severity} />
                  </div>
                  <div className="text-xs text-muted-foreground">{i.remarks}</div>
                  <div className="mt-1 text-mono text-[10px] text-muted-foreground">
                    {new Date(i.timestamp).toLocaleString()} · {i.id}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
