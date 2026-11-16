"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/disiplin/store";
import { staffApi } from "@/lib/disiplin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateMY, todayISO } from "@/lib/disiplin/domain";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  CalendarCheck,
  Clock,
  CalendarX2,
  Hourglass,
  AlertTriangle,
  ListChecks,
} from "lucide-react";

export function Dashboard() {
  const staffToken = useStore((s) => s.staffToken);
  const setStaffView = useStore((s) => s.setStaffView);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staffToken) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await staffApi.get<{
          stats: any;
          perluPerhatian: any[];
          demeritTerkini: any[];
        }>("/api/staff/dashboard", staffToken);
        if (!cancelled) setData(d);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [staffToken]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 auto-rows-[120px] gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="rounded-2xl" />
        ))}
      </div>
    );
  }

  const s = data?.stats ?? {};

  return (
    <div className="space-y-4">
      {/* ===== Bento grid: stats + lists ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 auto-rows-[110px] gap-4">
        {/* Jumlah murid — wide hero stat */}
        <BentoStat
          className="col-span-2 md:col-span-2 lg:col-span-2 row-span-2"
          label="Jumlah Murid"
          value={s.jumlahMurid ?? 0}
          icon={Users}
          tone="default"
          big
        />
        {/* Hadir hari ini */}
        <BentoStat
          className="col-span-1 md:col-span-2 lg:col-span-2 row-span-1"
          label="Hadir Hari Ini"
          value={s.hadirHariIni ?? 0}
          icon={CalendarCheck}
          tone="good"
        />
        {/* Lewat */}
        <BentoStat
          className="col-span-1 md:col-span-1 lg:col-span-1 row-span-1"
          label="Lewat"
          value={s.lewatHariIni ?? 0}
          icon={Clock}
          tone="warn"
        />
        {/* Menunggu kelulusan */}
        <BentoStat
          className="col-span-1 md:col-span-1 lg:col-span-1 row-span-1"
          label="Menunggu Lulus"
          value={s.menungguKelulusan ?? 0}
          icon={Hourglass}
          tone="warn"
        />
        {/* Tidak hadir */}
        <BentoStat
          className="col-span-1 md:col-span-1 lg:col-span-1 row-span-1"
          label="Tidak Hadir"
          value={s.tidakHadirHariIni ?? 0}
          icon={CalendarX2}
          tone="danger"
        />
        {/* Perlu perhatian */}
        <BentoStat
          className="col-span-1 md:col-span-1 lg:col-span-1 row-span-1"
          label="Perlu Perhatian"
          value={data?.perluPerhatian?.length ?? 0}
          icon={AlertTriangle}
          tone="danger"
        />

        {/* Perlu Perhatian list — large bento */}
        <Card className="glass-card border-0 col-span-2 md:col-span-2 lg:col-span-4 row-span-3 overflow-hidden">
          <CardContent className="p-5 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="grid size-9 place-items-center rounded-xl neu-inset text-accent shrink-0">
                <AlertTriangle className="size-4" />
              </span>
              <h3 className="font-semibold">Perlu Perhatian</h3>
            </div>
            {data?.perluPerhatian?.length ? (
              <ul className="space-y-2 max-h-72 overflow-y-auto pr-1 -mr-1">
                {data.perluPerhatian.map((p: any) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 neu-inset rounded-xl px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-sm">{p.nama}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.kelas} · {p.sebab}
                      </p>
                    </div>
                    <button
                      onClick={() => setStaffView("students")}
                      className="text-xs text-primary hover:underline shrink-0"
                    >
                      Lihat
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tiada murid yang memerlukan perhatian kritikal.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Demerit terkini — tall bento */}
        <Card className="glass-card border-0 col-span-2 md:col-span-2 lg:col-span-2 row-span-3 overflow-hidden">
          <CardContent className="p-5 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="grid size-9 place-items-center rounded-xl neu-inset text-accent shrink-0">
                <ListChecks className="size-4" />
              </span>
              <h3 className="font-semibold">Demerit Terkini</h3>
            </div>
            {data?.demeritTerkini?.length ? (
              <ul className="space-y-2 max-h-72 overflow-y-auto pr-1 -mr-1">
                {data.demeritTerkini.map((d: any) => (
                  <li
                    key={d.id}
                    className="neu-inset rounded-xl px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{d.namaMurid}</span>
                      <span className="ml-auto font-semibold text-red-600 shrink-0">
                        {d.mata}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {d.categoryNama} · {formatDateMY(d.tarikh)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tiada demerit terkini.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Tarikh hari ini: {formatDateMY(todayISO())}
      </p>
    </div>
  );
}

function BentoStat({
  label,
  value,
  icon: Icon,
  tone = "default",
  className = "",
  big = false,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "good" | "warn" | "danger";
  className?: string;
  big?: boolean;
}) {
  const toneText: Record<string, string> = {
    default: "text-foreground",
    good: "text-emerald-700",
    warn: "text-amber-700",
    danger: "text-red-600",
  };
  return (
    <Card className={`glass-card border-0 overflow-hidden ${className}`}>
      <CardContent className="p-4 sm:p-5 h-full flex items-center gap-3">
        <span
          className={`grid place-items-center rounded-2xl neu-inset text-accent shrink-0 ${
            big ? "size-16" : "size-12"
          }`}
        >
          <Icon className={big ? "size-7" : "size-5"} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p
            className={`${big ? "text-4xl" : "text-2xl"} font-semibold leading-tight ${toneText[tone]}`}
          >
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
