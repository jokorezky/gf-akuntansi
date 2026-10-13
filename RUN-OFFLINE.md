# RUN-OFFLINE.md — menjalankan semuanya tanpa internet

Semua komponen sudah disimpan lokal. Urutan menyalakan (Windows PowerShell):

## 0. Prasyarat (sudah ada di mesin ini)
- Node (v24), pnpm via `corepack.cmd`, Python 3.13, Docker Desktop, Google Chrome, Git.

## 1. Database (PostgreSQL legacy `gf`)
```powershell
docker start indusia-akunting-pg
docker exec indusia-akunting-pg psql -U postgres -d indusia-akunting -c "select count(*) from information_schema.tables where table_schema='gf';"
```
- Image `postgres:18-alpine` **sudah lokal**; data di volume container (auth `trust`, user `postgres`).
- Koneksi: host `127.0.0.1`, port **5435**, db `indusia-akunting`, schema `gf` (143 tabel).

## 2. Backend API (NestJS + GraphQL)
```powershell
cd D:\Projects\gf-akuntansi-clone
corepack.cmd pnpm --filter @gf/api build
node apps\api\dist\main.js        # http://localhost:4000/graphql
```
- Env opsional: `PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE/PORT`.

## 3. Frontend (Next.js)
```powershell
cd D:\Projects\gf-akuntansi-clone
corepack.cmd pnpm --filter @gf/web dev     # http://localhost:3000
```
- Arah API: env `NEXT_PUBLIC_API_URL` (default `http://localhost:4000/graphql`).

## 4. windows-mcp (otomasi baca GF) — offline
- Sudah di-install di `tools\mcp-venv` (tanpa perlu unduh).
- `opencode.jsonc` sudah menunjuk ke `tools\mcp-venv\Scripts\windows-mcp.exe serve`.
- Harness observe: `tools\gf-observe\*.py` (pakai venv Python lokal).

## 5. Bila `node_modules` hilang (tetap offline)
```powershell
corepack.cmd pnpm install --offline     # ambil dari store lokal D:\.pnpm-store
```

## 6. Bila perlu bangun ulang MCP venv (offline jika cache ada)
```powershell
python -m venv tools\mcp-venv
tools\mcp-venv\Scripts\python -m pip install windows-mcp
```

## Ringkasan port
| Layanan | Port |
|---|---|
| PostgreSQL (Docker) | 5435 |
| GraphQL API | 4000 |
| Next.js web | 3000 |
| Obsidian Local REST API (vault) | 27124 |
