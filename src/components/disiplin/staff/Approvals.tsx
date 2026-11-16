"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/disiplin/store";
import { staffApi } from "@/lib/disiplin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateMY } from "@/lib/disiplin/domain";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ApprovalRow {
  id: string;
  studentId: string;
  namaMurid: string;
  categoryId: string;
  categoryNama: string;
  tahap: string;
  jenis: string;
  mata: number;
  tarikh: string;
  penerangan?: string;
}

export function Approvals() {
  const staffToken = useStore((s) => s.staffToken);
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<ApprovalRow | null>(null);
  const [sebab, setSebab] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    if (!staffToken) return;
    setLoading(true);
    try {
      // Get pending merits: simple approach — list all merits via audit endpoint? 
      // Use /api/staff/students then query /api/merits?status=MENUNGGU per student would be heavy.
      // Backend exposes /api/staff/dashboard with demeritTerkini; we expect a dedicated endpoint
      // not in the contract. So we fall back to listing all students then their merits pending.
      const sRes = await staffApi.get<{ students: any[] }>(
        `/api/staff/students`,
        staffToken
      );
      const collected: ApprovalRow[] = [];
      await Promise.all(
        (sRes.students ?? []).map(async (st) => {
          try {
            const m = await staffApi.get<{ records: any[] }>(
              `/api/students/${st.id}/merits?status=MENUNGGU`,
              staffToken
            );
            for (const r of m.records ?? []) {
              if (r.status === "MENUNGGU") {
                collected.push({
                  id: r.id,
                  studentId: st.id,
                  namaMurid: st.nama,
                  categoryId: r.categoryId,
                  categoryNama: r.categoryNama || r.categoryId,
                  tahap: r.tahap || "",
                  jenis: r.jenis || (r.mata >= 0 ? "MERIT" : "DEMERIT"),
                  mata: r.mata,
                  tarikh: r.tarikh,
                  penerangan: r.penerangan,
                });
              }
            }
          } catch {
            // ignore
          }
        })
      );
      setRows(collected);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [staffToken]);

  async function approve(r: ApprovalRow) {
    if (!staffToken) return;
    setBusy(r.id);
    try {
      await staffApi.patch(
        `/api/merits/${r.id}/approve`,
        { action: "approve" },
        staffToken
      );
      toast.success("Rekod diluluskan.");
      setRows((prev) => prev.filter((x) => x.id !== r.id));
    } catch (err: any) {
      toast.error(err?.error || "Gagal meluluskan rekod.");
    } finally {
      setBusy(null);
    }
  }

  async function cancel(r: ApprovalRow, sebabText: string) {
    if (!staffToken) return;
    setBusy(r.id);
    try {
      await staffApi.patch(
        `/api/merits/${r.id}/approve`,
        { action: "cancel", sebab: sebabText || "Dibatalkan oleh HEM" },
        staffToken
      );
      toast.success("Rekod dibatalkan.");
      setRows((prev) => prev.filter((x) => x.id !== r.id));
      setCancelTarget(null);
      setSebab("");
    } catch (err: any) {
      toast.error(err?.error || "Gagal membatalkan rekod.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Kelulusan HEM</h2>
        <p className="text-sm text-muted-foreground">
          Rekod demerit berat menunggu kelulusan sebelum dipaparkan kepada ibu
          bapa.
        </p>
      </div>

      <Card className="glass-card border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">
              Tiada rekod menunggu kelulusan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Murid</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tahap</TableHead>
                    <TableHead>Mata</TableHead>
                    <TableHead>Tarikh</TableHead>
                    <TableHead>Penerangan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.namaMurid}</TableCell>
                      <TableCell>{r.categoryNama}</TableCell>
                      <TableCell>{r.tahap}</TableCell>
                      <TableCell className="font-semibold text-red-600">
                        {r.mata}
                      </TableCell>
                      <TableCell>{formatDateMY(r.tarikh)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {r.penerangan || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-9"
                            disabled={busy === r.id}
                            onClick={() => approve(r)}
                          >
                            {busy === r.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Check className="size-4" />
                            )}
                            Lulus
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-red-600"
                            disabled={busy === r.id}
                            onClick={() => setCancelTarget(r)}
                          >
                            <X className="size-4" />
                            Batalkan
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Rekod</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="sebab">Sebab pembatalan</Label>
            <Input
              id="sebab"
              value={sebab}
              onChange={(e) => setSebab(e.target.value)}
              placeholder="Cth: bukan kes disiplin, salah rekod"
              className="h-10"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Tutup
            </Button>
            <Button
              variant="destructive"
              disabled={busy === cancelTarget?.id}
              onClick={() => cancelTarget && cancel(cancelTarget, sebab)}
            >
              {busy === cancelTarget?.id && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Sahkan Batalkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
