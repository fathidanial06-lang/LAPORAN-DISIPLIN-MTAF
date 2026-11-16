"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/disiplin/store";
import { staffApi } from "@/lib/disiplin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateMY, todayISO } from "@/lib/disiplin/domain";
import {
  Users,
  CalendarCheck,
  Clock,
  CalendarX2,
  Hourglass,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "../shared/Shared";

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
        const data = await staffApi.get<{
          stats: any;
          perluPerhatian: any[];
          demeritTerkini: any[];
        }>("/api/staff/dashboard", staffToken);
        if (!cancelled) setData(data);
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
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const s = data?.stats ?? {};

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Jumlah Murid" value={s.jumlahMurid ?? 0} icon={Users} />
        <StatCard
          label="Hadir Hari Ini"
          value={s.hadirHariIni ?? 0}
          icon={CalendarCheck}
          tone="good"
        />
        <StatCard label="Lewat Hari Ini" value={s.lewatHariIni ?? 0} icon={Clock} tone="warn" />
        <StatCard
          label="Tidak Hadir Hari Ini"
          value={s.tidakHadirHariIni ?? 0}
          icon={CalendarX2}
          tone="danger"
        />
        <StatCard
          label="Menunggu Kelulusan"
          value={s.menungguKelulusan ?? 0}
          icon={Hourglass}
          tone="warn"
        />
        <StatCard
          label="Perlu Perhatian"
          value={data?.perluPerhatian?.length ?? 0}
          icon={AlertTriangle}
          tone="danger"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="glass-card border-0">
          <CardContent className="p-5">
            <h3 className="font-semibold mb-3">Perlu Perhatian</h3>
            {data?.perluPerhatian?.length ? (
              <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {data.perluPerhatian.map((p: any) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 border-b border-border/60 pb-2 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{p.nama}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.kelas} · {p.sebab}
                      </p>
                    </div>
                    <button
                      onClick={() => setStaffView("students")}
                      className="text-xs text-primary hover:underline"
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

        <Card className="glass-card border-0">
          <CardContent className="p-5">
            <h3 className="font-semibold mb-3">Demerit Terkini</h3>
            {data?.demeritTerkini?.length ? (
              <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {data.demeritTerkini.map((d: any) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-2 border-b border-border/60 pb-2 last:border-0 text-sm"
                  >
                    <span className="font-medium truncate">{d.namaMurid}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="truncate">{d.categoryNama}</span>
                    <span className="ml-auto font-semibold text-red-600">
                      {d.mata}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateMY(d.tarikh)}
                    </span>
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
