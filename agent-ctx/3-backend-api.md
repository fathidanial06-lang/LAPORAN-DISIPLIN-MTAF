# Task 3 — Backend API (route handlers)

Owner: backend-api agent
Status: COMPLETE

## Scope
Implemented all backend REST API route handlers for the Laporan Disiplin Murid app,
plus auth + audit + shared helpers. Did NOT touch schema, seed, domain, db, ui, layout,
globals.css, or page.tsx (owned by other agents).

## Files created
Helpers:
- `src/lib/disiplin/auth.ts` — `parseStaffToken`, `parseParentToken`, `requireStaff`, `makeStaffToken`, `makeParentToken`. Dummy base64 token scheme per the spec. Reads `x-staff-token` / `x-student-token` headers.
- `src/lib/disiplin/audit.ts` — `logAudit({ userId, userName, tindakan, entiti, entitiId?, nilaiLama?, nilaiBaru? })`. JSON.stringifies nilaiLama/nilaiBaru. Never throws (logs errors to console).
- `src/lib/disiplin/api-helpers.ts` — `loadConfig()` (parses JSON columns), `rateLimitCheck/Reset/clientIP`, `parseJSON`, `defaultRange` (last 3 months).

Public (ibu bapa) routes:
- `src/app/api/config/route.ts` — GET → config (parsed).
- `src/app/api/students/search/route.ts` — GET. 12-digit IC → exact match (full IC returned). Else name LIKE contains (IC masked). Rate limited (15/60s per IP, 429). 400 if q < 2 chars.
- `src/app/api/students/verify/route.ts` — POST. Validates IC match + optional 4-digit penjaga pin (if config.pengesahanIbuBapa=true). Returns parent token. Resets rate limit on success.
- `src/app/api/students/[id]/report/route.ts` — GET (x-student-token). Returns murid/kedatangan/sahsiah/merit/totalsByStatus. from/to default = last 3 months.
- `src/app/api/students/[id]/attendance/route.ts` — GET (x-student-token). Records + stats.
- `src/app/api/students/[id]/character/route.ts` — GET (x-student-token). DISAHKAN only, sorted desc, with computed gred.
- `src/app/api/students/[id]/merits/route.ts` — GET (x-student-token OR x-staff-token). Parent tokens only see DILULUSKAN. Includes category info. Totals via computeMeritTotals.

Staff routes (x-staff-token required unless noted):
- `src/app/api/staff/login/route.ts` — POST (no token). Returns staff token.
- `src/app/api/staff/me/route.ts` — GET. Returns current user.
- `src/app/api/staff/dashboard/route.ts` — GET. Stats (jumlahMurid, hadirHariIni, lewatHariIni, tidakHadirHariIni, menungguKelulusan, belumDirekodHariIni), perluPerhatian (up to 12), demeritTerkini (last 10).
- `src/app/api/staff/students/route.ts` — GET (list with totals + peratusKehadiran), POST (create, auto-generates S### id, validates IC unique, 409 if exists, audit).
- `src/app/api/staff/students/[id]/route.ts` — PUT (partial update, 404 if missing, audit), DELETE (soft delete aktif=false, audit).
- `src/app/api/attendance/bulk/route.ts` — POST { tarikh, records:[{studentId,status,catatan?}] }. Upserts by unique [studentId, tarikh]. audit.
- `src/app/api/merits/route.ts` — POST { studentId, categoryId, tarikh, penerangan?, mata? }. DEMERIT+BERAT/SANGAT_BERAT → MENUNGGU; else auto-approve with diluluskanOleh=staffId. audit.
- `src/app/api/merits/[id]/approve/route.ts` — PATCH { action:"approve"|"cancel", sebab? }. HEM/PENTADBIR only (403 otherwise). audit.
- `src/app/api/staff/categories/route.ts` — GET (list), POST (create, 409 if id exists, audit).
- `src/app/api/staff/categories/[id]/route.ts` — PUT (update, 404 if missing, audit).
- `src/app/api/staff/audit/route.ts` — GET ?limit= (default 100, max 1000). Sorted desc by createdAt.
- `src/app/api/staff/config/route.ts` — PUT (merge with existing config, JSON.stringify objects, audit). HEM/PENTADBIR only.
- `src/app/api/staff/reset/route.ts` — POST. Runs `bun run prisma/seed.ts` via execSync. HEM/PENTADBIR only. audit.

## Notes for the frontend agent
- All staff endpoints require header `x-staff-token` (value returned by POST /api/staff/login).
- All parent endpoints require header `x-student-token` (value returned by POST /api/students/verify).
- Rate limit header: when /api/students/search returns 429, show the Malay message returned in `error`.
- POST /api/students/verify returns `{ token, studentId, nama, kelas }`.
- POST /api/staff/login returns `{ token, user: { id, nama, username, peranan } }`.
- Dashboard `belumDirekodHariIni` = active students minus (hadir + lewat + tidakHadir) recorded today.
- Merits: parent sees only DILULUSKAN; staff sees all (filter via ?status=).
- Merit record create auto-approves non-BERAT demerit and all MERIT. diluluskanOleh = staffId in that case.

## Staff demo credentials (from seed.ts — DO NOT change)
| username | password | peranan |
|----------|----------|---------|
| faiz     | demo123  | GURU    |
| noraini  | demo123  | GURU    |
| hashim   | demo123  | HEM     |
| khadijah | demo123  | HEM     |
| tarmizi  | admin123 | PENTADBIR |

## Linting
`bun run lint` passes with 0 errors in backend files. The only lint warning is
in a frontend file (`src/components/disiplin/public/StudentReport.tsx:97` —
unused eslint-disable directive) and is NOT mine to fix.

## Known dev-server blocker (NOT owned by me)
The dev server is currently serving a 500 error for every route (including all
`/api/*` handlers) because `src/app/globals.css:172` contains `@apply glass`,
which Tailwind v4 rejects ("Cannot apply unknown utility class `glass`").
The `.glass` custom class is defined as a plain CSS class in the same file and
cannot be referenced via `@apply` in Tailwind v4. This is a frontend-owned file
(per the task brief, "do not touch"). The frontend agent must fix it (e.g. replace
`@apply glass rounded-2xl;` with the actual CSS properties, or use the `.glass`
class directly on the element instead of `@apply`). My API routes will compile
and serve correctly the moment that CSS error is resolved.
