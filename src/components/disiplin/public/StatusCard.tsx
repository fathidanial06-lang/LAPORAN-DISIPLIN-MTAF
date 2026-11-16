"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export interface StatusCardProps {
  icon: LucideIcon;
  title: string;
  metric: string;
  detail: string;
  color: string; // hex
}

export function StatusCard({
  icon: Icon,
  title,
  metric,
  detail,
  color,
}: StatusCardProps) {
  return (
    <Card
      className={cn("glass-card overflow-hidden border-0 p-0")}
      style={{ boxShadow: `0 10px 30px -12px ${color}66` }}
    >
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span
            className="grid size-11 place-items-center rounded-xl text-white shrink-0"
            style={{ backgroundColor: color }}
          >
            <Icon className="size-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
          </div>
        </div>
        <p className="text-3xl font-bold" style={{ color }}>
          {metric}
        </p>
        <p className="text-sm text-foreground/90 leading-relaxed">{detail}</p>
      </CardContent>
    </Card>
  );
}
