"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/disiplin/store";
import { staffApi } from "@/lib/disiplin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, ChevronsUpDown, Loader2, Save } from "lucide-react";
import { todayISO, formatDateMY } from "@/lib/disiplin/domain";
import { toast } from "sonner";

interface Category {
  id: string;
  jenis: "MERIT" | "DEMERIT";
  nama: string;
  tahap: string;
  mata: number;
  aktif: boolean;
}

interface StudentRow {
  id: string;
  nama: string;
  kelas: string;
  ic: string;
}

export function RecordMerit() {
  const staffToken = useStore((s) => s.staffToken);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentOpen, setStudentOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [studentId, setStudentId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tarikh, setTarikh] = useState(todayISO());
  const [penerangan, setPenerangan] = useState("");
  const [mata, setMata] = useState<string>("");

  async function load() {
    if (!staffToken) return;
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        staffApi.get<{ students: StudentRow[] }>(
          "/api/staff/students",
          staffToken
        ),
        staffApi.get<{ categories: Category[] }>(
          "/api/staff/categories",
          staffToken
        ),
      ]);
      setStudents(sRes.students ?? []);
      setCats(cRes.categories ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [staffToken]);

  const selectedStudent = students.find((s) => s.id === studentId);
  const selectedCat = cats.find((c) => c.id === categoryId);
  const isBerat =
    selectedCat?.jenis === "DEMERIT" &&
    (selectedCat?.tahap === "BERAT" || selectedCat?.tahap === "SANGAT_BERAT");

  const groupedCats = useMemo(() => {
    const merit = cats.filter((c) => c.jenis === "MERIT");
    const demerit = cats.filter((c) => c.jenis === "DEMERIT");
    return { merit, demerit };
  }, [cats]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId || !categoryId || !tarikh) return;
    setSaving(true);
    try {
      const res = await staffApi.post<{
        record: { id: string; status: string };
      }>(
        "/api/merits",
        {
          studentId,
          categoryId,
          tarikh,
          penerangan: penerangan || undefined,
          mata: mata ? Number(mata) : undefined,
        },
        staffToken
      );
      toast.success("Rekod disimpan.");
      if (res?.record?.status === "MENUNGGU") {
        toast.info("Rekod demerit berat menunggu kelulusan HEM.");
      }
      setPenerangan("");
      setMata("");
    } catch (err: any) {
      toast.error(err?.error || "Gagal menyimpan rekod.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 rounded w-40" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Rekod Merit / Demerit</h2>
        <p className="text-sm text-muted-foreground">
          Tambah rekod baru untuk seorang murid.
        </p>
      </div>

      <Card className="glass-card border-0">
        <CardContent className="p-5 space-y-4">
          <form onSubmit={submit} className="space-y-4">
            {/* Murid combobox */}
            <div className="space-y-1.5">
              <Label>Murid</Label>
              <Popover open={studentOpen} onOpenChange={setStudentOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between h-11 font-normal"
                  >
                    {selectedStudent
                      ? `${selectedStudent.nama} · ${selectedStudent.kelas}`
                      : "Pilih murid..."}
                    <ChevronsUpDown className="size-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari nama / IC / ID..." />
                    <CommandList>
                      <CommandEmpty>Tiada murid.</CommandEmpty>
                      <CommandGroup>
                        {students.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={`${s.nama} ${s.id} ${s.ic} ${s.kelas}`}
                            onSelect={() => {
                              setStudentId(s.id);
                              setStudentOpen(false);
                            }}
                          >
                            <Check
                              className={`size-4 ${
                                s.id === studentId ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <span className="font-medium">{s.nama}</span>
                            <span className="text-muted-foreground">
                              · {s.kelas}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup label="Merit">
                      {groupedCats.merit.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nama} (+{c.mata})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup label="Demerit">
                      {groupedCats.demerit.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nama} ({c.mata}) · {c.tahap}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tarikh</Label>
                <Input
                  type="date"
                  value={tarikh}
                  onChange={(e) => setTarikh(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            {selectedCat && (
              <div className="rounded-xl bg-muted/40 p-3 text-sm flex flex-wrap items-center gap-2">
                <Badge
                  className="text-white"
                  style={{
                    backgroundColor:
                      selectedCat.jenis === "MERIT" ? "#16a34a" : "#dc2626",
                  }}
                >
                  {selectedCat.jenis}
                </Badge>
                <span>
                  {selectedCat.nama} · {selectedCat.mata} mata · tahap{" "}
                  {selectedCat.tahap}
                </span>
                {isBerat && (
                  <span className="text-amber-400 text-xs">
                    Menunggu kelulusan HEM.
                  </span>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Penerangan (pilihan)</Label>
              <Textarea
                value={penerangan}
                onChange={(e) => setPenerangan(e.target.value)}
                placeholder="Butiran ringkas tentang kejadian atau ganjaran."
                className="min-h-20"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Mata (pilihan, lalai mengikut kategori)</Label>
              <Input
                type="number"
                value={mata}
                onChange={(e) => setMata(e.target.value)}
                className="h-11"
                placeholder={selectedCat ? String(selectedCat.mata) : "0"}
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full h-11">
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Simpan Rekod
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Tarikh hari ini: {formatDateMY(todayISO())}
      </p>
    </div>
  );
}
