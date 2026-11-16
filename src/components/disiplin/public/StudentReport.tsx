"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/disiplin/store";
import { parentApi } from "@/lib/disiplin/api";
import { todayISO, formatDateMY } from "@/lib/disiplin/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CalendarCheck,
  Star,
  Scale,
  Printer,
  Loader2,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { StatusCard } from "./StatusCard";
import { AttendanceDetail } from "./AttendanceDetail";
import { CharacterDetail } from "./CharacterDetail";
import { MeritDetail } from "./MeritDetail";
import { Glossary } from "../shared/Glossary";

function periodRange(filter: string, customFrom: string, customTo: string) {
  const today = new Date();
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  if (filter === "bulan_ini") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: ymd(from), to: todayISO() };
  }
  if (filter === "tahun_ini") {
    const from = new Date(today.getFullYear(), 0, 1);
    return { from: ymd(from), to: todayISO() };
  }
  // penggal_ini default: current 3 months window
  const from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  return { from: ymd(from), to: todayISO() };
  // custom handled separately
}

export function StudentReport() {
  const reportData = useStore((s) => s.reportData);
  const setReportData = useStore((s) => s.setReportData);
  const parentToken = useStore((s) => s.parentToken);
  const periodFilter = useStore((s) => s.periodFilter);
  const setPeriodFilter = useStore((s) => s.setPeriodFilter);
  const customFrom = useStore((s) => s.customFrom);
  const customTo = useStore((s) => s.customTo);
  const setCustomFrom = useStore((s) => s.setCustomFrom);
  const setCustomTo = useStore((s) => s.setCustomTo);
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const setPublicView = useStore((s) => s.setPublicView);
  const logoutParent = useStore((s) => s.logoutParent);
  const config = useStore((s) => s.config);

  const [loading, setLoading] = useState(false);
  const selectedId = useStore((s) => s.selectedStudentId);

  const range = useMemo(() => {
    if (periodFilter === "custom") {
      return { from: customFrom || todayISO(), to: customTo || todayISO() };
    }
    return periodRange(periodFilter, customFrom, customTo);
  }, [periodFilter, customFrom, customTo]);

  useEffect(() => {
    if (!parentToken || !selectedId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await parentApi.get<{
          murid: any;
          kedatangan: any;
          sahsiah: any;
          merit: any;
          totalsByStatus?: any;
        }>(
          `/api/students/${selectedId}/report?from=${range.from}&to=${range.to}`,
          parentToken
        );
        if (!cancelled) setReportData(data);
      } catch (err: any) {
        if (err?.status === 401 || err?.status === 403) {
          toast.error("Sesi tamat. Sila sahkan semula.");
          if (!cancelled) logoutParent();
        } else {
          toast.error(err?.error || "Gagal memuatkan laporan.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [parentToken, selectedId, range.from, range.to]);

  if (!parentToken || !selectedId) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 text-center space-y-4">
        <p className="text-muted-foreground">
          Sesi telah tamat. Sila kembali ke carian.
        </p>
        <Button onClick={logoutParent} className="h-11">
          Kembali
        </Button>
      </main>
    );
  }

  const murid = reportData?.murid;
  const kedatangan = reportData?.kedatangan;
  const sahsiah = reportData?.sahsiah;
  const merit = reportData?.merit;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 space-y-5">
      {/* Top bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPublicView("home")}
          className="h-10"
        >
          <ArrowLeft className="size-4" /> Carian
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={logoutParent}
          className="h-10"
        >
          <LogOut className="size-4" /> Keluar
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={() => window.print()}
          >
            <Printer className="size-4" /> Cetak / Simpan PDF
          </Button>
        </div>
      </div>

      {/* Student header */}
      {loading && !murid ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : (
        <Card className="glass-card border-0">
          <CardContent className="p-5 flex flex-wrap items-center gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Laporan Disiplin Murid
              </p>
              <h1 className="text-2xl font-bold leading-tight">
                {murid?.nama ?? "-"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {murid?.kelas ?? "-"} · Tahun {murid?.tahun ?? "-"}
                {murid?.asrama ? " · Berasrama" : " · Tidak berasrama"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              Tempoh: {formatDateMY(range.from)} – {formatDateMY(range.to)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period filter */}
      <Tabs
        value={periodFilter}
        onValueChange={(v) => setPeriodFilter(v as any)}
      >
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="bulan_ini" className="h-9 px-3">
            Bulan Ini
          </TabsTrigger>
          <TabsTrigger value="penggal_ini" className="h-9 px-3">
            Penggal Ini
          </TabsTrigger>
          <TabsTrigger value="tahun_ini" className="h-9 px-3">
            Tahun Ini
          </TabsTrigger>
          <TabsTrigger value="custom" className="h-9 px-3">
            Tersuai
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {periodFilter === "custom" && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Dari</label>
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Hingga</label>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-11"
            />
          </div>
        </div>
      )}

      {/* Status cards — bento grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[120px] gap-4">
          <Skeleton className="col-span-2 md:col-span-2 row-span-2 rounded-2xl" />
          <Skeleton className="col-span-1 md:col-span-1 row-span-2 rounded-2xl" />
          <Skeleton className="col-span-1 md:col-span-1 row-span-2 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[120px] gap-4">
          <StatusCard
            className="col-span-2 md:col-span-2 row-span-2"
            icon={CalendarCheck}
            title="Kedatangan"
            metric={
              kedatangan?.stats ? `${kedatangan.stats.peratus}%` : "—"
            }
            detail={kedatangan?.stats ? kedatanganNarration(kedatangan.stats) : "Tiada rekod kedatangan."}
            color={kedatanganColor(kedatangan?.stats?.status)}
            big
          />
          <StatusCard
            className="col-span-1 md:col-span-1 row-span-2"
            icon={Star}
            title="Sahsiah"
            metric={sahsiah?.grade ? `Gred ${sahsiah.grade.gred}` : "—"}
            detail={sahsiah?.grade ? sahsiahNarration(sahsiah.grade) : "Penilaian sahsiah belum tersedia."}
            color={sahsiahColor(sahsiah?.grade?.gred)}
          />
          <StatusCard
            className="col-span-1 md:col-span-1 row-span-2"
            icon={Scale}
            title="Merit & Demerit"
            metric={
              merit?.totals ? `${merit.totals.bersih >= 0 ? "+" : ""}${merit.totals.bersih}` : "—"
            }
            detail={merit?.totals ? meritNarration(merit.totals) : "Tiada rekod merit/demerit."}
            color={meritColor(merit?.totals?.tahap)}
          />
        </div>
      )}

      {/* Detail tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
      >
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="ringkasan" className="h-9 px-3">Ringkasan</TabsTrigger>
          <TabsTrigger value="kedatangan" className="h-9 px-3">Kedatangan</TabsTrigger>
          <TabsTrigger value="sahsiah" className="h-9 px-3">Sahsiah</TabsTrigger>
          <TabsTrigger value="merit" className="h-9 px-3">Merit &amp; Demerit</TabsTrigger>
        </TabsList>

        <TabsContent value="ringkasan" className="space-y-4">
          <Card className="glass-card border-0">
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold">Ringkasan Laporan</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Laporan ini merangkumi tiga modul utama: kedatangan harian,
                penilaian sahsiah (akhlak, ibadah, kebersihan, tanggungjawab,
                sosial), dan rekod merit/demerit. Lihat setiap tab untuk
                butiran penuh.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {kedatangan?.stats && (
                  <Badge variant="outline">
                    {kedatangan.stats.peratus}% kehadiran
                  </Badge>
                )}
                {sahsiah?.grade && (
                  <Badge variant="outline">Gred sahsiah {sahsiah.grade.gred}</Badge>
                )}
                {merit?.totals && (
                  <Badge variant="outline">
                    Mata bersih {merit.totals.bersih}
                  </Badge>
                )}
                {merit?.totals && (
                  <Badge variant="outline">
                    Tahap: {merit.totals.tahap}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
          <Glossary />
        </TabsContent>

        <TabsContent value="kedatangan">
          {loading ? (
            <Skeleton className="h-72 rounded-2xl" />
          ) : (
            <AttendanceDetail kedatangan={kedatangan} />
          )}
        </TabsContent>

        <TabsContent value="sahsiah">
          {loading ? (
            <Skeleton className="h-72 rounded-2xl" />
          ) : (
            <CharacterDetail sahsiah={sahsiah} />
          )}
        </TabsContent>

        <TabsContent value="merit">
          {loading ? (
            <Skeleton className="h-72 rounded-2xl" />
          ) : (
            <MeritDetail merit={merit} />
          )}
        </TabsContent>
      </Tabs>

      {config && (
        <p className="text-xs text-center text-muted-foreground">
          Penggal aktif: {config.penggalAktif}
        </p>
      )}
    </main>
  );
}

function kedatanganNarration(stats: any): string {
  const hadirEfektif = stats.hadir + stats.lewat;
  const tidakHadir = stats.hariSekolah - hadirEfektif;
  if (stats.hariSekolah === 0) return "Tiada rekod kedatangan untuk tempoh ini.";
  return `Anak anda hadir ${hadirEfektif} daripada ${stats.hariSekolah} hari. ${
    stats.lewat ? `${stats.lewat} hari lewat. ` : ""
  }${tidakHadir ? `${tidakHadir} hari tidak hadir.` : "Tiada ketidakhadiran."}`.trim();
}
function kedatanganColor(status?: string): string {
  switch (status) {
    case "CEMERLANG":
      return "#16a34a";
    case "BAIK":
      return "#65a30d";
    case "PERLU_PERHATIAN":
      return "#eab308";
    case "KRITIKAL":
      return "#dc2626";
    default:
      return "#64748b";
  }
}
function sahsiahNarration(g: any): string {
  if (g.gred === "A") return "Akhlak cemerlang. Teruskan usaha dan kekalkan adab yang baik.";
  if (g.gred === "B") return "Akhlak baik. Sedikit peningkatan dalam aspek tertentu akan membantu.";
  if (g.gred === "C") return "Akhlak memuaskan. Bimbingan guru diperlukan untuk beberapa aspek.";
  return "Perlu bimbingan. Sila hubungi guru kelas untuk perbincangan.";
}
function sahsiahColor(gred?: string): string {
  switch (gred) {
    case "A":
      return "#16a34a";
    case "B":
      return "#65a30d";
    case "C":
      return "#eab308";
    case "D":
      return "#dc2626";
    default:
      return "#64748b";
  }
}
function meritNarration(t: any): string {
  if (!t) return "";
  return `${t.tindakan} (Mata Bersih: ${t.bersih})`;
}
function meritColor(tahap?: string): string {
  switch (tahap) {
    case "CEMERLANG":
      return "#16a34a";
    case "BAIK":
      return "#65a30d";
    case "PERLU_PERHATIAN":
      return "#eab308";
    case "AMARAN_SERIUS":
      return "#ea580c";
    case "KRITIKAL":
      return "#dc2626";
    default:
      return "#64748b";
  }
}
