import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { DepositPembelian, DepositPembelianInput, DepositPembelianPage } from "./deposit-pembelian.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const COLS = `
  p.id::int AS id, p.no, to_char(p.tanggal,'YYYY-MM-DD') AS tanggal, p.vendor AS "vendorId", v.nama AS "vendorNama",
  p.divisi_id AS "divisiId", p.purcor_id::int AS "purcorId", p.pembel_id::int AS "pembelId",
  p.deposit::text AS deposit, p.catatan`;

@Injectable()
export class DepositPembelianService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<DepositPembelianPage> {
    const params: unknown[] = [];
    let where = "WHERE p.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (p.no ILIKE $${params.length} OR v.nama ILIKE $${params.length})`;
    }
    const total = await this.pool.query(
      `SELECT count(*)::int AS n FROM gf.s_deppem p LEFT JOIN gf.s_vendor v ON v.id=p.vendor ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${COLS} FROM gf.s_deppem p LEFT JOIN gf.s_vendor v ON v.id=p.vendor ${where} ORDER BY p.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as DepositPembelian[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<DepositPembelian | null> {
    const r = await this.pool.query(
      `SELECT ${COLS} FROM gf.s_deppem p LEFT JOIN gf.s_vendor v ON v.id=p.vendor WHERE p.id=$1 AND p.hapus_oleh IS NULL`,
      [id],
    );
    return (r.rows[0] as DepositPembelian) ?? null;
  }

  async create(input: DepositPembelianInput, userId = 1): Promise<DepositPembelian> {
    const r = await this.pool.query(
      `INSERT INTO gf.s_deppem (id, no, tanggal, vendor, divisi_id, purcor_id, pembel_id, deposit, catatan, input_oleh, tgl_input, jam_input)
       VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_deppem), $1, COALESCE($2, now()::date), $3, $4, $5, $6, $7, $8, $9, now()::date, to_char(now(),'HH24:MI:SS'))
       RETURNING id`,
      [nn(input.no), nn(input.tanggal), input.vendorId, nn(input.divisiId), nn(input.purcorId), nn(input.pembelId), num(input.deposit), nn(input.catatan), userId],
    );
    return (await this.byId(r.rows[0].id as number))!;
  }

  async update(id: number, input: DepositPembelianInput, userId = 1): Promise<DepositPembelian | null> {
    await this.pool.query(
      `UPDATE gf.s_deppem SET no=$2, tanggal=COALESCE($3, tanggal), vendor=$4, divisi_id=$5, purcor_id=$6, pembel_id=$7,
         deposit=$8, catatan=$9, ubah_oleh=$10, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, nn(input.no), nn(input.tanggal), input.vendorId, nn(input.divisiId), nn(input.purcorId), nn(input.pembelId), num(input.deposit), nn(input.catatan), userId],
    );
    return this.byId(id);
  }

  async softDelete(id: number, userId = 1): Promise<boolean> {
    const r = await this.pool.query(
      `UPDATE gf.s_deppem SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
