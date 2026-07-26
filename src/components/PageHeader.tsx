import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  meta,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="border-b border-border bg-card px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
          {meta && <div className="mt-2">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function StatusDot({ tone }: { tone: "success" | "warning" | "critical" | "muted" }) {
  const map = {
    success: "bg-success",
    warning: "bg-warning",
    critical: "bg-critical",
    muted: "bg-muted-foreground/50",
  } as const;
  return (
    <span className="relative inline-flex h-2 w-2">
      <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${map[tone]} animate-ping`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${map[tone]}`} />
    </span>
  );
}
