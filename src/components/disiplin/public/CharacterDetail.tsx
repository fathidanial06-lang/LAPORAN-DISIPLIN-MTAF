"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

const AXES = [
  { key: "akhlak", label: "Akhlak" },
  { key: "ibadah", label: "Ibadah" },
  { key: "kebersihan", label: "Kebersihan" },
  { key: "tanggungjawab", label: "Tanggungjawab" },
  { key: "sosial", label: "Sosial" },
];

export function CharacterDetail({ sahsiah }: { sahsiah: any }) {
  const assessments: any[] = sahsiah?.assessments ?? [];
  const grade = sahsiah?.grade ?? null;

  const latest = useMemo(
    () => assessments[assessments.length - 1] ?? null,
    [assessments]
  );
  const prev = useMemo(
    () => (assessments.length >= 2 ? assessments[assessments.length - 2] : null),
    [assessments]
  );

  const radarData = useMemo(() => {
    if (!latest) return [];
    return AXES.map((a) => ({ axis: a.label, value: latest[a.key] ?? 0 }));
  }, [latest]);

  const compare = useMemo(() => {
    if (!latest || !prev) return null;
    const diff = (latest.skor ?? avgScore(latest)) - (prev.skor ?? avgScore(prev));
    if (diff > 0.05) return { dir: "up", text: "Peningkatan berbanding penilaian lepas." };
    if (diff < -0.05) return { dir: "down", text: "Sedikit kemerosotan. Perlu bimbingan." };
    return { dir: "stable", text: "Kekal stabil berbanding penilaian lepas." };
  }, [latest, prev]);

  if (!latest) {
    return (
      <Card className="glass-card border-0">
        <CardContent className="p-6 text-center text-muted-foreground">
          Penilaian sahsiah belum tersedia untuk tempoh ini.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="glass-card border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Radar Sahsiah</h3>
              {grade && (
                <Badge
                  className="text-white"
                  style={{ backgroundColor: gradeColor(grade.gred) }}
                >
                  Gred {grade.gred} · {grade.label}
                </Badge>
              )}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="rgba(0,0,0,0.1)" />
                <PolarAngleAxis dataKey="axis" fontSize={12} />
                <PolarRadiusAxis domain={[0, 5]} fontSize={10} angle={90} />
                <Radar
                  name="Skor"
                  dataKey="value"
                  stroke="#16a34a"
                  fill="#16a34a"
                  fillOpacity={0.45}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-5 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Penilaian Terkini</h3>
              <p className="text-sm text-muted-foreground">
                Tempoh: {latest.tempoh}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {AXES.map((a) => (
                <div
                  key={a.key}
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                >
                  <span>{a.label}</span>
                  <span className="font-semibold">{latest[a.key]} / 5</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Skor purata:</span>
              <span className="font-semibold">
                {grade?.skor ?? avgScore(latest)} / 5
              </span>
            </div>
            {compare && (
              <div className="flex items-center gap-2 text-sm">
                {compare.dir === "up" && (
                  <ArrowUp className="size-4 text-emerald-700" />
                )}
                {compare.dir === "down" && (
                  <ArrowDown className="size-4 text-red-600" />
                )}
                {compare.dir === "stable" && (
                  <Minus className="size-4 text-muted-foreground" />
                )}
                <span>{compare.text}</span>
              </div>
            )}
            {latest.catatan && (
              <div className="rounded-xl bg-muted/40 p-3 text-sm">
                <p className="text-xs text-muted-foreground mb-1">
                  Catatan guru:
                </p>
                <p className="text-foreground">{latest.catatan}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function avgScore(s: any): number {
  if (!s) return 0;
  const arr = [s.akhlak, s.ibadah, s.kebersihan, s.tanggungjawab, s.sosial];
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
}
function gradeColor(g: string): string {
  switch (g) {
    case "A":
      return "#16a34a";
    case "B":
      return "#65a30d";
    case "C":
      return "#eab308";
    case "D":
      return "#dc2626";
    default:
      return "#64748b";
  }
}
