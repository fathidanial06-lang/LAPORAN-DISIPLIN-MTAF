// Generate PostgreSQL INSERT statements from the existing SQLite dummy data.
// Output: /tmp/supabase_seed.sql — combined DDL + seed INSERTs for the Supabase SQL Editor.
import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "node:fs";

// Point Prisma at the local SQLite file (regardless of .env DATABASE_URL)
process.env.DATABASE_URL = "file:/home/z/my-project/db/custom.db";
const sqlite = new PrismaClient({ log: ["error"] });

function sqlStr(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") return String(v);
  if (v instanceof Date) {
    // PostgreSQL TIMESTAMP format: 'YYYY-MM-DD HH:MM:SS'
    const iso = v.toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
    return `'${iso}'`;
  }
  // string: escape single quotes
  return `'${String(v).replace(/'/g, "''")}'`;
}

function insert(table: string, cols: string[], rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return `-- (no rows in ${table})\n`;
  const colList = cols.map((c) => `"${c}"`).join(", ");
  const lines = rows.map((r) => {
    const vals = cols.map((c) => sqlStr(r[c]));
    return `  (${vals.join(", ")})`;
  });
  // bulk insert
  return `INSERT INTO "${table}" (${colList}) VALUES\n${lines.join(",\n")};\n`;
}

async function main() {
  const ddl = readFileSync("/tmp/ddl.sql", "utf8");
  const out: string[] = [];
  out.push("-- ============================================================");
  out.push("-- Laporan Disiplin Murid — Madrasah Tahfiz Al Furqan");
  out.push("-- Complete database setup for Supabase (PostgreSQL)");
  out.push("-- Run this in: Supabase Dashboard → SQL Editor → New Query");
  out.push("-- All data is rekaan (dummy).");
  out.push("-- ============================================================");
  out.push("");
  out.push("-- Drop existing tables if any (clean slate)");
  out.push('DROP TABLE IF EXISTS "AuditLog" CASCADE;');
  out.push('DROP TABLE IF EXISTS "MeritRecord" CASCADE;');
  out.push('DROP TABLE IF EXISTS "MeritCategory" CASCADE;');
  out.push('DROP TABLE IF EXISTS "CharacterAssessment" CASCADE;');
  out.push('DROP TABLE IF EXISTS "Attendance" CASCADE;');
  out.push('DROP TABLE IF EXISTS "Student" CASCADE;');
  out.push('DROP TABLE IF EXISTS "User" CASCADE;');
  out.push('DROP TABLE IF EXISTS "Config" CASCADE;');
  out.push("");
  out.push(ddl);
  out.push("");
  out.push("-- ============================================================");
  out.push("-- SEED DATA");
  out.push("-- ============================================================");
  out.push("");

  // Config
  const config = await sqlite.config.findFirst();
  if (config) {
    out.push(insert("Config",
      ["id","ambangKehadiran","ambangDisiplin","pengesahanIbuBapa","hariCuti","penggalAktif"],
      [config]));
  }
  out.push("");

  // Users
  const users = await sqlite.user.findMany();
  out.push(insert("User",
    ["id","nama","username","passwordHash","peranan","aktif","createdAt"],
    users));
  out.push("");

  // MeritCategory
  const cats = await sqlite.meritCategory.findMany();
  out.push(insert("MeritCategory",
    ["id","jenis","nama","tahap","mata","aktif"], cats));
  out.push("");

  // Students
  const students = await sqlite.student.findMany();
  out.push(insert("Student",
    ["id","ic","nama","jantina","kelas","tahun","asrama","penjaga","fotoUrl","aktif","createdAt","updatedAt"],
    students));
  out.push("");

  // Attendance
  const att = await sqlite.attendance.findMany();
  out.push("-- Attendance: " + att.length + " rows");
  // chunk in groups of 500 to keep the statement reasonable
  for (let i = 0; i < att.length; i += 500) {
    const chunk = att.slice(i, i + 500);
    out.push(insert("Attendance",
      ["id","studentId","tarikh","status","catatan","direkodOleh","createdAt"],
      chunk));
  }
  out.push("");

  // CharacterAssessment
  const char = await sqlite.characterAssessment.findMany();
  out.push(insert("CharacterAssessment",
    ["id","studentId","tempoh","akhlak","ibadah","kebersihan","tanggungjawab","sosial","catatan","status","direkodOleh","createdAt","updatedAt"],
    char));
  out.push("");

  // MeritRecord
  const merit = await sqlite.meritRecord.findMany();
  out.push("-- MeritRecord: " + merit.length + " rows");
  for (let i = 0; i < merit.length; i += 500) {
    const chunk = merit.slice(i, i + 500);
    out.push(insert("MeritRecord",
      ["id","studentId","categoryId","tarikh","mata","penerangan","status","tindakan","direkodOleh","diluluskanOleh","dibatalkanSebab","createdAt","updatedAt"],
      chunk));
  }
  out.push("");

  out.push("-- Done. Tables created and seeded.");
  out.push("");
  out.push("-- IMPORTANT: update your app's .env (or Supabase env vars) to use:");
  out.push("-- DATABASE_URL pointing to this Supabase database via the Connection Pooler.");

  const finalSql = out.join("\n");
  writeFileSync("/tmp/supabase_full.sql", finalSql);
  console.log("Wrote /tmp/supabase_full.sql — " + finalSql.length + " bytes, " + finalSql.split("\n").length + " lines");
  console.log("Summary: " + users.length + " users, " + cats.length + " categories, " +
    students.length + " students, " + att.length + " attendance, " +
    char.length + " assessments, " + merit.length + " merit records");
  await sqlite.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
