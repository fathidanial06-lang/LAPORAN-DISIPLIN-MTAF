// Seed script for "Laporan Disiplin Murid" - Madrasah Tahfiz Al Furqan
// Generates dummy (rekaan) data per PRD Lampiran B & 13.2.
// Run: bun run prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ---------- helpers ----------
function pad(n: number, len = 3) {
  return String(n).padStart(len, "0");
}

// Deterministic pseudo-random so seed is stable across runs
let seed = 20261116;
function rng() {
  // mulberry32
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function intBetween(min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// ---------- name pools ----------
const namaLelaki = [
  "AHMAD DANIAL", "MUHAMMAD IRFAN", "AMIRUL HAKIM", "MUHAMMAD ARIFF",
  "DANIAL HAZIQ", "AHMAD FARIS", "IQBAL HAIKAL", "NUR ISLAM",
  "AHMAD ZIKRI", "HAFIZ ASYRAF", "MUHAMMAD ZAHIR", "AHMAD LUQMAN",
  "AIMAN HAKIMI", "AHMAD NAUFAL", "SAIFUL ISLAM", "MUHAMMAD HAZIQ",
  "AHMAD HAFIZ", "ZULKIFLI AMAN", "FAIZ AMAN", "AHMAD AKMAL",
  "NABIL HAKIM", "AHMAD FIKRI", "ZAHID FARID", "AHMAD SALIM",
  "KHAIRUL ANUAR", "AHMAD SYAFIQ", "RIDZUAN HAFIZ", "AHMAD FARHAN",
  "SYAHMI AMAN", "AHMAD IQBAL",
];
const namaPerempuan = [
  "NUR AISYAH", "SITI KHADIJAH", "NUR FARAH", "AISHAH ZAHRA",
  "NUR HIDAYAH", "FATIN NABIHAH", "NUR SYUHADA", "SITI AISYAH",
  "NABILAH HUSNA", "NUR ZAHRA", "SITI AMINAH", "NUR HIDAYAH",
  "FATIMAH ZAHRA", "NUR ATIKAH", "SITI KHADIJAH", "NURUL HUSNA",
  "AISYAH NADHIRAH", "NUR FARAHIN", "SITI NURAIN", "NUR AFIQAH",
  "ZAHRA AMAN", "NUR HANISAH", "SITI MARIAM", "NUR SAFIYYAH",
  "FATIN FARHANA", "NUR AZLINA", "SITI HAJAR", "NUR WAHIDAH",
  "AMINAH SALMA", "NUR BALQIS",
];
const namaBapa = [
  "HAFIZ", "ZULKIFLI", "ZAKARIA", "RAZAK", "KAMAL", "ROSLI",
  "ABDULLAH", "IBRAHIM", "YUSOF", "ISMAIL", "RAHMAN", "SALLEH",
  "AZHAR", "FAUZI", "IDRIS", "RAMLI", "SULONG", "AWANG",
  "ZAINAL", "MANSOR", "SULAIMAN", "HASSAN", "HUSSEIN", "ONG",
];

// ---------- IC generator (rekaan YYMMDD-PB-XXXX) ----------
function generateIC(jantina: "L" | "P"): string {
  // birth years 2010..2015 (ages ~11-16)
  const year = intBetween(10, 15);
  const month = intBetween(1, 12);
  const day = intBetween(1, 28);
  const pb = jantina === "L" ? intBetween(1, 10) : intBetween(11, 14);
  const last4 = intBetween(0, 9999);
  return (
    `${pad(year, 2)}${pad(month, 2)}${pad(day, 2)}` +
    `${pad(pb, 2)}${pad(last4, 4)}`
  );
}

// ---------- classes ----------
const kelasList = ["Tahfiz 1", "Tahfiz 2", "Tahfiz 3", "Tahfiz 4", "Tahfiz 5"];

// ---------- merit/demerit categories (PRD 9.1 & 9.2) ----------
const meritCategories = [
  { id: "M01", jenis: "MERIT", nama: "Membantu rakan/guru", tahap: "RINGAN", mata: 3 },
  { id: "M02", jenis: "MERIT", nama: "Jujur, memulangkan barang hilang", tahap: "RINGAN", mata: 4 },
  { id: "M03", jenis: "MERIT", nama: "Imam solat berjemaah", tahap: "SEDERHANA", mata: 4 },
  { id: "M04", jenis: "MERIT", nama: "Solat berjemaah konsisten sebulan", tahap: "SEDERHANA", mata: 5 },
  { id: "M05", jenis: "MERIT", nama: "Menamatkan target hafazan lebih awal", tahap: "BERAT", mata: 8 },
  { id: "M06", jenis: "MERIT", nama: "Hafazan cemerlang", tahap: "BERAT", mata: 10 },
  { id: "M07", jenis: "MERIT", nama: "Asrama/bilik paling bersih mingguan", tahap: "RINGAN", mata: 2 },
  { id: "M08", jenis: "MERIT", nama: "Ketua kelas cemerlang", tahap: "BERAT", mata: 6 },
  { id: "M09", jenis: "MERIT", nama: "Wakil madrasah / kepimpinan", tahap: "BERAT", mata: 10 },
];

const demeritCategories = [
  { id: "D01", jenis: "DEMERIT", nama: "Lewat ke kelas", tahap: "RINGAN", mata: -1 },
  { id: "D02", jenis: "DEMERIT", nama: "Pakaian tidak kemas", tahap: "RINGAN", mata: -2 },
  { id: "D03", jenis: "DEMERIT", nama: "Tidak membawa buku", tahap: "RINGAN", mata: -3 },
  { id: "D04", jenis: "DEMERIT", nama: "Tidak hadir tanpa sebab", tahap: "SEDERHANA", mata: -4 },
  { id: "D05", jenis: "DEMERIT", nama: "Meninggalkan solat berjemaah tanpa alasan", tahap: "SEDERHANA", mata: -6 },
  { id: "D06", jenis: "DEMERIT", nama: "Bercakap kasar", tahap: "SEDERHANA", mata: -7 },
  { id: "D07", jenis: "DEMERIT", nama: "Bergaduh", tahap: "BERAT", mata: -10 },
  { id: "D08", jenis: "DEMERIT", nama: "Keluar kawasan tanpa kebenaran", tahap: "BERAT", mata: -12 },
  { id: "D09", jenis: "DEMERIT", nama: "Merosakkan harta madrasah", tahap: "BERAT", mata: -15 },
  { id: "D10", jenis: "DEMERIT", nama: "Pelanggaran serius dirujuk Mudir", tahap: "SANGAT_BERAT", mata: -20 },
];

// ---------- attendance generator ----------
type Status = "HADIR" | "LEWAT" | "SAKIT" | "KEBENARAN" | "TANPA_SEBAB" | "PULANG_AWAL";
function generateAttendanceForStudent(studentId: string, profile: "EXCELLENT" | "GOOD" | "ATTENTION" | "CRITICAL") {
  const records: { tarikh: string; status: Status; catatan?: string }[] = [];
  // 3 months ending today-ish (use a fixed window so seed is stable)
  const end = new Date("2026-11-16");
  const start = new Date("2026-08-16");
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay(); // 0 sun ... 6 sat
    if (dow === 0 || dow === 6) continue; // weekend
    // skip a few public holidays / cuti
    const iso = d.toISOString().slice(0, 10);
    if (["2026-08-31", "2026-09-16", "2026-10-12", "2026-11-11"].includes(iso)) continue;
    let status: Status = "HADIR";
    const r = rng();
    if (profile === "EXCELLENT") {
      if (r < 0.02) status = "LEWAT";
      else if (r < 0.03) status = "SAKIT";
    } else if (profile === "GOOD") {
      if (r < 0.04) status = "LEWAT";
      else if (r < 0.07) status = "SAKIT";
      else if (r < 0.08) status = "KEBENARAN";
    } else if (profile === "ATTENTION") {
      if (r < 0.08) status = "LEWAT";
      else if (r < 0.13) status = "SAKIT";
      else if (r < 0.18) status = "TANPA_SEBAB";
      else if (r < 0.20) status = "KEBENARAN";
    } else {
      // CRITICAL
      if (r < 0.10) status = "LEWAT";
      else if (r < 0.25) status = "TANPA_SEBAB";
      else if (r < 0.32) status = "SAKIT";
      else if (r < 0.36) status = "PULANG_AWAL";
    }
    const rec: { tarikh: string; status: Status; catatan?: string } = { tarikh: iso, status };
    if (status === "SAKIT") rec.catatan = "Sakit, ada MC";
    if (status === "KEBENARAN") rec.catatan = "Dibenarkan oleh warden";
    if (status === "TANPA_SEBAB") rec.catatan = "Tiada maklumat diterima";
    if (status === "PULANG_AWAL") rec.catatan = "Pulang awal atas urusan keluarga";
    records.push(rec);
  }
  return records.map((r) => ({ studentId, ...r, direkodOleh: "U01" }));
}

// ---------- main ----------
async function main() {
  console.log("Resetting database...");
  await db.auditLog.deleteMany();
  await db.meritRecord.deleteMany();
  await db.meritCategory.deleteMany();
  await db.characterAssessment.deleteMany();
  await db.attendance.deleteMany();
  await db.student.deleteMany();
  await db.user.deleteMany();
  await db.config.deleteMany();

  // ---- Config ----
  const ambangKehadiran = {
    CEMERLANG: 95,
    BAIK: 90,
    PERLU_PERHATIAN: 80,
  };
  const ambangDisiplin = {
    CEMERLANG: { max: 5 },
    BAIK: { max: 15 },
    PERLU_PERHATIAN: { max: 30 },
    AMARAN_SERIUS: { max: 50 },
    KRITIKAL: { min: 51 },
  };
  await db.config.create({
    data: {
      id: "singleton",
      ambangKehadiran: JSON.stringify(ambangKehadiran),
      ambangDisiplin: JSON.stringify(ambangDisiplin),
      pengesahanIbuBapa: false,
      hariCuti: JSON.stringify(["2026-08-31", "2026-09-16", "2026-10-12", "2026-11-11"]),
      penggalAktif: "Penggal 1 2026",
    },
  });

  // ---- Users ----
  const users = [
    { id: "U01", nama: "Ustaz Faiz bin Rahman", username: "faiz", passwordHash: "demo123", peranan: "GURU" },
    { id: "U02", nama: "Ustazah Noraini binti Sulaiman", username: "noraini", passwordHash: "demo123", peranan: "GURU" },
    { id: "U03", nama: "Ustaz Hashim bin Yusof (HEM)", username: "hashim", passwordHash: "demo123", peranan: "HEM" },
    { id: "U04", nama: "Mudir Ahmad Tarmizi", username: "tarmizi", passwordHash: "admin123", peranan: "PENTADBIR" },
    { id: "U05", nama: "Penyelia HEM Khadijah", username: "khadijah", passwordHash: "demo123", peranan: "HEM" },
  ];
  for (const u of users) await db.user.create({ data: u });

  // ---- Merit categories ----
  for (const c of [...meritCategories, ...demeritCategories]) {
    await db.meritCategory.create({ data: c });
  }

  // ---- Students (60 across 5 classes) ----
  // Define 6 known scenarios per PRD Lampiran B
  const known: {
    id: string; nama: string; ic: string; kelas: string;
    jantina: "L" | "P"; tahun: number; asrama: boolean;
    penjaga: object; scenario: string;
  }[] = [
    {
      id: "S001", nama: "AHMAD DANIAL BIN HAFIZ", ic: "120514100123",
      kelas: "Tahfiz 1", jantina: "L", tahun: 4, asrama: true,
      penjaga: { nama: "HAFIZ BIN ABDULLAH", hubungan: "Bapa", icAkhir4: "4521", telefon: "012-3456789" },
      scenario: "EXCELLENT",
    },
    {
      id: "S002", nama: "MUHAMMAD IRFAN BIN ZULKIFLI", ic: "110302140457",
      kelas: "Tahfiz 2", jantina: "L", tahun: 3, asrama: false,
      penjaga: { nama: "ZULKIFLI BIN OMAR", hubungan: "Bapa", icAkhir4: "4057", telefon: "012-9876543" },
      scenario: "GOOD",
    },
    {
      id: "S003", nama: "MUHAMMAD IRFAN BIN ZAKARIA", ic: "110827100789",
      kelas: "Tahfiz 2", jantina: "L", tahun: 3, asrama: true,
      penjaga: { nama: "ZAKARIA BIN ISA", hubungan: "Bapa", icAkhir4: "0789", telefon: "016-2213344" },
      scenario: "GOOD",
    },
    {
      id: "S004", nama: "AMIRUL HAKIM BIN RAZAK", ic: "100119010235",
      kelas: "Tahfiz 3", jantina: "L", tahun: 2, asrama: true,
      penjaga: { nama: "RAZAK BIN SALLEH", hubungan: "Bapa", icAkhir4: "0235", telefon: "019-1122334" },
      scenario: "CRITICAL",
    },
    {
      id: "S005", nama: "NUR AISYAH BINTI KAMAL", ic: "130711120340",
      kelas: "Tahfiz 4", jantina: "P", tahun: 1, asrama: true,
      penjaga: { nama: "KAMAL BIN ISHAK", hubungan: "Bapa", icAkhir4: "0340", telefon: "013-4455667" },
      scenario: "GOOD",
    },
    {
      id: "S006", nama: "SITI KHADIJAH BINTI ROSLI", ic: "120905080662",
      kelas: "Tahfiz 5", jantina: "P", tahun: 5, asrama: false,
      penjaga: { nama: "ROSLI BIN DAUD", hubungan: "Bapa", icAkhir4: "0662", telefon: "011-1234567" },
      scenario: "EXCELLENT",
    },
  ];

  const students: typeof known = [];
  // Insert known first
  for (const k of known) students.push(k);

  // Generate remaining 54 students with realistic distribution
  let counter = 7;
  const usedICs = new Set(known.map((k) => k.ic));
  const usedNames = new Set(known.map((k) => k.nama));

  for (const kelas of kelasList) {
    // already some known in some classes; figure out remaining count per class
    const existingInClass = students.filter((s) => s.kelas === kelas).length;
    const remaining = 12 - existingInClass;
    for (let i = 0; i < remaining; i++) {
      const jantina: "L" | "P" = rng() < 0.6 ? "L" : "P";
      let nama: string;
      if (jantina === "L") {
        let first = pick(namaLelaki);
        let bapa = pick(namaBapa);
        nama = `${first} BIN ${bapa}`;
        // ensure uniqueness-ish
        let tries = 0;
        while (usedNames.has(nama) && tries < 8) {
          first = pick(namaLelaki);
          bapa = pick(namaBapa);
          nama = `${first} BIN ${bapa}`;
          tries++;
        }
      } else {
        let first = pick(namaPerempuan);
        let bapa = pick(namaBapa);
        nama = `${first} BINTI ${bapa}`;
        let tries = 0;
        while (usedNames.has(nama) && tries < 8) {
          first = pick(namaPerempuan);
          bapa = pick(namaBapa);
          nama = `${first} BINTI ${bapa}`;
          tries++;
        }
      }
      usedNames.add(nama);

      let ic = generateIC(jantina);
      while (usedICs.has(ic)) ic = generateIC(jantina);
      usedICs.add(ic);

      const tahun = intBetween(1, 6);
      const asrama = rng() < 0.6;
      const penjaga = {
        nama: `${pick(namaBapa)} BIN ABDULLAH`,
        hubungan: "Bapa",
        icAkhir4: pad(intBetween(0, 9999), 4),
        telefon: `01${intBetween(2, 9)}-${intBetween(1000000, 9999999)}`,
      };
      // pick scenario weighted
      const r = rng();
      const scenario =
        r < 0.45 ? "GOOD" :
        r < 0.75 ? "EXCELLENT" :
        r < 0.9 ? "ATTENTION" : "CRITICAL";

      students.push({
        id: `S${pad(counter)}`,
        nama,
        ic,
        kelas,
        jantina,
        tahun,
        asrama,
        penjaga,
        scenario,
      });
      counter++;
    }
  }

  // Insert students
  for (const s of students) {
    await db.student.create({
      data: {
        id: s.id,
        ic: s.ic,
        nama: s.nama,
        jantina: s.jantina,
        kelas: s.kelas,
        tahun: s.tahun,
        asrama: s.asrama,
        penjaga: JSON.stringify(s.penjaga),
        aktif: true,
      },
    });
  }
  console.log(`Inserted ${students.length} students`);

  // ---- Attendance (3 months) ----
  let attCount = 0;
  for (const s of students) {
    const recs = generateAttendanceForStudent(s.id, s.scenario as "EXCELLENT" | "GOOD" | "ATTENTION" | "CRITICAL");
    for (const r of recs) {
      await db.attendance.create({ data: r });
      attCount++;
    }
  }
  console.log(`Inserted ${attCount} attendance records`);

  // ---- Character assessments (2 per student) ----
  let caCount = 0;
  for (const s of students) {
    const profiles = s.scenario as "EXCELLENT" | "GOOD" | "ATTENTION" | "CRITICAL";
    const base =
      profiles === "EXCELLENT" ? 5 :
      profiles === "GOOD" ? 4 :
      profiles === "ATTENTION" ? 3 : 2;
    for (const tempoh of ["2026-08", "2026-10"]) {
      const jitter = () => Math.max(1, Math.min(5, base + intBetween(-1, 1)));
      const catatan =
        profiles === "EXCELLENT" ? "Akhlak baik, teruskan usaha cemerlang." :
        profiles === "GOOD" ? "Akhlak baik, perlu tingkatkan disiplin masa." :
        profiles === "ATTENTION" ? "Perlu bimbingan dalam aspek tanggungjawab." :
        "Memerlukan perhatian dan bimbingan berterusan.";
      await db.characterAssessment.create({
        data: {
          studentId: s.id,
          tempoh,
          akhlak: jitter(),
          ibadah: jitter(),
          kebersihan: jitter(),
          tanggungjawab: jitter(),
          sosial: jitter(),
          catatan,
          status: "DISAHKAN",
          direkodOleh: "U01",
        },
      });
      caCount++;
    }
  }
  console.log(`Inserted ${caCount} character assessments`);

  // ---- Merit records (~100) ----
  const allCats = [...meritCategories, ...demeritCategories];
  let mrCount = 0;
  const mrTotal = 120;
  for (let i = 0; i < mrTotal; i++) {
    const s = pick(students);
    // weight selection toward student's scenario for realistic totals
    let cat;
    const r = rng();
    if (s.scenario === "EXCELLENT") {
      cat = rng() < 0.7 ? pick(meritCategories) : pick(demeritCategories);
    } else if (s.scenario === "CRITICAL") {
      cat = rng() < 0.8 ? pick(demeritCategories) : pick(meritCategories);
    } else if (s.scenario === "ATTENTION") {
      cat = rng() < 0.65 ? pick(demeritCategories) : pick(meritCategories);
    } else {
      cat = rng() < 0.55 ? pick(demeritCategories) : pick(meritCategories);
    }
    // date within last 3 months
    const d = new Date("2026-08-16");
    d.setDate(d.getDate() + intBetween(0, 90));
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) {
      i--; continue;
    }
    const isBerat = cat.tahap === "BERAT" || cat.tahap === "SANGAT_BERAT";
    const status =
      isBerat && rng() < 0.4 ? "MENUNGGU" :
      cat.jenis === "DEMERIT" && rng() < 0.05 ? "DIBATALKAN" :
      "DILULUSKAN";
    await db.meritRecord.create({
      data: {
        studentId: s.id,
        categoryId: cat.id,
        tarikh: iso,
        mata: cat.mata,
        penerangan: cat.nama + (rng() < 0.3 ? " (berulang)" : ""),
        status,
        tindakan: status === "DILULUSKAN" && cat.jenis === "DEMERIT"
          ? "Nasihat lisan oleh guru."
          : null,
        direkodOleh: "U01",
        diluluskanOleh: status === "DILULUSKAN" ? "U03" : null,
      },
    });
    mrCount++;
  }

  // Ensure the special PRD scenario records exist:
  // S004 (CRITICAL) - heavy demerit D08 (Keluar kawasan)
  await db.meritRecord.create({
    data: {
      studentId: "S004", categoryId: "D08", tarikh: "2026-10-21", mata: -10,
      penerangan: "Keluar kawasan madrasah tanpa kebenaran",
      status: "DILULUSKAN", tindakan: "Nasihat dan panggilan penjaga",
      direkodOleh: "U01", diluluskanOleh: "U03",
    },
  });
  // S005 - demerit MENUNGGU
  await db.meritRecord.create({
    data: {
      studentId: "S005", categoryId: "D07", tarikh: "2026-11-05", mata: -10,
      penerangan: "Bergaduh dengan rakan (dalam siasatan)",
      status: "MENUNGGU", direkodOleh: "U01",
    },
  });
  // S006 - high merit
  for (let i = 0; i < 3; i++) {
    await db.meritRecord.create({
      data: {
        studentId: "S006", categoryId: pick(meritCategories).id,
        tarikh: `2026-10-0${intBetween(1, 9)}`, mata: pick(meritCategories).mata,
        penerangan: "Pencapaian cemerlang",
        status: "DILULUSKAN", direkodOleh: "U01", diluluskanOleh: "U03",
      },
    });
  }

  // S001 (cemerlang) — add a few merit records so demo shows positive totals
  const s001merits = [
    { studentId: "S001", categoryId: "M06", tarikh: "2026-09-15", mata: 10, penerangan: "Hafazan cemerlang - menamatkan target lebih awal" },
    { studentId: "S001", categoryId: "M04", tarikh: "2026-10-05", mata: 5, penerangan: "Solat berjemaah konsisten sebulan" },
    { studentId: "S001", categoryId: "M01", tarikh: "2026-10-20", mata: 3, penerangan: "Membantu rakan hafazan" },
    { studentId: "S001", categoryId: "M07", tarikh: "2026-11-03", mata: 2, penerangan: "Bilik asrama paling bersih mingguan" },
  ];
  for (const r of s001merits) {
    await db.meritRecord.create({
      data: { ...r, status: "DILULUSKAN", direkodOleh: "U01", diluluskanOleh: "U03" },
    });
  }

  // S004 (kritikal) — add heavy demerits to push past ambang KRITIKAL (51+)
  const s004demerits = [
    { studentId: "S004", categoryId: "D07", tarikh: "2026-09-10", mata: -10, penerangan: "Bergaduh dengan rakan", tindakan: "Nasihat dan panggilan penjaga" },
    { studentId: "S004", categoryId: "D08", tarikh: "2026-09-25", mata: -12, penerangan: "Keluar kawasan madrasah tanpa kebenaran", tindakan: "Amaran bertulis" },
    { studentId: "S004", categoryId: "D09", tarikh: "2026-10-08", mata: -15, penerangan: "Merosakkan harta madrasah (pintu asrama)", tindakan: "Ganti rugi dan kerja sosial" },
  ];
  for (const r of s004demerits) {
    await db.meritRecord.create({
      data: { ...r, status: "DILULUSKAN", direkodOleh: "U01", diluluskanOleh: "U03" },
    });
  }
  console.log(`Inserted ~${mrCount + 5 + s001merits.length + s004demerits.length} merit records`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
