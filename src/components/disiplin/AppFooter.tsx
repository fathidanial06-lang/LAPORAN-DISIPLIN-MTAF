"use client";

import { useStore } from "@/lib/disiplin/store";
import { Button } from "@/components/ui/button";
import { Users, ShieldCheck } from "lucide-react";

export function AppFooter() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const goStaffLogin = useStore((s) => s.goStaffLogin);
  const goPublicHome = useStore((s) => s.goPublicHome);

  return (
    <footer className="mt-auto w-full">
      <div className="ornament-line h-px w-full" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 py-5 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            © 2026 Madrasah Tahfiz Al Furqan · Unit Hal Ehwal Murid
          </p>
          <p className="text-xs">
            Semua data adalah rekaan untuk prototaip.
          </p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Mod:
          </span>
          <Button
            size="sm"
            variant={mode === "public" ? "default" : "outline"}
            onClick={goPublicHome}
            className="h-9"
            aria-pressed={mode === "public"}
          >
            <Users className="size-4" />
            Portal Ibu Bapa
          </Button>
          <Button
            size="sm"
            variant={mode === "staff" ? "default" : "outline"}
            onClick={goStaffLogin}
            className="h-9"
            aria-pressed={mode === "staff"}
          >
            <ShieldCheck className="size-4" />
            Panel Staf
          </Button>
        </div>
      </div>
    </footer>
  );
}
