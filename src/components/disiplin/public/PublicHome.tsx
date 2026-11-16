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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12 space-y-10">
      {/* Hero */}
      <section className="text-center space-y-4">
        <div className="flex justify-center">
          <span className="grid size-24 sm:size-28 place-items-center rounded-full bg-white shadow-lg ring-2 ring-primary/20 overflow-hidden">
            <Image
              src="/logo-mtaf.png"
              alt="Logo Madrasah Tahfiz Al Furqan"
              width={92}
              height={92}
              className="object-contain"
              priority
            />
          </span>
        </div>
        <p className="text-sm uppercase tracking-[0.2em] text-primary font-medium">
          Assalamualaikum
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-balance">
          Cari Laporan Anak Anda
        </h1>
        <p className="max-w-2xl mx-auto text-muted-foreground text-base sm:text-lg">
          Semak rekod kedatangan, penilaian sahsiah, dan merit &amp; demerit
          murid Madrasah Tahfiz Al Furqan. Masukkan No. Kad Pengenalan penuh
          atau nama murid untuk membuka laporan.
        </p>
      </section>

      {/* Search box */}
      <Card className="glass-card border-0 max-w-2xl mx-auto">
        <CardContent className="p-5 sm:p-6 space-y-4">
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
                    ? "text-emerald-600"
                    : isName
                    ? "text-amber-600"
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

      {/* Module info cards */}
      <section aria-labelledby="modul-title">
        <h2 id="modul-title" className="sr-only">
          Tiga modul laporan
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <ModuleCard
            icon={CalendarCheck}
            title="Kedatangan"
            desc="Rekod harian hadir, lewat, sakit, dan kebenaran dengan peratus kehadiran dan kalendar bulanan."
          />
          <ModuleCard
            icon={Star}
            title="Sahsiah"
            desc="Penilaian 5 aspek akhlak: akhlak, ibadah, kebersihan, tanggungjawab, dan sosial dengan gred dan radar."
          />
          <ModuleCard
            icon={Scale}
            title="Merit & Demerit"
            desc="Mata bersih, tahap disiplin, dan sejarah tindakan dengan penebusan merit dan laluan kelulusan HEM."
          />
        </div>
      </section>

      {/* Note */}
      <section className="text-center text-sm text-muted-foreground max-w-2xl mx-auto flex items-center justify-center gap-2">
        <BookOpen className="size-4 shrink-0" />
        <span>
          Data laporan dikemas kini oleh guru dan HEM setiap hari sekolah.
          Tarikh hari ini:{" "}
          <span className="font-medium text-foreground">
            {formatDateMY(todayISO())}
          </span>
          .
        </span>
      </section>
    </main>
  );
}

function ModuleCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Card className="glass-card border-0">
      <CardContent className="p-5 space-y-3">
        <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}
