import { useEffect, useRef, useState } from "react";
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { StatusDot } from "@/components/PageHeader";
import { sensorSeverity, type SensorReading } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SensorGaugeCard({ sensor: s }: { sensor: SensorReading }) {
  const sev = sensorSeverity(s);
  const tone = sev === "critical" ? "critical" : sev === "medium" ? "warning" : "success";
  const pct = Math.min(100, Math.max(0, ((s.value - s.min) / (s.max - s.min)) * 100));

  const display = Number.isFinite(s.value)
    ? Math.abs(s.value) >= 100
      ? Math.round(s.value).toString()
      : s.value.toFixed(1)
    : "—";

  // Flash animation state when realtime reading updates
  const [flashing, setFlashing] = useState(false);
  const [delta, setDelta] = useState<number | null>(null);
  const prevVal = useRef(s.value);

  useEffect(() => {
    if (prevVal.current !== s.value && s.updatedAt) {
      const diff = s.value - prevVal.current;
      setDelta(diff);
      setFlashing(true);
      prevVal.current = s.value;

      const t = setTimeout(() => {
        setFlashing(false);
        setDelta(null);
      }, 1000);

      return () => clearTimeout(t);
    }
  }, [s.value, s.updatedAt]);

  const barColor =
    tone === "critical"
      ? "var(--critical)"
      : tone === "warning"
      ? "var(--warning)"
      : "var(--success)";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm border bg-card p-4 transition-all duration-500 shadow-xs",
        flashing && tone === "critical" && "border-critical ring-2 ring-critical/40 bg-critical/10 scale-[1.02]",
        flashing && tone === "warning" && "border-warning ring-2 ring-warning/40 bg-warning/10 scale-[1.02]",
        flashing && tone === "success" && "border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-500/10 scale-[1.02]",
        !flashing && "border-border hover:border-border/80",
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {s.label}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={cn(
                "rounded-sm text-mono text-[9px] uppercase px-1.5 py-0 font-semibold tracking-wider",
                tone === "critical" && "border-critical/40 bg-critical/15 text-critical animate-pulse",
                tone === "warning" && "border-warning/40 bg-warning/15 text-warning",
                tone === "success" && "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
              )}
            >
              {tone === "critical" ? "CRITICAL" : tone === "warning" ? "WARNING" : "NORMAL"}
            </Badge>
            {delta !== null && (
              <span
                className={cn(
                  "text-mono text-[10px] font-bold animate-bounce",
                  delta > 0 ? "text-critical" : "text-emerald-500",
                )}
              >
                {delta > 0 ? `▲ +${delta.toFixed(0)}` : `▼ ${delta.toFixed(0)}`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {flashing && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
          <StatusDot tone={tone} />
        </div>
      </div>

      {/* Radial Bar Gauge */}
      <div className="relative mt-2 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="72%"
            outerRadius="100%"
            data={[{ v: pct }]}
            startAngle={225}
            endAngle={-45}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="v"
              cornerRadius={2}
              fill={barColor}
              background={{ fill: "var(--muted)" }}
              isAnimationActive={true}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center Display Value */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-2">
          <div
            className={cn(
              "text-mono text-2xl font-bold leading-none tabular-nums transition-all duration-300",
              flashing && "scale-110",
              tone === "critical" && "text-critical",
              tone === "warning" && "text-warning",
              tone === "success" && "text-foreground",
            )}
          >
            {display}
          </div>
          <div className="mt-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            {s.unit}
          </div>
        </div>
      </div>

      {/* Bottom Range Strip */}
      <div className="mt-2 grid grid-cols-3 gap-2 border-t border-border/50 pt-2 text-mono text-[10px] text-muted-foreground">
        <div>
          <div>Min</div>
          <div className="font-semibold text-foreground">{s.min}</div>
        </div>
        <div>
          <div>Warn</div>
          <div className="font-semibold text-warning">{s.warn}</div>
        </div>
        <div>
          <div>Crit</div>
          <div className="font-semibold text-critical">{s.critical}</div>
        </div>
      </div>
    </div>
  );
}
