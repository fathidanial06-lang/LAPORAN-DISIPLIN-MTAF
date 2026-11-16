// Pure domain logic for "Laporan Disiplin Murid" - shared by frontend & backend.
// All functions are pure and easy to test (PRD 12.2 domain layer).

// ---------- IC ----------
/** Normalize an IC string: keep only digits, expect 12 digits. */
export function normalizeIC(input: string): string {
  return (input || "").replace(/\D/g, "");
}

/** Returns true if input normalizes to exactly 12 digits. */
export function isValidIC(input: string): boolean {
  return normalizeIC(input).length === 12;
}

/** Mask IC for public search results: e.g. 120514-10-*123 (hides middle 4). */
export function maskIC(ic: string): string {
  const n = normalizeIC(ic);
  if (n.length !== 12) return n;
  return `${n.slice(0, 6)}-${n.slice(6, 8)}-*${n.slice(10)}`;
}

// ---------- Attendance ----------
export type AttendanceStatus =
  | "HADIR"
  | "LEWAT"
  | "SAKIT"
  | "KEBENARAN"
  | "TANPA_SEBAB"
  | "PULANG_AWAL";

export interface AttendanceStats {
  hariSekolah: number;
  hadir: number;
  lewat: number;
  sakit: number;
  kebenaran: number;
  tanpaSebab: number;
  pulangAwal: number;
  peratus: number;
  status: "CEMERLANG" | "BAIK" | "PERLU_PERHATIAN" | "KRITIKAL";
}

export interface AmbangKehadiran {
  CEMERLANG: number; // >=
  BAIK: number; // >=
  PERLU_PERHATIAN: number; // >=
}

/** Compute attendance statistics from a list of records. */
export function computeAttendanceStats(
  records: { status: AttendanceStatus }[],
  ambang: AmbangKehadiran
): AttendanceStats {
  const hariSekolah = records.length;
  const hadir = records.filter((r) => r.status === "HADIR").length;
  const lewat = records.filter((r) => r.status === "LEWAT").length;
  const sakit = records.filter((r) => r.status === "SAKIT").length;
  const kebenaran = records.filter((r) => r.status === "KEBENARAN").length;
  const tanpaSebab = records.filter((r) => r.status === "TANPA_SEBAB").length;
  const pulangAwal = records.filter((r) => r.status === "PULANG_AWAL").length;
  const hadirEfektif = hadir + lewat; // lewat still counts as hadir for %
  const peratus =
    hariSekolah === 0 ? 0 : Math.round((hadirEfektif / hariSekolah) * 100);

  let status: AttendanceStats["status"] = "KRITIKAL";
  if (peratus >= ambang.CEMERLANG) status = "CEMERLANG";
  else if (peratus >= ambang.BAIK) status = "BAIK";
  else if (peratus >= ambang.PERLU_PERHATIAN) status = "PERLU_PERHATIAN";

  return {
    hariSekolah,
    hadir,
    lewat,
    sakit,
    kebenaran,
    tanpaSebab,
    pulangAwal,
    peratus,
    status,
  };
}

// ---------- Character / Sahsiah ----------
export interface CharacterScore {
  akhlak: number;
  ibadah: number;
  kebersihan: number;
  tanggungjawab: number;
  sosial: number;
}

export interface CharacterGradeResult {
  gred: "A" | "B" | "C" | "D";
  label: string;
  skor: number; // average 1-5
}

/** Compute overall character grade from 5 aspect scores. */
export function computeCharacterGrade(s: CharacterScore): CharacterGradeResult {
  const arr = [s.akhlak, s.ibadah, s.kebersihan, s.tanggungjawab, s.sosial];
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  let gred: CharacterGradeResult["gred"] = "D";
  let label = "Perlu Bimbingan";
  if (avg >= 4.5) {
    gred = "A";
    label = "Cemerlang";
  } else if (avg >= 3.5) {
    gred = "B";
    label = "Baik";
  } else if (avg >= 2.5) {
    gred = "C";
    label = "Memuaskan";
  }
  return { gred, label, skor: Math.round(avg * 100) / 100 };
}

