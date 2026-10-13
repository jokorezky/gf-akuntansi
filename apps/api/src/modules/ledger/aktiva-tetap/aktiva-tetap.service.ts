import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { AktivaTetap, AktivaTetapInput, AktivaTetapPage } from "./aktiva-tetap.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const COLS = `
  a.id::int AS id, a.nama, to_char(a.tgl_beli,'YYYY-MM-DD') AS "tglBeli", a.harga_beli::text AS "hargaBeli",
  to_char(a.tgl_susut,'YYYY-MM-DD') AS "tglSusut", a.mtd_susut AS "mtdSusut", a.nil_susut::text AS "nilSusut",
  a.usia_susut AS "usiaSusut", a.divisi_id AS "divisiId", a.perkir_1 AS "perkirId1", a.perkir_2 AS "perkirId2",
  to_char(a.tgl_jual,'YYYY-MM-DD') AS "tglJual", to_char(a.tgl_out,'YYYY-MM-DD') AS "tglOut", a.catatan`;

@Injectable()
export class AktivaTetapService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<AktivaTetapPage> {
    const params: unknown[] = [];
    let where = "WHERE a.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND a.nama ILIKE $${params.length}`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_aktttp a ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${COLS} FROM gf.s_aktttp a ${where} ORDER BY a.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as AktivaTetap[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<AktivaTetap | null> {
    const r = await this.pool.query(`SELECT ${COLS} FROM gf.s_aktttp a WHERE a.id=$1 AND a.hapus_oleh IS NULL`, [id]);
    return (r.rows[0] as AktivaTetap) ?? null;
  }

  async create(input: AktivaTetapInput, userId = 1): Promise<AktivaTetap> {
    const r = await this.pool.query(
      `INSERT INTO gf.s_aktttp
         (id, nama, tgl_beli, harga_beli, tgl_susut, mtd_susut, nil_susut, usia_susut, divisi_id, perkir_1, perkir_2, tgl_jual, tgl_out, catatan, input_oleh, tgl_input, jam_input)
       VALUES
         ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_aktttp), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now()::date, to_char(now(),'HH24:MI:SS'))
       RETURNING id`,
      [input.nama, nn(input.tglBeli), num(input.hargaBeli), nn(input.tglSusut), nn(input.mtdSusut), num(input.nilSusut),
       nn(input.usiaSusut), nn(input.divisiId), nn(input.perkirId1), nn(input.perkirId2), nn(input.tglJual), nn(input.tglOut), nn(input.catatan), userId],
    );
    return (await this.byId(r.rows[0].id as number))!;
  }

  async update(id: number, input: AktivaTetapInput, userId = 1): Promise<AktivaTetap | null> {
    await this.pool.query(
      `UPDATE gf.s_aktttp SET nama=$2, tgl_beli=$3, harga_beli=$4, tgl_susut=$5, mtd_susut=$6, nil_susut=$7,
         usia_susut=$8, divisi_id=$9, perkir_1=$10, perkir_2=$11, tgl_jual=$12, tgl_out=$13, catatan=$14,
         ubah_oleh=$15, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, input.nama, nn(input.tglBeli), num(input.hargaBeli), nn(input.tglSusut), nn(input.mtdSusut), num(input.nilSusut),
       nn(input.usiaSusut), nn(input.divisiId), nn(input.perkirId1), nn(input.perkirId2), nn(input.tglJual), nn(input.tglOut), nn(input.catatan), userId],
    );
    return this.byId(id);
  }

  async softDelete(id: number, userId = 1): Promise<boolean> {
    const r = await this.pool.query(
      `UPDATE gf.s_aktttp SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
