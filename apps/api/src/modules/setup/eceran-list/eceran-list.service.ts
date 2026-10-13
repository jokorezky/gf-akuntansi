import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { EceranList, EceranListInput, EceranListPage } from "./eceran-list.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Eceran List (24525) -> gf.s_ecrlst baris preset (sts_ecr IS NULL; nota POS memakai sts_ecr terisi). */
const COLS = `
  e.id::int AS id, e.list, e.sts_ecr AS "type", e.grpecr_id AS kelompok, g.nama AS "kelompokNama",
  e.grpec2_id AS kelompok2, e.hitung AS "hitungan", e.harga_jual AS "hargaJual",
  e.stock_id AS "itemId", st.nama AS "itemNama", e.stock_id2 AS "itemExtraId",
  e.mu_h_j_01::text AS "harga1", e.mu_h_j_02::text AS "harga2", e.mu_h_j_03::text AS "harga3",
  e.mu_h_j_04::text AS "harga4", e.mu_h_j_05::text AS "harga5",
  e.pabx_ext AS "pabxExt", e.key_room AS "keyRoom", e.key_lift AS "keyLift", e.def_out AS "defOut",
  e.hide, e.catatan`;

const WHERE = "WHERE e.hapus_oleh IS NULL AND e.sts_ecr IS NULL";

@Injectable()
export class EceranListService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 100, offset = 0, q?: string): Promise<EceranListPage> {
    const params: unknown[] = [];
    let where = WHERE;
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (e.list ILIKE $${params.length} OR COALESCE(st.nama,'') ILIKE $${params.length})`;
    }
    const total = await this.pool.query(
      `SELECT count(*)::int AS n FROM gf.s_ecrlst e LEFT JOIN gf.s_stock st ON st.id=e.stock_id ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${COLS} FROM gf.s_ecrlst e
       LEFT JOIN gf.s_grpecr g ON g.id=e.grpecr_id
       LEFT JOIN gf.s_stock st ON st.id=e.stock_id
       ${where} ORDER BY e.id LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as EceranList[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<EceranList | null> {
    const r = await this.pool.query(
      `SELECT ${COLS} FROM gf.s_ecrlst e
       LEFT JOIN gf.s_grpecr g ON g.id=e.grpecr_id
       LEFT JOIN gf.s_stock st ON st.id=e.stock_id
       WHERE e.id=$1 AND e.hapus_oleh IS NULL AND e.sts_ecr IS NULL`,
      [id],
    );
    return (r.rows[0] as EceranList) ?? null;
  }

  async create(input: EceranListInput, userId = 1): Promise<EceranList> {
    const r = await this.pool.query(
      `INSERT INTO gf.s_ecrlst (id, list, grpecr_id, grpec2_id, hitung, harga_jual, stock_id, stock_id2,
         mu_h_j_01, mu_h_j_02, mu_h_j_03, mu_h_j_04, mu_h_j_05,
         pabx_ext, key_room, key_lift, def_out, hide, catatan, input_oleh, tgl_input, jam_input)
       VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_ecrlst), $1, $2, $3, $4, $5, $6, $7,
         $8::numeric, $9::numeric, $10::numeric, $11::numeric, $12::numeric,
         $13, $14, $15, $16, COALESCE($17,false), $18, $19, now()::date, to_char(now(),'HH24:MI:SS'))
       RETURNING id`,
      [nn(input.list), nn(input.kelompok), nn(input.kelompok2), nn(input.hitungan), nn(input.hargaJual),
       nn(input.itemId), nn(input.itemExtraId),
       num(input.harga1), num(input.harga2), num(input.harga3), num(input.harga4), num(input.harga5),
       nn(input.pabxExt), nn(input.keyRoom), nn(input.keyLift), nn(input.defOut), input.hide ?? false,
       nn(input.catatan), userId],
    );
    return (await this.byId(r.rows[0].id as number))!;
  }

  async update(id: number, input: EceranListInput, userId = 1): Promise<EceranList | null> {
    await this.pool.query(
      `UPDATE gf.s_ecrlst SET list=$2, grpecr_id=$3, grpec2_id=$4, hitung=$5, harga_jual=$6, stock_id=$7, stock_id2=$8,
         mu_h_j_01=$9::numeric, mu_h_j_02=$10::numeric, mu_h_j_03=$11::numeric, mu_h_j_04=$12::numeric, mu_h_j_05=$13::numeric,
         pabx_ext=$14, key_room=$15, key_lift=$16, def_out=$17, hide=COALESCE($18,false), catatan=$19,
         ubah_oleh=$20, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL AND sts_ecr IS NULL`,
      [id, nn(input.list), nn(input.kelompok), nn(input.kelompok2), nn(input.hitungan), nn(input.hargaJual),
       nn(input.itemId), nn(input.itemExtraId),
       num(input.harga1), num(input.harga2), num(input.harga3), num(input.harga4), num(input.harga5),
       nn(input.pabxExt), nn(input.keyRoom), nn(input.keyLift), nn(input.defOut), input.hide ?? false,
       nn(input.catatan), userId],
    );
    return this.byId(id);
  }

  async softDelete(id: number, userId = 1): Promise<boolean> {
    const r = await this.pool.query(
      `UPDATE gf.s_ecrlst SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL AND sts_ecr IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
