"use client";

import { useMemo } from "react";
import {
  STATUS_COLORS,
  STATUS_LABEL_MY,
  formatDateMY,
  type AttendanceStatus,
} from "@/lib/disiplin/domain";

interface AttendanceCalendarProps {
  records: { tarikh: string; status: AttendanceStatus }[];
  year?: number;
  month?: number; // 0-indexed
}

const WEEKDAY_LABELS = ["A", "S", "I", "R", "K", "J", "S"]; // Ahad..Sabtu

export function AttendanceCalendar({
  records,
  year,
  month,
}: AttendanceCalendarProps) {
  const { y, m } = useMemo(() => {
    const first = records[0]?.tarikh;
    if (first) {
      const [yy, mm] = first.split("-");
      return { y: year ?? Number(yy), m: month ?? Number(mm) - 1 };
    }
    const now = new Date();
    return { y: year ?? now.getFullYear(), m: month ?? now.getMonth() };
  }, [records, year, month]);

  const byDate = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    for (const r of records) {
      map.set(r.tarikh, r.status);
    }
    return map;
  }, [records]);

  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const firstWeekday = new Date(y, m, 1).getDay();
  const monthName = new Date(y, m, 1).toLocaleDateString("ms-MY", {
    month: "long",
    year: "numeric",
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{monthName}</p>
        <Legend />
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={i} className="font-medium">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="aspect-square" />;
          const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const status = byDate.get(iso);
          const color = status ? STATUS_COLORS[status] : "transparent";
          return (
            <div
              key={i}
              title={
                status
                  ? `${formatDateMY(iso)} · ${STATUS_LABEL_MY[status]}`
                  : formatDateMY(iso)
              }
              className="aspect-square rounded-md grid place-items-center text-xs font-medium border border-border/60"
              style={{
                backgroundColor: status ? color : "rgba(0,0,0,0.03)",
                color: status ? "#fff" : "var(--muted-foreground)",
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Legend() {
  const items: { label: string; color: string }[] = [
    { label: "Hadir", color: STATUS_COLORS.HADIR },
    { label: "Lewat", color: STATUS_COLORS.LEWAT },
    { label: "Sakit", color: STATUS_COLORS.SAKIT },
    { label: "Kebenaran", color: STATUS_COLORS.KEBENARAN },
    { label: "Tanpa Sebab", color: STATUS_COLORS.TANPA_SEBAB },
    { label: "Pulang Awal", color: STATUS_COLORS.PULANG_AWAL },
  ];
  return (
    <div className="hidden sm:flex flex-wrap items-center gap-2 text-[10px]">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1">
          <span
            className="size-2.5 rounded-sm"
            style={{ backgroundColor: it.color }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}
