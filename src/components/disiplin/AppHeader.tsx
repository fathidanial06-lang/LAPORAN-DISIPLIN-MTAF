"use client";

import { Moon, BookOpen, ShieldCheck, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/disiplin/store";

export function AppHeader() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const goStaffLogin = useStore((s) => s.goStaffLogin);
  const goPublicHome = useStore((s) => s.goPublicHome);

  return (
    <header className="glass-strong sticky top-0 z-40 w-full">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <button
          onClick={goPublicHome}
          className="flex items-center gap-3 text-left"
          aria-label="Laman utama portal"
        >
          <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Moon className="size-5" />
          </span>
          <span className="hidden sm:flex flex-col leading-tight">
            <span className="font-semibold text-base">
              Madrasah Tahfiz Al Furqan
            </span>
            <span className="text-xs text-muted-foreground">
              Unit Hal Ehwal Murid · Laporan Disiplin
            </span>
          </span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          {mode === "staff" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={goPublicHome}
              className="h-10"
            >
              <BookOpen className="size-4" />
              <span className="hidden sm:inline">Portal Ibu Bapa</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={goStaffLogin}
              className="h-10"
            >
              <LogIn className="size-4" />
              <span className="hidden sm:inline">Log Masuk Staf</span>
              <span className="sm:hidden">Staf</span>
            </Button>
          )}
        </div>
      </div>
      <div className="ornament-line h-px w-full" aria-hidden="true" />
    </header>
  );
}

export function HeaderLogoShield() {
  return <ShieldCheck className="size-4" />;
}
