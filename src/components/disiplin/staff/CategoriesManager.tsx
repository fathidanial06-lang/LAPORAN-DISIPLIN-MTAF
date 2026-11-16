"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/disiplin/store";
import { staffApi } from "@/lib/disiplin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  jenis: "MERIT" | "DEMERIT";
  nama: string;
  tahap: string;
  mata: number;
  aktif: boolean;
}

const JENIS = ["MERIT", "DEMERIT"] as const;
const TAHAP = ["RINGAN", "SEDERHANA", "BERAT", "SANGAT_BERAT"];

export function CategoriesManager() {
  const staffToken = useStore((s) => s.staffToken);
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!staffToken) return;
    setLoading(true);
    try {
      const res = await staffApi.get<{ categories: Category[] }>(
        "/api/staff/categories",
        staffToken
      );
      setRows(res.categories ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [staffToken]);

  function openNew() {
    setEditing({
      id: "",
      jenis: "MERIT",
      nama: "",
      tahap: "RINGAN",
      mata: 1,
      aktif: true,
    });
    setOpen(true);
  }
  function openEdit(c: Category) {
    setEditing({ ...c });
    setOpen(true);
  }

  async function save() {
    if (!editing || !staffToken) return;
    setSaving(true);
    try {
      const body = {
        id: editing.id || undefined,
        jenis: editing.jenis,
        nama: editing.nama,
        tahap: editing.tahap,
        mata: Number(editing.mata),
        aktif: editing.aktif,
      };
      if (editing.id) {
        await staffApi.put(`/api/staff/categories/${editing.id}`, body, staffToken);
        toast.success("Kategori dikemas kini.");
      } else {
        await staffApi.post("/api/staff/categories", body, staffToken);
        toast.success("Kategori baharu ditambah.");
      }
      setOpen(false);
      setEditing(null);
      load();
    } catch (err: any) {
      toast.error(err?.error || "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold mr-auto">Kategori Merit / Demerit</h2>
        <Button onClick={openNew} className="h-10">
          <Plus className="size-4" /> Tambah Kategori
        </Button>
      </div>

      <Card className="glass-card border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Tahap</TableHead>
                    <TableHead>Mata</TableHead>
                    <TableHead>Aktif</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        Tiada kategori.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.id}</TableCell>
                        <TableCell>
                          <Badge
                            className="text-white"
                            style={{
                              backgroundColor:
                                c.jenis === "MERIT" ? "#16a34a" : "#dc2626",
                            }}
                          >
                            {c.jenis}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{c.nama}</TableCell>
                        <TableCell>{c.tahap}</TableCell>
                        <TableCell className="font-semibold">{c.mata}</TableCell>
                        <TableCell>{c.aktif ? "Ya" : "Tidak"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9"
                            onClick={() => openEdit(c)}
                            aria-label="Sunting kategori"
                          >
                            <Pencil className="size-4" />
                          </Button>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Sunting Kategori" : "Tambah Kategori"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="space-y-1">
                <Label className="text-xs">ID (cth: M05 / D07)</Label>
                <Input
                  value={editing.id}
                  onChange={(e) =>
                    setEditing({ ...editing, id: e.target.value })
                  }
                  className="h-10"
                  disabled={!!editing.id}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Jenis</Label>
                <Select
                  value={editing.jenis}
                  onValueChange={(v) =>
                    setEditing({ ...editing, jenis: v as any })
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JENIS.map((j) => (
                      <SelectItem key={j} value={j}>
                        {j}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nama</Label>
                <Input
                  value={editing.nama}
                  onChange={(e) =>
                    setEditing({ ...editing, nama: e.target.value })
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tahap</Label>
                <Select
                  value={editing.tahap}
                  onValueChange={(v) =>
                    setEditing({ ...editing, tahap: v })
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAHAP.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mata</Label>
                <Input
                  type="number"
                  value={editing.mata}
                  onChange={(e) =>
                    setEditing({ ...editing, mata: Number(e.target.value) as any })
                  }
                  className="h-10"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={save} disabled={saving} className="h-10">
              {saving && <Loader2 className="size-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
