"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateMY, TAHAP_COLORS } from "@/lib/disiplin/domain";
import { TahapBadge } from "../shared/Shared";

export function MeritDetail({ merit }: { merit: any }) {
  const records: any[] = merit?.records ?? [];
  const totals = merit?.totals ?? null;
  const [filter, setFilter] = useState<"all" | "merit" | "demerit">("all");

  const filtered = useMemo(() => {
    const sorted = [...records].sort((a, b) =>
      b.tarikh.localeCompare(a.tarikh)
    );
    return sorted.filter((r) => {
      if (filter === "all") return true;
      if (filter === "merit") return r.mata >= 0;
      return r.mata < 0;
    });
  }, [records, filter]);

  return (
    <div className="space-y-4">
      {totals && (
        <Card className="glass-card border-0">
          <CardContent className="p-5 grid sm:grid-cols-4 gap-4">
            <div className="sm:col-span-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Mata Bersih
              </p>
              <p
                className="text-4xl font-bold"
                style={{
                  color:
                    totals.bersih >= 0 ? "#16a34a" : "#dc2626",
                }}
              >
                {totals.bersih >= 0 ? "+" : ""}
                {totals.bersih}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Merit
              </p>
              <p className="text-2xl font-semibold text-emerald-700">
                +{totals.merit}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Demerit
              </p>
              <p className="text-2xl font-semibold text-red-600">
                -{totals.demerit}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Tahap Disiplin
              </p>
              <div className="mt-1">
                <TahapBadge tahap={totals.tahap} />
              </div>
            </div>
            <div className="sm:col-span-4 rounded-xl bg-muted/40 p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-1">Tindakan:</p>
              <p className="text-foreground">{totals.tindakan}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all" className="h-9">Semua</TabsTrigger>
          <TabsTrigger value="merit" className="h-9">Merit</TabsTrigger>
          <TabsTrigger value="demerit" className="h-9">Demerit</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="glass-card border-0">
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3">Sejarah Rekod</h3>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tiada rekod untuk penapis ini.
            </p>
          ) : (
            <ol className="relative border-s border-border/60 ml-1 max-h-[480px] overflow-y-auto pr-1">
              {filtered.map((r) => {
                const isMerit = r.mata >= 0;
                const color = isMerit ? "#16a34a" : "#dc2626";
                return (
                  <li key={r.id} className="mb-4 ps-4">
                    <span
                      className="absolute -start-[7px] mt-1.5 size-3.5 rounded-full border-2 border-background"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm">
                        {formatDateMY(r.tarikh)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {r.categoryNama || r.categoryId}
                      </Badge>
                      <span
                        className="text-sm font-semibold"
                        style={{ color }}
                      >
                        {isMerit ? `+${r.mata}` : r.mata}
                      </span>
                      {r.status !== "DILULUSKAN" && (
                        <Badge variant="secondary" className="text-xs">
                          {labelStatus(r.status)}
                        </Badge>
                      )}
                    </div>
                    {r.penerangan && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {r.penerangan}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function labelStatus(s: string): string {
  if (s === "MENUNGGU") return "Menunggu kelulusan";
  if (s === "DIBATALKAN") return "Dibatalkan";
  return s;
}
