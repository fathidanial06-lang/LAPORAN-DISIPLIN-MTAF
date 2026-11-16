"use client";

import { useStore } from "@/lib/disiplin/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, User } from "lucide-react";

export function SearchResults() {
  const results = useStore((s) => s.searchResults);
  const setPublicView = useStore((s) => s.setPublicView);
  const setSelectedStudentId = useStore((s) => s.setSelectedStudentId);
  const query = useStore((s) => s.searchQuery);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-5">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPublicView("home")}
          className="h-10"
        >
          <ArrowLeft className="size-4" /> Kembali
        </Button>
        <h1 className="text-xl font-semibold">Hasil Carian</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        {results.length} murid ditemui untuk carian{" "}
        <span className="font-medium text-foreground">"{query}"</span>. Untuk
        keselamatan, pilih murid dan masukkan No. IC penuh untuk membuka
        laporan.
      </p>

      {results.length === 0 ? (
        <Card className="glass-card border-0">
          <CardContent className="p-8 text-center text-muted-foreground">
            Tiada murid ditemui. Sila semak ejaan nama atau No. IC dan cuba
            lagi.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {results.map((r) => (
            <li key={r.id}>
              <Card className="glass-card border-0">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary shrink-0">
                    <User className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight truncate">
                      {r.nama}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {r.kelas} · {r.icMasked || r.ic}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="h-10"
                    onClick={() => {
                      setSelectedStudentId(r.id);
                      setPublicView("verify");
                    }}
                  >
                    Pilih
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
