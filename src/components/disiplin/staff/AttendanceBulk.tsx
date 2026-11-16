"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/disiplin/store";
import { staffApi } from "@/lib/disiplin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { todayISO, formatDateMY, STATUS_LABEL_MY, type AttendanceStatus } from "@/lib/disiplin/domain";
import { CheckCheck, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const KELAS_OPTIONS = [
  "Tahfiz 1",
  "Tahfiz 2",
  "Tahfiz 3",
  "Tahfiz 4",
  "Tahfiz 5",
];
const STATUS_OPTIONS: AttendanceStatus[] = [
  "HADIR",
  "LEWAT",
  "SAKIT",
  "KEBENARAN",
  "TANPA_SEBAB",
  "PULANG_AWAL",
];

interface Row {
  studentId: string;
  nama: string;
  status: AttendanceStatus;
  catatan: string;
  checked: boolean;
}

export function AttendanceBulk() {
  const staffToken = useStore((s) => s.staffToken);
  const [tarikh, setTarikh] = useState(todayISO());
  const [kelas, setKelas] = useState<string>(KELAS_OPTIONS[0]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [kelas, staffToken]);

  async function load() {
    if (!staffToken) return;
    setLoading(true);
    try {
      const res = await staffApi.get<{ students: any[] }>(
        `/api/staff/students?kelas=${encodeURIComponent(kelas)}`,
        staffToken
      );
      const rs: Row[] = (res.students ?? []).map((s) => ({
        studentId: s.id,
        nama: s.nama,
        status: "HADIR",
        catatan: "",
        checked: true,
      }));
      setRows(rs);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }

  function markAllHadir() {
    setRows((prev) =>
      prev.map((r) => ({ ...r, status: "HADIR", checked: true }))
    );
  }

  async function save() {
    if (!staffToken) return;
    setSaving(true);
    try {
      const records = rows.map((r) => ({
        studentId: r.studentId,
        status: r.checked ? r.status : "HADIR",
        catatan: r.catatan || undefined,
      }));
      await staffApi.post(
        "/api/attendance/bulk",
        { tarikh, records },
        staffToken
      );
      toast.success("Kedatangan disimpan.");
    } catch (err: any) {
      toast.error(err?.error || "Gagal menyimpan kedatangan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Kedatangan Pukal</h2>

      <Card className="glass-card border-0">
        <CardContent className="p-5 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tarikh</Label>
              <Input
                type="date"
                value={tarikh}
                onChange={(e) => setTarikh(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kelas</Label>
              <Select value={kelas} onValueChange={setKelas}>
                <SelectTrigger className="h-10 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KELAS_OPTIONS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={markAllHadir} className="h-10">
              <CheckCheck className="size-4" /> Tanda Semua Hadir
            </Button>
            <p className="text-xs text-muted-foreground self-end ml-auto">
              {formatDateMY(tarikh)}
            </p>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">✓</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-8"
                      >
                        Tiada murid untuk kelas ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r, i) => (
                      <TableRow key={r.studentId}>
                        <TableCell>
                          <Checkbox
                            checked={r.checked}
                            onCheckedChange={(v) =>
                              updateRow(i, { checked: Boolean(v) })
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">{r.nama}</TableCell>
                        <TableCell>
                          <Select
                            value={r.status}
                            onValueChange={(v) =>
                              updateRow(i, { status: v as AttendanceStatus })
                            }
                          >
                            <SelectTrigger className="h-9 w-44">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {STATUS_LABEL_MY[s]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={r.catatan}
                            onChange={(e) =>
                              updateRow(i, { catatan: e.target.value })
                            }
                            className="h-9"
                            placeholder="—"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || loading} className="h-10">
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Simpan Kedatangan
        </Button>
      </div>
    </div>
  );
}
