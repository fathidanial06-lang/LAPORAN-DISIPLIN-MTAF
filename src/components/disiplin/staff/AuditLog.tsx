"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/disiplin/store";
import { staffApi } from "@/lib/disiplin/api";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AuditRow {
  id: string;
  userName: string;
  tindakan: string;
  entiti: string;
  entitiId?: string;
  nilaiLama?: string;
  nilaiBaru?: string;
  createdAt: string;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("ms-MY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AuditLog() {
  const staffToken = useStore((s) => s.staffToken);
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staffToken) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await staffApi.get<{ logs: AuditRow[] }>(
          `/api/staff/audit?limit=100`,
          staffToken
        );
        if (!cancelled) setRows(r.logs ?? []);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [staffToken]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Log Audit</h2>
        <p className="text-sm text-muted-foreground">
          100 log tindakan terkini oleh staf.
        </p>
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
            <ScrollArea className="h-96">
              <Table>
                <TableHeader className="sticky top-0 bg-card/95 backdrop-blur">
                  <TableRow>
                    <TableHead>Masa</TableHead>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Tindakan</TableHead>
                    <TableHead>Entiti</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Nilai Lama → Baru</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        Tiada log.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {formatTime(r.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium">{r.userName}</TableCell>
                        <TableCell>{r.tindakan}</TableCell>
                        <TableCell>{r.entiti}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {r.entitiId || "—"}
                        </TableCell>
                        <TableCell className="max-w-sm">
                          {r.nilaiLama || r.nilaiBaru ? (
                            <span className="text-xs">
                              {r.nilaiLama ? `${r.nilaiLama} → ` : ""}
                              {r.nilaiBaru || "—"}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
