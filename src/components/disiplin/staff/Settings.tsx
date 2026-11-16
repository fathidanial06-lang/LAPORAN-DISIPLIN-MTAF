"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/disiplin/store";
import { staffApi } from "@/lib/disiplin/api";
import type { AppConfig } from "@/lib/disiplin/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Save, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function Settings() {
  const staffToken = useStore((s) => s.staffToken);
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const setStaffView = useStore((s) => s.setStaffView);

  async function load() {
    if (!staffToken) return;
    setLoading(true);
    try {
      const res = await staffApi.get<AppConfig>("/api/config", staffToken);
      setCfg(res);
    } catch {
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [staffToken]);

  async function save() {
    if (!cfg || !staffToken) return;
    setSaving(true);
    try {
      await staffApi.put("/api/staff/config", cfg, staffToken);
      toast.success("Tetapan disimpan.");
    } catch (err: any) {
      toast.error(err?.error || "Gagal menyimpan tetapan.");
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!staffToken) return;
    setResetting(true);
    try {
      await staffApi.post("/api/staff/reset", {}, staffToken);
      toast.success("Data dummy ditetapkan semula.");
      setStaffView("dashboard");
    } catch (err: any) {
      toast.error(err?.error || "Gagal menetapkan semula.");
    } finally {
      setResetting(false);
    }
  }

  if (loading || !cfg) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Tetapan Sistem</h2>

      <Card className="glass-card border-0">
        <CardContent className="p-5 space-y-5">
          <section className="space-y-3">
            <h3 className="font-semibold">Umum</h3>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Pengesahan Ibu Bapa</p>
                <p className="text-xs text-muted-foreground">
                  Aktifkan 4 digit akhir IC penjaga sebagai PIN tambahan.
                </p>
              </div>
              <Switch
                checked={cfg.pengesahanIbuBapa}
                onCheckedChange={(v) =>
                  setCfg({ ...cfg, pengesahanIbuBapa: v })
                }
                aria-label="Pengesahan ibu bapa"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Penggal Aktif</Label>
              <Input
                value={cfg.penggalAktif}
                onChange={(e) =>
                  setCfg({ ...cfg, penggalAktif: e.target.value })
                }
                className="h-10"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold">Ambang Kehadiran (%)</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Cemerlang ≥</Label>
                <Input
                  type="number"
                  value={cfg.ambangKehadiran.CEMERLANG}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      ambangKehadiran: {
                        ...cfg.ambangKehadiran,
                        CEMERLANG: Number(e.target.value),
                      },
                    })
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Baik ≥</Label>
                <Input
                  type="number"
                  value={cfg.ambangKehadiran.BAIK}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      ambangKehadiran: {
                        ...cfg.ambangKehadiran,
                        BAIK: Number(e.target.value),
                      },
                    })
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Perlu Perhatian ≥</Label>
                <Input
                  type="number"
                  value={cfg.ambangKehadiran.PERLU_PERHATIAN}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      ambangKehadiran: {
                        ...cfg.ambangKehadiran,
                        PERLU_PERHATIAN: Number(e.target.value),
                      },
                    })
                  }
                  className="h-10"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold">Ambang Disiplin (max demerit)</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {(
                [
                ["CEMERLANG", cfg.ambangDisiplin.CEMERLANG.max],
                ["BAIK", cfg.ambangDisiplin.BAIK.max],
                ["PERLU_PERHATIAN", cfg.ambangDisiplin.PERLU_PERHATIAN.max],
                ["AMARAN_SERIUS", cfg.ambangDisiplin.AMARAN_SERIUS.max],
                ["KRITIKAL", cfg.ambangDisiplin.KRITIKAL.min],
                ] as [string, number][]
              ).map(([k, v]) => (
                <div key={k} className="space-y-1">
                  <Label className="text-xs">
                    {k === "KRITIKAL" ? `${k} (min)` : k}
                  </Label>
                  <Input
                    type="number"
                    value={v}
                    onChange={(e) =>
                      setCfg({
                        ...cfg,
                        ambangDisiplin: {
                          ...cfg.ambangDisiplin,
                          [k]:
                            k === "KRITIKAL"
                              ? { min: Number(e.target.value) }
                              : { max: Number(e.target.value) },
                        } as any,
                      })
                    }
                    className="h-10"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-1.5">
            <Label>Hari Cuti (satu tarikh ISO per baris)</Label>
            <Textarea
              value={(cfg.hariCuti || []).join("\n")}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  hariCuti: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="2026-01-01&#10;2026-02-01"
              className="min-h-28 font-mono text-sm"
            />
          </section>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="h-10">
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Simpan Tetapan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-0 border-destructive/40">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-destructive">Zon Bahaya</h3>
          <p className="text-sm text-muted-foreground">
            Menetapkan semula data dummy akan memadam semua perubahan dan
            memuat semula dataset contoh. Gunakan dengan berhati-hati.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="h-10">
                <RefreshCw className="size-4" /> Tetap Semula Data Dummy
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Tetapkan semula semua data dummy?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak boleh dibuat asal. Semua murid, kedatangan,
                  dan rekod merit akan dipulihkan kepada dataset contoh.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={reset} disabled={resetting}>
                  {resetting && <Loader2 className="size-4 animate-spin" />}
                  Sahkan
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
