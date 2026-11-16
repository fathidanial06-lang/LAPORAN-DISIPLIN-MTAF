"use client";

import { useState } from "react";
import { useStore } from "@/lib/disiplin/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FilePlus,
  CheckCircle2,
  Tags,
  Settings,
  History,
  LogOut,
  Menu,
} from "lucide-react";
import type { StaffView } from "@/lib/disiplin/store";
import type { StaffUser } from "@/lib/disiplin/store";

interface NavItem {
  id: StaffView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: StaffUser["peranan"][];
}

const NAV: NavItem[] = [
  { id: "dashboard", label: "Papan Pemuka", icon: LayoutDashboard },
  { id: "students", label: "Murid", icon: Users },
  { id: "kedatangan", label: "Kedatangan (pukal)", icon: CalendarCheck },
  { id: "rekod", label: "Rekod Merit/Demerit", icon: FilePlus },
  { id: "kelulusan", label: "Kelulusan", icon: CheckCircle2, roles: ["HEM", "PENTADBIR"] },
  { id: "kategori", label: "Kategori", icon: Tags },
  { id: "tetapan", label: "Tetapan", icon: Settings, roles: ["PENTADBIR"] },
  { id: "audit", label: "Log Audit", icon: History },
];

const PERANAN_LABEL: Record<StaffUser["peranan"], string> = {
  GURU: "Guru",
  HEM: "HEM",
  PENTADBIR: "Pentadbir",
};

export function StaffShell({ children }: { children: React.ReactNode }) {
  const staffUser = useStore((s) => s.staffUser);
  const staffView = useStore((s) => s.staffView);
  const setStaffView = useStore((s) => s.setStaffView);
  const logoutStaff = useStore((s) => s.logoutStaff);
  const goPublicHome = useStore((s) => s.goPublicHome);
  const [open, setOpen] = useState(false);

  const items = NAV.filter(
    (n) => !n.roles || (staffUser && n.roles.includes(staffUser.peranan))
  );

  const Sidebar = (
    <nav aria-label="Navigasi staf" className="space-y-1">
      {items.map((it) => {
        const Icon = it.icon;
        const active = staffView === it.id;
        return (
          <button
            key={it.id}
            onClick={() => {
              setStaffView(it.id);
              setOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors min-h-11 ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted text-foreground"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{it.label}</span>
          </button>
        );
      })}
      <div className="my-2 ornament-line h-px" />
      <button
        onClick={() => {
          logoutStaff();
          goPublicHome();
        }}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted text-foreground min-h-11"
      >
        <LogOut className="size-4 shrink-0" /> Log Keluar
      </button>
    </nav>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-5">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 lg:hidden">
              <Menu className="size-4" /> Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-left">Panel Staf</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{Sidebar}</div>
          </SheetContent>
        </Sheet>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Panel Staf
          </p>
          <h1 className="text-lg font-semibold truncate">
            {staffUser?.nama ?? "Staf"}
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {staffUser && (
            <Badge className="text-white bg-primary">
              {PERANAN_LABEL[staffUser.peranan]}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <aside className="hidden lg:block sticky top-20 self-start">
          {Sidebar}
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
