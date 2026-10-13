import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { PrditmRef, Produksi, ProduksiInput, ProduksiPage } from "./produksi.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const COLS = `
  p.id::int AS id, to_char(p.tanggal,'YYYY-MM-DD') AS tanggal, p.divisi_id AS "divisiId",
  p.prditm_id AS "prditmId", i.nama AS "prditmNama", p.jumlah::text AS jumlah,
  p.perkir_1 AS "perkir1", p.perkir_2 AS "perkir2", p.perkir_3 AS "perkir3",
  p.per1_nil::text AS "nilai1", p.per2_nil::text AS "nilai2", p.per3_nil::text AS "nilai3",
  p.catatan, p.catatan_2 AS "catatan2", p.catatan_3 AS "catatan3"`;

const JOIN = `LEFT JOIN gf.s_prditm i ON i.id=p.prditm_id`;

@Injectable()
export class ProduksiService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<ProduksiPage> {
    const params: unknown[] = [];
    let where = "WHERE p.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (COALESCE(p.catatan,'') ILIKE $${params.length} OR COALESCE(i.nama,'') ILIKE $${params.length})`;
    }
    const total = await this.pool.query(
      `SELECT count(*)::int AS n FROM gf.s_prodsi p ${JOIN} ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${COLS} FROM gf.s_prodsi p ${JOIN} ${where} ORDER BY p.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as Produksi[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<Produksi | null> {
    const r = await this.pool.query(`SELECT ${COLS} FROM gf.s_prodsi p ${JOIN} WHERE p.id=$1 AND p.hapus_oleh IS NULL`, [id]);
    return (r.rows[0] as Produksi) ?? null;
  }

  async create(input: ProduksiInput, userId = 1): Promise<Produksi> {
    const r = await this.pool.query(
      `INSERT INTO gf.s_prodsi (id, tanggal, divisi_id, prditm_id, jumlah,
         perkir_1, perkir_2, perkir_3, per1_nil, per2_nil, per3_nil,
         catatan, catatan_2, catatan_3, input_oleh, tgl_input, jam_input)
       VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_prodsi), COALESCE($1, now()::date), $2, $3, $4,
         $5, $6, $7, $8::numeric, $9::numeric, $10::numeric,
         $11, $12, $13, $14, now()::date, to_char(now(),'HH24:MI:SS'))
       RETURNING id`,
      [nn(input.tanggal), nn(input.divisiId), nn(input.prditmId), num(input.jumlah),
       nn(input.perkir1), nn(input.perkir2), nn(input.perkir3),
       num(input.nilai1), num(input.nilai2), num(input.nilai3),
       nn(input.catatan), nn(input.catatan2), nn(input.catatan3), userId],
    );
    return (await this.byId(r.rows[0].id as number))!;
  }

  async update(id: number, input: ProduksiInput, userId = 1): Promise<Produksi | null> {
    await this.pool.query(
      `UPDATE gf.s_prodsi SET tanggal=COALESCE($2, tanggal), divisi_id=$3, prditm_id=$4, jumlah=$5,
         perkir_1=$6, perkir_2=$7, perkir_3=$8, per1_nil=$9::numeric, per2_nil=$10::numeric, per3_nil=$11::numeric,
         catatan=$12, catatan_2=$13, catatan_3=$14,
         ubah_oleh=$15, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, nn(input.tanggal), nn(input.divisiId), nn(input.prditmId), num(input.jumlah),
       nn(input.perkir1), nn(input.perkir2), nn(input.perkir3),
       num(input.nilai1), num(input.nilai2), num(input.nilai3),
       nn(input.catatan), nn(input.catatan2), nn(input.catatan3), userId],
    );
    return this.byId(id);
  }

  async softDelete(id: number, userId = 1): Promise<boolean> {
    const r = await this.pool.query(
      `UPDATE gf.s_prodsi SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  async prditmRef(): Promise<PrditmRef[]> {
    const r = await this.pool.query(
      `SELECT id::int AS id, nama, stock_id AS "stockId", jumlah::text AS jumlah
       FROM gf.s_prditm WHERE hapus_oleh IS NULL ORDER BY id LIMIT 500`,
    );
    return r.rows as PrditmRef[];
  }
}
