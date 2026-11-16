"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export interface StatusCardProps {
  icon: LucideIcon;
  title: string;
  metric: string;
  detail: string;
  color: string; // hex / semantic accent
  className?: string;
  big?: boolean;
}

export function StatusCard({
  icon: Icon,
  title,
  metric,
  detail,
  color,
  className = "",
  big = false,
}: StatusCardProps) {
  return (
    <Card className={cn("glass-card overflow-hidden border-0 p-0", className)}>
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <CardContent className="p-5 h-full flex flex-col justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`grid place-items-center rounded-2xl neu-inset shrink-0 ${
              big ? "size-14" : "size-11"
            }`}
            aria-hidden="true"
          >
            <Icon className={big ? "size-6" : "size-5"} style={{ color }} />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
          </div>
        </div>
        <p
          className={`${big ? "text-4xl sm:text-5xl" : "text-3xl"} font-bold leading-none`}
          style={{ color }}
        >
          {metric}
        </p>
        <p className="text-sm text-foreground/90 leading-relaxed">{detail}</p>
      </CardContent>
    </Card>
  );
}
