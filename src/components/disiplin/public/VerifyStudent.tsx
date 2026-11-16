"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/disiplin/store";
import { parentApi } from "@/lib/disiplin/api";
import {
  normalizeIC,
  isValidIC,
  maskIC,
} from "@/lib/disiplin/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";

export function VerifyStudent() {
  const selectedId = useStore((s) => s.selectedStudentId);
  const results = useStore((s) => s.searchResults);
  const config = useStore((s) => s.config);
  const setPublicView = useStore((s) => s.setPublicView);
  const setParentToken = useStore((s) => s.setParentToken);
  const setReportData = useStore((s) => s.setReportData);
  const goPublicHome = useStore((s) => s.goPublicHome);

  const student = results.find((r) => r.id === selectedId);
  const [ic, setIc] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill masked IC into input if it's the IC-exact path
  useEffect(() => {
    setIc("");
    setPin("");
  }, [selectedId]);

  if (!student) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 text-center space-y-4">
        <p className="text-muted-foreground">
          Tiada murid dipilih. Sila kembali ke carian.
        </p>
        <Button onClick={goPublicHome} className="h-11">
          Kembali ke carian
        </Button>
      </main>
    );
  }

  const normIc = normalizeIC(ic);
  const icValid = isValidIC(ic);
  const pinValid = !config?.pengesahanIbuBapa || /^\d{4}$/.test(pin);
  const canSubmit = icValid && pinValid && !submitting;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedId) return;
    setSubmitting(true);
    try {
      const res = await parentApi.post<{ token: string; studentId: string; nama: string; kelas: string }>(
        "/api/students/verify",
        {
          id: selectedId,
          ic: normIc,
          pin: config?.pengesahanIbuBapa ? pin : undefined,
        }
      );
      setParentToken(res.token);
      setReportData(null);
      setPublicView("report");
      toast.success("Pengesahan berjaya. Laporan dibuka.");
    } catch (err: any) {
      if (err?.status === 403) {
        toast.error("Pengesahan gagal. IC atau PIN tidak sepadan.");
      } else if (err?.status === 404) {
        toast.error("Murid tidak dijumpai.");
      } else {
        toast.error(err?.error || "Gagal mengesahkan murid.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8 space-y-5">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setPublicView("results")}
        className="h-10"
      >
        <ArrowLeft className="size-4" /> Kembali
      </Button>

      <Card className="glass-card border-0">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <User className="size-6" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Murid
              </p>
              <p className="font-semibold text-lg leading-tight">
                {student.nama}
              </p>
              <p className="text-sm text-muted-foreground">
                {student.kelas} · {student.icMasked || (student.ic ? maskIC(student.ic) : "")}
              </p>
            </div>
          </div>

          <div className="ornament-line h-px" aria-hidden="true" />

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ic">No. Kad Pengenalan Penuh (12 digit)</Label>
              <Input
                id="ic"
                value={ic}
                onChange={(e) => setIc(e.target.value)}
                placeholder="Contoh: 120514100123"
                inputMode="numeric"
                className="h-11 text-base tracking-wider"
                aria-describedby="ic-hint"
              />
              <p id="ic-hint" className="text-xs text-muted-foreground">
                {icValid
                  ? "IC diterima."
                  : "Masukkan 12 digit tanpa sengkang."}
              </p>
            </div>

            {config?.pengesahanIbuBapa && (
              <div className="space-y-1.5">
                <Label htmlFor="pin">4 digit akhir IC penjaga</Label>
                <Input
                  id="pin"
                  value={pin}
                  onChange={(e) =>
                    setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="Contoh: 1234"
                  inputMode="numeric"
                  className="h-11 text-base tracking-widest"
                  maxLength={4}
                />
                <p className="text-xs text-muted-foreground">
                  Pengesahan tambahan diaktifkan oleh pentadbir.
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11"
              disabled={!canSubmit}
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              Sahkan &amp; Lihat Laporan
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
