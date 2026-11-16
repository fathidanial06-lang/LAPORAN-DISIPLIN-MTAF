"use client";

import { useMemo } from "react";
import {
  STATUS_LABEL_MY,
  STATUS_COLORS,
  formatDateMY,
  type AttendanceStatus,
} from "@/lib/disiplin/domain";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { AttendanceCalendar } from "./AttendanceCalendar";

interface AttendanceDetailProps {
  kedatangan: any; // { records: [], stats: {} }
}

export function AttendanceDetail({ kedatangan }: AttendanceDetailProps) {
  const records: any[] = kedatangan?.records ?? [];
  const stats: any = kedatangan?.stats ?? null;

  const monthly = useMemo(() => {
    const map = new Map<string, { hadir: number; total: number }>();
    for (const r of records) {
      const month = (r.tarikh as string).slice(0, 7);
      const m = map.get(month) || { hadir: 0, total: 0 };
      m.total++;
      if (r.status === "HADIR" || r.status === "LEWAT") m.hadir++;
      map.set(month, m);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, v]) => ({
        month,
        peratus: v.total ? Math.round((v.hadir / v.total) * 100) : 0,
      }));
  }, [records]);

  const nonHadir = records.filter((r) => r.status !== "HADIR");

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      {stats && (
        <Card className="glass-card border-0">
          <CardContent className="p-5">
            <h3 className="font-semibold mb-3">Ringkasan Kedatangan</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <Stat label="Hari Sekolah" value={stats.hariSekolah} />
              <Stat label="Hadir" value={stats.hadir} tone="text-emerald-700" />
              <Stat label="Lewat" value={stats.lewat} tone="text-amber-700" />
              <Stat label="Peratus" value={`${stats.peratus}%`} tone="text-emerald-700" />
              <Stat label="Sakit/MC" value={stats.sakit} tone="text-sky-700" />
              <Stat label="Kebenaran" value={stats.kebenaran} tone="text-indigo-700" />
              <Stat label="Tanpa Sebab" value={stats.tanpaSebab} tone="text-orange-700" />
              <Stat label="Pulang Awal" value={stats.pulangAwal} tone="text-purple-700" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar + non-hadir side-by-side on desktop */}
      <div className="grid lg:grid-cols-2 gap-4">
        <AttendanceCalendar records={records} />
        <Card className="glass-card border-0">
          <CardContent className="p-5">
            <h3 className="font-semibold mb-3">Rekod Ketidakhadiran</h3>
            {nonHadir.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tiada ketidakhadiran untuk tempoh ini. Alhamdulillah.
              </p>
            ) : (
              <ul className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {nonHadir.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-2 text-sm border-b border-border/60 pb-2 last:border-0"
                  >
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[r.status as AttendanceStatus] }}
                    />
                    <span className="font-medium w-24 shrink-0">
                      {formatDateMY(r.tarikh)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {STATUS_LABEL_MY[r.status as AttendanceStatus]}
                    </Badge>
                    {r.catatan && (
                      <span className="text-muted-foreground truncate">
                        — {r.catatan}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly trend chart */}
      <Card className="glass-card border-0">
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3">Tren Kehadiran Bulanan</h3>
          {monthly.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tiada data untuk tempoh ini.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, "Peratus Hadir"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #ccc" }}
                />
                <Bar
                  dataKey="peratus"
                  fill="#16a34a"
                  radius={[6, 6, 0, 0]}
                  name="Peratus"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`text-xl font-semibold ${tone ?? ""}`}>{value}</p>
    </div>
  );
}
