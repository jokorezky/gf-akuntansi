import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { GrpPelRef, PromoItemInfo, PromoLevelIn, PromoLevelRow, Promosi, PromosiInput, PromosiPage } from "./promosi.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const COLS = `
  p.id::int AS id, to_char(p.tanggal_1,'YYYY-MM-DD') AS "tanggal1", to_char(p.tanggal_2,'YYYY-MM-DD') AS "tanggal2",
  p.pukul_1 AS "pukul1", p.pukul_2 AS "pukul2", p.hari, p.penj_ecr AS "penjEcr", p.penj_csh AS "penjCsh",
  p.penj_crd AS "penjCrd", p.semua_komp AS "semuaKomp", p.divisi, p.group_pel AS "groupPel", p.group_pe2 AS "groupPe2", p.catatan`;

@Injectable()
export class PromosiService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<PromosiPage> {
    const params: unknown[] = [];
    let where = "WHERE p.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (p.catatan ILIKE $${params.length} OR p.hari ILIKE $${params.length} OR p.divisi ILIKE $${params.length})`;
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
         (id, tanggal_1, tanggal_2, pukul_1, pukul_2, hari, penj_ecr, penj_csh, penj_crd, semua_komp, divisi,
          group_pel, group_pe2, catatan, input_oleh, tgl_input, jam_input)
       VALUES
         ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_promos), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now()::date, to_char(now(),'HH24:MI:SS'))
       RETURNING id`,
      [nn(input.tanggal1), nn(input.tanggal2), nn(input.pukul1), nn(input.pukul2), nn(input.hari),
       input.penjEcr ?? false, input.penjCsh ?? false, input.penjCrd ?? false, input.semuaKomp ?? false,
       nn(input.divisi), nn(input.groupPel), nn(input.groupPe2), nn(input.catatan), userId],
    );
    return (await this.byId(r.rows[0].id as number))!;
  }

  async update(id: number, input: PromosiInput, userId = 1): Promise<Promosi | null> {
    await this.pool.query(
      `UPDATE gf.s_promos SET tanggal_1=$2, tanggal_2=$3, pukul_1=$4, pukul_2=$5, hari=$6,
         penj_ecr=$7, penj_csh=$8, penj_crd=$9, semua_komp=$10, divisi=$11,
         group_pel=$12, group_pe2=$13, catatan=$14,
         ubah_oleh=$15, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, nn(input.tanggal1), nn(input.tanggal2), nn(input.pukul1), nn(input.pukul2), nn(input.hari),
       input.penjEcr ?? false, input.penjCsh ?? false, input.penjCrd ?? false, input.semuaKomp ?? false,
       nn(input.divisi), nn(input.groupPel), nn(input.groupPe2), nn(input.catatan), userId],
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

  /** Info harga master item utk grid 7 baris (Harga Beli + Harga Jual *1..*5). */
  async itemInfo(stockId: number): Promise<PromoItemInfo | null> {
    const r = await this.pool.query(
      `SELECT s.id::int AS "stockId", s.nama, NULL::text AS "satuanC",
              s.harga_beli::text AS "hargaBeli",
              s.harga_j_01::text AS "hargaJ1", s.harga_j_02::text AS "hargaJ2", s.harga_j_03::text AS "hargaJ3",
              s.harga_j_04::text AS "hargaJ4", s.harga_j_05::text AS "hargaJ5",
              s.disc1_j_01::text AS "disc1J1", s.disc2_j_01::text AS "disc2J1", s.disc3_j_01::text AS "disc3J1",
              s.disc1_j_02::text AS "disc1J2", s.disc2_j_02::text AS "disc2J2", s.disc3_j_02::text AS "disc3J2",
              s.disc1_j_03::text AS "disc1J3", s.disc2_j_03::text AS "disc2J3", s.disc3_j_03::text AS "disc3J3",
              s.disc1_j_04::text AS "disc1J4", s.disc2_j_04::text AS "disc2J4", s.disc3_j_04::text AS "disc3J4",
              s.disc1_j_05::text AS "disc1J5", s.disc2_j_05::text AS "disc2J5", s.disc3_j_05::text AS "disc3J5"
       FROM gf.s_stock s WHERE s.id=$1`,
      [stockId],
    );
    return (r.rows[0] as PromoItemInfo) ?? null;
  }

  async levelList(promosId: number): Promise<PromoLevelRow[]> {
    const r = await this.pool.query(
      `SELECT sys_id::int AS "sysId", mauang_id AS "mauangId", harga_dari::text AS "hargaDari",
              harga_sd::text AS "hargaSd", disc_pers::text AS "discPers", disc_nilai::text AS "discNilai"
       FROM gf.s_prome1 WHERE promos_id=$1 AND tgl_hapus IS NULL ORDER BY sys_id`,
      [promosId],
    );
    return r.rows as PromoLevelRow[];
  }

  /**
   * Terapkan promo ke item (tombol Simpan tab Main):
   * - mode 'harga'  -> tulis Harga Jual *1..*5 + Disc1..3 per level ke master s_stock (Setting Harga Jual Spesial)
   * - mode 'disc'/'discnil' -> tulis baris s_prome1 (relasi promos_id) berisi disc per level (Disc % / Disc Rp)
   */
  async terapkanItem(promosId: number, stockId: number, mode: string, levels: PromoLevelIn[], userId = 1): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      if (mode === "harga") {
        for (const l of levels) {
          const n = Math.min(5, Math.max(1, l.level));
          await client.query(
            `UPDATE gf.s_stock SET harga_j_0${n}=COALESCE($2::numeric, harga_j_0${n}),
               disc1_j_0${n}=COALESCE($3::numeric,0), disc2_j_0${n}=COALESCE($4::numeric,0), disc3_j_0${n}=COALESCE($5::numeric,0),
               ubah_oleh=$6, tgl_ubah=now()::date
             WHERE id=$1`,
            [stockId, l.harga ? num(l.harga) : null, num(l.discPers), num(l.discPers2), num(l.discPers3), userId],
          );
        }
      } else {
        await client.query(`UPDATE gf.s_prome1 SET tgl_hapus=now()::date WHERE promos_id=$1 AND tgl_hapus IS NULL`, [promosId]);
        for (const l of levels) {
          await client.query(
            `INSERT INTO gf.s_prome1 (promos_id, mauang_id, harga_dari, harga_sd, disc_pers, disc_nilai)
             VALUES ($1, 1, $2::numeric, $3::numeric, $4::numeric, $5::numeric)`,
            [promosId, num(l.harga), num(l.harga), num(l.discPers), num(l.discPers2 || 0)],
          );
        }
      }
      await client.query("COMMIT");
      return true;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async grppelRef(): Promise<GrpPelRef[]> {
    const r = await this.pool.query(`SELECT id::int AS id, nama FROM gf.s_grppel ORDER BY id`);
    return r.rows as GrpPelRef[];
  }

  async grppe2Ref(): Promise<GrpPelRef[]> {
    const r = await this.pool.query(`SELECT id::int AS id, nama FROM gf.s_grppe2 ORDER BY id`);
    return r.rows as GrpPelRef[];
  }
}
