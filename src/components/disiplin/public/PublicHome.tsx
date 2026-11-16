"use client";

import { useState } from "react";
import Image from "next/image";
import { useStore } from "@/lib/disiplin/store";
import { parentApi } from "@/lib/disiplin/api";
import {
  normalizeIC,
  isValidIC,
  todayISO,
  formatDateMY,
} from "@/lib/disiplin/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Search,
  CalendarCheck,
  Star,
  Scale,
  ShieldCheck,
  Loader2,
  BookOpen,
  Clock,
  Users,
  GraduationCap,
  HeartHandshake,
} from "lucide-react";

export function PublicHome() {
  const setPublicView = useStore((s) => s.setPublicView);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const setSearchResults = useStore((s) => s.setSearchResults);
  const setSelectedStudentId = useStore((s) => s.setSelectedStudentId);
  const config = useStore((s) => s.config);

  const [raw, setRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const norm = normalizeIC(raw);
  const isIC = isValidIC(raw);
  const isName = norm.length === 0 && raw.trim().length >= 2;
  const canSubmit = isIC || isName;

  const hint = isIC
    ? "IC dikesan (12 digit)"
    : isName
    ? "Carian nama"
    : raw.length > 0
    ? "Masukkan minimum 2 aksara atau 12 digit IC"
    : "Cth: 120514100123 atau nama murid";

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setSearchQuery(raw);
    try {
      const data = await parentApi.get<{ results: any[] }>(
        `/api/students/search?q=${encodeURIComponent(raw)}`
      );
      setSearchResults(data.results);
      if (data.results.length === 1 && isValidIC(raw)) {
        setSelectedStudentId(data.results[0].id);
        setPublicView("verify");
      } else {
        setPublicView("results");
      }
    } catch (err: any) {
      if (err?.status === 429) {
        toast.error(
          "Terlalu banyak cubaan. Sila tunggu sebentar dan cuba lagi."
        );
      } else {
        toast.error(err?.error || "Gagal mencari murid.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10 space-y-6">
      {/* ===== Bento grid: hero / search / modules ===== */}
      <section
        aria-label="Laman utama portal"
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 auto-rows-[120px] gap-4 sm:gap-5"
      >
        {/* Brand / hero tile — spans wide */}
        <Card className="glass-card border-0 col-span-2 md:col-span-2 lg:col-span-4 row-span-2 overflow-hidden">
          <CardContent className="p-6 sm:p-8 h-full flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <span className="grid size-28 sm:size-32 shrink-0 place-items-center rounded-3xl bg-white/95 overflow-hidden logo-ring">
              <Image
                src="/logo-mtaf.png"
                alt="Logo Madrasah Tahfiz Al Furqan"
                width={108}
                height={108}
                className="object-contain p-2 sm:p-2.5"
                priority
              />
            </span>
            <div className="flex-1 text-center sm:text-left min-w-0 space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-gold-gradient font-semibold">
                Assalamualaikum
              </p>
              <h1 className="text-2xl sm:text-4xl font-bold text-balance text-foreground leading-tight">
                Cari Laporan Anak Anda
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                Semak rekod kedatangan, penilaian sahsiah, dan merit &amp;
                demerit murid Madrasah Tahfiz Al Furqan.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick stat: pengguna tile */}
        <Card className="glass-card border-0 col-span-1 lg:col-span-2 row-span-1">
          <CardContent className="p-4 h-full flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl neu-inset text-accent shrink-0">
              <Users className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Pengguna
              </p>
              <p className="text-sm font-semibold leading-tight">
                Ibu Bapa · Guru · HEM
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Today date tile */}
        <Card className="glass-card border-0 col-span-1 lg:col-span-2 row-span-1">
          <CardContent className="p-4 h-full flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl neu-inset text-accent shrink-0">
              <Clock className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Tarikh Hari Ini
              </p>
              <p className="text-sm font-semibold leading-tight">
                {formatDateMY(todayISO())}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Search tile — wide and prominent */}
        <Card className="glass-card border-0 col-span-2 md:col-span-4 lg:col-span-6 row-span-2">
          <CardContent className="p-5 sm:p-6 h-full flex flex-col justify-center space-y-3">
            <form onSubmit={submit} className="space-y-3">
              <label htmlFor="carian" className="sr-only">
                Masukkan No. IC atau Nama Murid
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="carian"
                    value={raw}
                    onChange={(e) => setRaw(e.target.value)}
                    placeholder="Masukkan No. IC atau Nama Murid"
                    className="h-11 pl-9 text-base"
                    autoComplete="off"
                    inputMode="text"
                    aria-describedby="carian-hint"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 px-5"
                  disabled={!canSubmit || submitting}
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Search className="size-4" />
                  )}
                  Semak
                </Button>
              </div>
              <p
                id="carian-hint"
                className="text-xs text-muted-foreground flex items-center gap-1.5"
              >
                <span
                  className={
                    isIC
                      ? "text-emerald-700"
                      : isName
                      ? "text-amber-700"
                      : ""
                  }
                >
                  {hint}
                </span>
              </p>
            </form>
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              <span>
                Laporan hanya dipaparkan selepas No. IC penuh disahkan.
              </span>
            </div>
            {config?.pengesahanIbuBapa && (
              <p className="text-xs text-center text-muted-foreground">
                Pengesahan tambahan (4 digit akhir IC penjaga) diaktifkan oleh
                pentadbir.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Module: Kedatangan — large bento (wide + tall) */}
        <Card className="glass-card border-0 col-span-2 md:col-span-2 lg:col-span-3 row-span-2 overflow-hidden">
          <CardContent className="p-5 h-full flex flex-col justify-between gap-3">
            <span className="grid size-14 place-items-center rounded-2xl neu-inset text-accent">
              <CalendarCheck className="size-6" />
            </span>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-lg">Kedatangan</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Rekod harian hadir, lewat, sakit, dan kebenaran dengan peratus
                kehadiran dan kalendar bulanan.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Module: Sahsiah — small square bento */}
        <Card className="glass-card border-0 col-span-2 md:col-span-1 lg:col-span-1 row-span-2 overflow-hidden">
          <CardContent className="p-5 h-full flex flex-col justify-between gap-3">
            <span className="grid size-12 place-items-center rounded-2xl neu-inset text-accent">
              <Star className="size-5" />
            </span>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-base">Sahsiah</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                5 aspek akhlak dengan gred dan radar.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Module: Merit & Demerit — medium bento */}
        <Card className="glass-card border-0 col-span-2 md:col-span-3 lg:col-span-2 row-span-2 overflow-hidden">
          <CardContent className="p-5 h-full flex flex-col justify-between gap-3">
            <span className="grid size-14 place-items-center rounded-2xl neu-inset text-accent">
              <Scale className="size-6" />
            </span>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-lg">Merit &amp; Demerit</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Mata bersih, tahap disiplin, dan sejarah tindakan dengan
                penebusan merit dan laluan kelulusan HEM.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer notes tiles */}
        <Card className="glass-card border-0 col-span-2 md:col-span-2 lg:col-span-3 row-span-1">
          <CardContent className="p-4 h-full flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl neu-inset text-accent shrink-0">
              <GraduationCap className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground leading-snug">
              Untuk ibu bapa — akses pantas laporan disiplin anak tanpa perlu
              menunggu laporan bercetak.
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card border-0 col-span-2 md:col-span-2 lg:col-span-3 row-span-1">
          <CardContent className="p-4 h-full flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl neu-inset text-accent shrink-0">
              <HeartHandshake className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground leading-snug">
              Untuk guru &amp; HEM — rekod pantas kedatangan pukal dan
              merit/demerit dioptimumkan untuk telefon.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Disclaimer note */}
      <section className="text-center text-sm text-muted-foreground max-w-2xl mx-auto flex items-center justify-center gap-2">
        <BookOpen className="size-4 shrink-0" />
        <span>
          Data laporan dikemas kini oleh guru dan HEM setiap hari sekolah.
          Semua data adalah rekaan untuk prototaip.
        </span>
      </section>
    </main>
  );
}
