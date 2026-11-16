// Shared small UI helpers used across views.

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  TAHAP_LABEL_MY,
  TAHAP_COLORS,
  type TahapDisiplin,
} from "@/lib/disiplin/domain";

export function TahapBadge({
  tahap,
  className,
}: {
  tahap: TahapDisiplin;
  className?: string;
}) {
  const color = TAHAP_COLORS[tahap];
  return (
    <Badge
      className={cn("text-white", className)}
      style={{ backgroundColor: color, borderColor: color }}
    >
      {TAHAP_LABEL_MY[tahap]}
    </Badge>
  );
}

export function StatusBadge({
  label,
  color,
  className,
}: {
  label: string;
  color: string;
  className?: string;
}) {
  return (
    <Badge
      className={cn("text-white", className)}
      style={{ backgroundColor: color, borderColor: color }}
    >
      {label}
    </Badge>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  tone?: "default" | "good" | "warn" | "danger";
}) {
  const toneClasses: Record<string, string> = {
    default: "text-foreground",
    good: "text-emerald-600",
    warn: "text-amber-600",
    danger: "text-red-600",
  };
  return (
    <div className="glass rounded-2xl p-4 flex items-start gap-3">
      <div className="rounded-xl bg-primary/10 p-2.5 text-primary shrink-0">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={cn("text-2xl font-semibold leading-tight", toneClasses[tone])}>
          {value}
        </p>
        {hint && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
