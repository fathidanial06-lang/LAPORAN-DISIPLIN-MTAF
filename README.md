# Laporan Disiplin Murid — Madrasah Tahfiz Al Furqan

Portal **Laporan Disiplin Murid** untuk Madrasah Tahfiz Al Furqan (Unit Hal Ehwal Murid, HEM), Malaysia. Dibangunkan mengikut Dokumen Keperluan Produk (PRD) versi 1.0.

Aplikasi web responsif (mobile-first) yang membolehkan ibu bapa menyemak laporan disiplin anak (kedatangan, sahsiah, merit & demerit), dan panel staf (Guru/HEM/Pentadbir) mengurus rekod murid.

## Teknologi
- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui** (komponen)
- **Prisma ORM** + **SQLite** (pangkalan data dummy)
- **Recharts** (carta), **Zustand** (keadaan klien), **Sonner** (toast)
- Reka bentuk **Neumorphism (Soft UI)** + **Bento Grid** dengan palet turquoise + emas (sepadan dengan logo sekolah)

## Ciri utama

### Portal Ibu Bapa
- Carian murid mengikut No. IC (12 digit) atau nama (IC bertopeng untuk carian nama)
- Pengesahan ringan (boleh dihidup/dimatikan: 4 digit akhir IC penjaga)
- Laporan murid dengan 3 kad status berkod warna (Kedatangan / Sahsiah / Merit & Demerit)
- Penapis tempoh (Bulan Ini / Penggal Ini / Tahun Ini / Tersuai)
- Butiran kedatangan (kalendar bulanan, statistik, carta tren)
- Butiran sahsiah (skor 5 aspek, gred, carta radar, perbandingan)
- Butiran merit/demerit (mata bersih, tahap disiplin, garis masa)
- Cetak / Simpan PDF
- Hanya rekod diluluskan dipaparkan kepada ibu bapa

### Panel Staf (RBAC)
- Log masuk berasaskan peranan: Guru, HEM, Pentadbir
- Papan pemuka dengan statistik hari ini + senarai "Perlu Perhatian" + "Demerit Terkini"
- CRUD murid (tambah, ubah, nyahaktif)
- Input kedatangan pukal satu kelas
- Borang pantas tambah merit/demerit (dioptimumkan untuk telefon)
- Kelulusan demerit berat (HEM/Pentadbir)
- Pengurusan kategori merit/demerit
- Tetapan sistem (ambang kehadiran, ambang disiplin, pengesahan ibu bapa, hari cuti)
- Log audit
- Butang "Tetap semula data dummy"

## Akaun demo (staf)
| Username | Password | Peranan |
|---|---|---|
| faiz | demo123 | Guru |
| noraini | demo123 | Guru |
| hashim | demo123 | HEM |
| khadijah | demo123 | HEM |
| tarmizi | admin123 | Pentadbir |

## Cara menjalankan

### Prasyarat
- Node.js 18+ / Bun
- (Pelayan) dijalankan dengan `bun`

### Pemasangan
```bash
bun install
```

### Pangkalan data
Pangkalan data SQLite dummy (`db/custom.db`) sudah disertakan dengan data rekaan:
- 60 murid dalam 5 kelas Tahfiz (12 setiap kelas)
- 3 bulan rekod kedatangan
- 2 penilaian sahsiah setiap murid
- 19 kategori merit/demerit
- ~125 rekod merit/demerit
- 5 pengguna staf

Untuk menjanakan semula data dummy:
```bash
bun run db:push        # sync skema
bun run prisma/seed.ts # reset + seed data rekaan
```

### Pembangunan
```bash
bun run dev
```
Buka `http://localhost:3000`.

### Build produksi
```bash
bun run build
bun run start
```

### Lint
```bash
bun run lint
```

## Struktur projek
```
prisma/
  schema.prisma          # Skema pangkalan data
  seed.ts                # Skrip seed data dummy
src/
  app/
    api/                 # Route handlers (Next.js App Router)
    globals.css          # Tema neumorphism + turquoise + emas
    layout.tsx           # Layout root
    page.tsx             # Halaman tunggal (SPA) — entry point
  components/
    ui/                  # Komponen shadcn/ui
    disiplin/
      AppHeader.tsx
      AppFooter.tsx
      public/            # Portal ibu bapa
      staff/             # Panel staf
      shared/            # Komponen kongsi
  lib/
    db.ts                # Prisma client (normalkan laluan db mutlak)
    disiplin/
      domain.ts          # Logik domain tulen (pengiraan)
      store.ts           # Zustand store
      api.ts             # Klien API
      auth.ts            # Pengesahan token
      audit.ts           # Log audit
```

## Peraturan perniagaan
- **Mata Bersih** = Jumlah Merit − Jumlah Demerit (penggal semasa)
- **Tahap Disiplin** berdasarkan jumlah demerit: Cemerlang (0–5), Baik (6–15), Perlu Perhatian (16–30), Amaran Serius (31–50), Kritikal (51+)
- Demerit berat/sangat berat memerlukan kelulusan HEM sebelum dipaparkan kepada ibu bapa
- Rekod tidak boleh dipadam; pembetulan melalui pembatalan dengan sebab (jejak audit)

## Nota
Semua nama murid dan nombor IC adalah **rekaan sepenuhnya** untuk tujuan prototaip. Jangan guna data sebenar murid pada fasa ini.

## Pelesenan
Hak cipta © 2026 Madrasah Tahfiz Al Furqan · Unit Hal Ehwal Murid.