// ---------- Merit & Demerit ----------
export interface AmbangDisiplin {
  CEMERLANG: { max: number };
  BAIK: { max: number };
  PERLU_PERHATIAN: { max: number };
  AMARAN_SERIUS: { max: number };
  KRITIKAL: { min: number };
}

export type TahapDisiplin =
  | "CEMERLANG"
  | "BAIK"
  | "PERLU_PERHATIAN"
  | "AMARAN_SERIUS"
  | "KRITIKAL";

export interface MeritTotals {
  merit: number;
  demerit: number;
  bersih: number;
  tahap: TahapDisiplin;
  tindakan: string;
}

/** Determine discipline level from total demerit (after redemption, if enabled). */
export function computeDisciplineLevel(
  totalDemerit: number,
  ambang: AmbangDisiplin
): { tahap: TahapDisiplin; tindakan: string } {
  const d = Math.abs(totalDemerit);
  if (d <= ambang.CEMERLANG.max) return { tahap: "CEMERLANG", tindakan: "Tahniah! Teruskan akhlak yang baik." };
  if (d <= ambang.BAIK.max) return { tahap: "BAIK", tindakan: "Rekod baik. Sedikit teguran lisan telah diberikan." };
  if (d <= ambang.PERLU_PERHATIAN.max) return { tahap: "PERLU_PERHATIAN", tindakan: "Amaran bertulis; ibu bapa dijemput berbincang dengan guru/HEM." };
  if (d <= ambang.AMARAN_SERIUS.max) return { tahap: "AMARAN_SERIUS", tindakan: "Panggilan ibu bapa dan sesi kaunseling; pelan pemantauan." };
  return { tahap: "KRITIKAL", tindakan: "Dirujuk kepada Mudir/Jawatankuasa Disiplin dan pertemuan wajib." };
}

/** Compute merit totals from merit records (only DILULUSKAN count for parent view). */
export function computeMeritTotals(
  records: { mata: number; status: string }[],
  ambang: AmbangDisiplin
): MeritTotals {
  const approved = records.filter((r) => r.status === "DILULUSKAN");
  let merit = 0;
  let demerit = 0;
  for (const r of approved) {
    if (r.mata >= 0) merit += r.mata;
    else demerit += Math.abs(r.mata);
  }
  const bersih = merit - demerit;
  const { tahap, tindakan } = computeDisciplineLevel(demerit, ambang);
  return { merit, demerit, bersih, tahap, tindakan };
}

// ---------- Color helpers (UI) ----------
export const STATUS_COLORS: Record<AttendanceStatus, string> = {
  HADIR: "#16a34a",
  LEWAT: "#ca8a04",
  SAKIT: "#0ea5e9",
  KEBENARAN: "#6366f1",
  TANPA_SEBAB: "#ea580c",
  PULANG_AWAL: "#a855f7",
};

export const TAHAP_COLORS: Record<TahapDisiplin, string> = {
  CEMERLANG: "#16a34a",
  BAIK: "#65a30d",
  PERLU_PERHATIAN: "#eab308",
  AMARAN_SERIUS: "#ea580c",
  KRITIKAL: "#dc2626",
};

export const ATTENDANCE_STATUS_COLORS = STATUS_COLORS;

// ---------- Date helpers (Asia/Kuala_Lumpur, DD/MM/YYYY display) ----------
export function formatDateMY(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------- Malay label helpers ----------
export const STATUS_LABEL_MY: Record<AttendanceStatus, string> = {
  HADIR: "Hadir",
  LEWAT: "Lewat",
  SAKIT: "Tidak Hadir (Sakit/MC)",
  KEBENARAN: "Tidak Hadir (Dengan Kebenaran)",
  TANPA_SEBAB: "Tidak Hadir (Tanpa Sebab)",
  PULANG_AWAL: "Pulang Awal",
};

export const TAHAP_LABEL_MY: Record<TahapDisiplin, string> = {
  CEMERLANG: "Cemerlang",
  BAIK: "Baik",
  PERLU_PERHATIAN: "Perlu Perhatian",
  AMARAN_SERIUS: "Amaran Serius",
  KRITIKAL: "Kritikal",
};
