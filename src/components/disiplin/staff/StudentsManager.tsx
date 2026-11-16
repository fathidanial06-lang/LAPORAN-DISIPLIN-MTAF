"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/disiplin/store";
import { staffApi } from "@/lib/disiplin/api";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TahapBadge } from "../shared/Shared";
import { UserPlus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TAHAP_LABEL_MY, type TahapDisiplin } from "@/lib/disiplin/domain";

const KELAS_OPTIONS = [
  "Tahfiz 1",
  "Tahfiz 2",
  "Tahfiz 3",
  "Tahfiz 4",
  "Tahfiz 5",
];

interface StudentRow {
  id: string;
  nama: string;
  ic: string;
  jantina: string;
  kelas: string;
  tahun: number;
  asrama: boolean;
  aktif: boolean;
  penjaga: string;
  mataBersih?: number;
  tahap?: TahapDisiplin;
}

export function StudentsManager() {
  const staffToken = useStore((s) => s.staffToken);
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [kelasFilter, setKelasFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [open, setOpen] = useState(false);

  async function load() {
    if (!staffToken) return;
    setLoading(true);
    try {
      const res = await staffApi.get<{ students: StudentRow[] }>(
        `/api/staff/students?kelas=${kelasFilter}&q=${encodeURIComponent(q)}`,
        staffToken
      );
      setRows(res.students ?? []);
    } catch (err: any) {
      toast.error(err?.error || "Gagal memuatkan senarai murid.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [kelasFilter, q, staffToken]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (kelasFilter !== "all" && r.kelas !== kelasFilter) return false;
        if (q) {
          const s = q.toLowerCase();
          if (
            !r.nama.toLowerCase().includes(s) &&
            !r.ic.includes(q.replace(/\D/g, "")) &&
            !r.id.toLowerCase().includes(s)
          )
            return false;
        }
        return true;
      }),
    [rows, kelasFilter, q]
  );

  function openNew() {
    setEditing({
      id: "",
      nama: "",
      ic: "",
      jantina: "L",
      kelas: KELAS_OPTIONS[0],
      tahun: new Date().getFullYear(),
      asrama: false,
      aktif: true,
      penjaga: JSON.stringify({ nama: "", hubungan: "", icAkhir4: "", telefon: "" }),
    });
    setOpen(true);
  }

  function openEdit(r: StudentRow) {
    setEditing({ ...r });
    setOpen(true);
  }

  async function save() {
    if (!editing || !staffToken) return;
    try {
      const penjagaObj = (() => {
        try {
          return JSON.parse(editing.penjaga || "{}");
        } catch {
          return {};
        }
      })();
      const body = {
        nama: editing.nama,
        ic: editing.ic,
        jantina: editing.jantina,
        kelas: editing.kelas,
        tahun: Number(editing.tahun),
        asrama: editing.asrama,
        penjaga: penjagaObj,
        aktif: editing.aktif,
      };
      if (editing.id) {
        await staffApi.put(`/api/staff/students/${editing.id}`, body, staffToken);
        toast.success("Maklumat murid dikemas kini.");
      } else {
        await staffApi.post("/api/staff/students", { id: editing.id || undefined, ...body }, staffToken);
        toast.success("Murid baharu ditambah.");
      }
      setOpen(false);
      setEditing(null);
      load();
    } catch (err: any) {
      toast.error(err?.error || "Gagal menyimpan.");
    }
  }

  async function deactivate(id: string) {
    if (!staffToken) return;
    try {
      await staffApi.delete(`/api/staff/students/${id}`, staffToken);
      toast.success("Murid ditandai tidak aktif.");
      load();
    } catch (err: any) {
      toast.error(err?.error || "Galat memadam.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold mr-auto">Pengurusan Murid</h2>
        <Button onClick={openNew} className="h-10">
          <UserPlus className="size-4" /> Tambah Murid
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Cari nama / IC / ID"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-10 sm:max-w-xs"
        />
        <Select value={kelasFilter} onValueChange={setKelasFilter}>
          <SelectTrigger className="h-10 w-40">
            <SelectValue placeholder="Semua Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {KELAS_OPTIONS.map((k) => (
              <SelectItem key={k} value={k}>
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="glass-card border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>IC</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Tahun</TableHead>
                    <TableHead>Asrama</TableHead>
                    <TableHead>Aktif</TableHead>
                    <TableHead>Mata Bersih</TableHead>
                    <TableHead>Tahap</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center text-muted-foreground py-8"
                      >
                        Tiada murid dijumpai.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.id}</TableCell>
                        <TableCell className="font-medium">{r.nama}</TableCell>
                        <TableCell className="font-mono text-xs">{r.ic}</TableCell>
                        <TableCell>{r.kelas}</TableCell>
                        <TableCell>{r.tahun}</TableCell>
                        <TableCell>{r.asrama ? "Y" : "N"}</TableCell>
                        <TableCell>{r.aktif ? "Y" : "N"}</TableCell>
                        <TableCell className="font-semibold">
                          {r.mataBersih ?? 0}
                        </TableCell>
                        <TableCell>
                          {r.tahap ? (
                            <TahapBadge tahap={r.tahap} />
                          ) : (
                            <Badge variant="secondary">—</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-9"
                              onClick={() => openEdit(r)}
                              aria-label="Sunting"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-9 text-red-600"
                                  aria-label="Nyahaktif"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Nyahaktifkan murid?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Murid akan ditandai tidak aktif. Rekod
                                    sejarah kekal tersimpan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deactivate(r.id)}
                                  >
                                    Sahkan
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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

      <StudentDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        setEditing={setEditing}
        onSave={save}
      />
    </div>
  );
}

function StudentDialog({
  open,
  onOpenChange,
  editing,
  setEditing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: StudentRow | null;
  setEditing: (s: StudentRow | null) => void;
  onSave: () => void;
}) {
  const [saving, setSaving] = useState(false);

  if (!editing) return null;

  const penjaga = (() => {
    try {
      return JSON.parse(editing.penjaga || "{}");
    } catch {
      return { nama: "", hubungan: "", icAkhir4: "", telefon: "" };
    }
  })();

  function update<K extends keyof StudentRow>(k: K, v: StudentRow[K]) {
    setEditing({ ...(editing as StudentRow), [k]: v });
  }
  function updatePenjaga(k: string, v: string) {
    const next = { ...penjaga, [k]: v };
    setEditing({ ...(editing as StudentRow), penjaga: JSON.stringify(next) });
  }

  async function handle() {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing.id ? "Sunting Murid" : "Tambah Murid"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="ID (auto jika kosong)" className="sm:col-span-2">
            <Input
              value={editing.id}
              onChange={(e) => update("id", e.target.value)}
              placeholder="Cth: S021"
              className="h-10"
              disabled={!!editing.id}
            />
          </Field>
          <Field label="Nama Penuh" className="sm:col-span-2">
            <Input
              value={editing.nama}
              onChange={(e) => update("nama", e.target.value)}
              className="h-10"
            />
          </Field>
          <Field label="No. IC (12 digit)">
            <Input
              value={editing.ic}
              onChange={(e) => update("ic", e.target.value.replace(/\D/g, "").slice(0, 12))}
              inputMode="numeric"
              className="h-10 font-mono"
            />
          </Field>
          <Field label="Jantina">
            <Select
              value={editing.jantina}
              onValueChange={(v) => update("jantina", v)}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Lelaki</SelectItem>
                <SelectItem value="P">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Kelas">
            <Select
              value={editing.kelas}
              onValueChange={(v) => update("kelas", v)}
            >
              <SelectTrigger className="h-10">
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
          </Field>
          <Field label="Tahun">
            <Input
              type="number"
              value={editing.tahun}
              onChange={(e) => update("tahun", Number(e.target.value) as any)}
              className="h-10"
            />
          </Field>
          <Field label="Berasrama" className="sm:col-span-2">
            <div className="flex items-center gap-2 h-10">
              <Switch
                checked={editing.asrama}
                onCheckedChange={(v) => update("asrama", v)}
              />
              <span className="text-sm">{editing.asrama ? "Ya" : "Tidak"}</span>
            </div>
          </Field>
          <div className="sm:col-span-2">
            <p className="text-sm font-medium mb-1">Penjaga</p>
          </div>
          <Field label="Nama Penjaga">
            <Input
              value={penjaga.nama || ""}
              onChange={(e) => updatePenjaga("nama", e.target.value)}
              className="h-10"
            />
          </Field>
          <Field label="Hubungan">
            <Input
              value={penjaga.hubungan || ""}
              onChange={(e) => updatePenjaga("hubungan", e.target.value)}
              className="h-10"
              placeholder="Cth: Bapa"
            />
          </Field>
          <Field label="IC Akhir 4">
            <Input
              value={penjaga.icAkhir4 || ""}
              onChange={(e) =>
                updatePenjaga(
                  "icAkhir4",
                  e.target.value.replace(/\D/g, "").slice(0, 4)
                )
              }
              className="h-10"
              inputMode="numeric"
              maxLength={4}
            />
          </Field>
          <Field label="Telefon">
            <Input
              value={penjaga.telefon || ""}
              onChange={(e) => updatePenjaga("telefon", e.target.value)}
              className="h-10"
              inputMode="tel"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handle} disabled={saving} className="h-10">
            {saving && <Loader2 className="size-4 animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
