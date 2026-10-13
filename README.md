# gf-akuntansi-clone

Rebuild **GF Akuntansi** (GFsoft, CA-Visual Objects 2.8.3) menjadi aplikasi web TypeScript.

- **UI/UX**: meniru GF (alur, menu, urutan isian, dan tampilan visual).
- **Logika**: mengikuti spesifikasi (rule ID `CALC-…`, `JRNL-…`, `VALID-…`) — bukan menyalin bug GF.
- **Stack**: Next.js + React + TypeScript + Tailwind + shadcn/ui (FE); NestJS + GraphQL + PostgreSQL (BE, menyusul).

## Struktur

- `apps/web` — frontend (Next.js).
- `apps/api` — backend (NestJS + GraphQL) — menyusul.
- `docs/specs` — functional spec per layar.
- `DESIGN.md` — token visual (diambil dari GF).
- `tools/gf-observe` — harness pembaca aplikasi GF (Windows-MCP / Win32).

## Metode per layar

`Observe → Spec → Code → Proof` (lihat `docs/WORKFLOW.md`).
