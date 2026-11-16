"use client";

import { useState } from "react";
import Image from "next/image";
import { useStore } from "@/lib/disiplin/store";
import { staffApi } from "@/lib/disiplin/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowLeft, Loader2, LogIn, ChevronDown, KeyRound } from "lucide-react";
import { toast } from "sonner";

const DEMO = [
  { u: "faiz", p: "demo123", r: "Guru" },
  { u: "noraini", p: "demo123", r: "Guru" },
  { u: "hashim", p: "demo123", r: "HEM" },
  { u: "khadijah", p: "demo123", r: "HEM" },
  { u: "tarmizi", p: "admin123", r: "Pentadbir" },
];

export function StaffLogin() {
  const setStaffView = useStore((s) => s.setStaffView);
  const setStaffToken = useStore((s) => s.setStaffToken);
  const setStaffUser = useStore((s) => s.setStaffUser);
  const goPublicHome = useStore((s) => s.goPublicHome);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) return;
    setSubmitting(true);
    try {
      const res = await staffApi.post<{
        token: string;
        user: { id: string; nama: string; username: string; peranan: any };
      }>("/api/staff/login", { username, password });
      setStaffToken(res.token);
      setStaffUser(res.user);
      setStaffView("dashboard");
      toast.success(`Selamat datang, ${res.user.nama}.`);
    } catch (err: any) {
      toast.error(err?.error || "Log masuk gagal. Semak nama pengguna dan kata laluan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8 space-y-5">
      <Button variant="ghost" size="sm" onClick={goPublicHome} className="h-10">
        <ArrowLeft className="size-4" /> Kembali ke portal
      </Button>

      <Card className="glass-card border-0">
        <CardContent className="p-6 space-y-5">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <span className="grid size-16 place-items-center rounded-full bg-white shadow-md ring-1 ring-primary/20 overflow-hidden">
                <Image
                  src="/logo-mtaf.png"
                  alt="Logo Madrasah Tahfiz Al Furqan"
                  width={58}
                  height={58}
                  className="object-contain"
                />
              </span>
            </div>
            <h1 className="text-2xl font-bold">Log Masuk Staf</h1>
            <p className="text-sm text-muted-foreground">
              Panel HEM, Guru dan Pentadbir.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Nama Pengguna</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 text-base"
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Kata Laluan</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 text-base"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={submitting}>
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogIn className="size-4" />
              )}
              Log Masuk
            </Button>
          </form>

          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full h-9 text-xs">
                <KeyRound className="size-3.5" /> Akaun demo
                <ChevronDown
                  className={`size-3.5 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <ul className="text-xs space-y-1 text-muted-foreground">
                {DEMO.map((d) => (
                  <li
                    key={d.u}
                    className="flex items-center justify-between rounded-md px-2 py-1 bg-muted/40"
                  >
                    <span>
                      <span className="font-mono">{d.u}</span> /{" "}
                      <span className="font-mono">{d.p}</span>
                    </span>
                    <span className="text-foreground font-medium">{d.r}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </main>
  );
}
