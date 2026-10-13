import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { Promosi, PromosiInput, PromosiPage } from "./promosi.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}

const COLS = `
  p.id::int AS id, to_char(p.tanggal_1,'YYYY-MM-DD') AS "tanggal1", to_char(p.tanggal_2,'YYYY-MM-DD') AS "tanggal2",
  p.pukul_1 AS "pukul1", p.pukul_2 AS "pukul2", p.hari, p.penj_ecr AS "penjEcr", p.penj_csh AS "penjCsh",
  p.penj_crd AS "penjCrd", p.semua_komp AS "semuaKomp", p.divisi, p.catatan`;

@Injectable()
export class PromosiService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<PromosiPage> {
    const params: unknown[] = [];
    let where = "WHERE p.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND p.catatan ILIKE $${params.length}`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_promos p ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${COLS} FROM gf.s_promos p ${where} ORDER BY p.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as Promosi[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<Promosi | null> {
    const r = await this.pool.query(`SELECT ${COLS} FROM gf.s_promos p WHERE p.id=$1 AND p.hapus_oleh IS NULL`, [id]);
    return (r.rows[0] as Promosi) ?? null;
  }

  async create(input: PromosiInput, userId = 1): Promise<Promosi> {
    const r = await this.pool.query(
      `INSERT INTO gf.s_promos
         (id, tanggal_1, tanggal_2, pukul_1, pukul_2, hari, penj_ecr, penj_csh, penj_crd, semua_komp, divisi, catatan, input_oleh, tgl_input, jam_input)
       VALUES
         ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_promos), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now()::date, to_char(now(),'HH24:MI:SS'))
       RETURNING id`,
      [nn(input.tanggal1), nn(input.tanggal2), nn(input.pukul1), nn(input.pukul2), nn(input.hari),
       input.penjEcr ?? false, input.penjCsh ?? false, input.penjCrd ?? false, input.semuaKomp ?? false,
       nn(input.divisi), nn(input.catatan), userId],
    );
    return (await this.byId(r.rows[0].id as number))!;
  }

  async update(id: number, input: PromosiInput, userId = 1): Promise<Promosi | null> {
    await this.pool.query(
      `UPDATE gf.s_promos SET tanggal_1=$2, tanggal_2=$3, pukul_1=$4, pukul_2=$5, hari=$6,
         penj_ecr=$7, penj_csh=$8, penj_crd=$9, semua_komp=$10, divisi=$11, catatan=$12,
         ubah_oleh=$13, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, nn(input.tanggal1), nn(input.tanggal2), nn(input.pukul1), nn(input.pukul2), nn(input.hari),
       input.penjEcr ?? false, input.penjCsh ?? false, input.penjCrd ?? false, input.semuaKomp ?? false,
       nn(input.divisi), nn(input.catatan), userId],
    );
    return this.byId(id);
  }

  async softDelete(id: number, userId = 1): Promise<boolean> {
    const r = await this.pool.query(
      `UPDATE gf.s_promos SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
