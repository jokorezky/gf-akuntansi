import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { TipePembayaran, TipePembayaranInput, TipePembayaranPage } from "./tipe-pembayaran.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Tipe Pembayaran (24524) -> gf.s_luntip (POS: charges, disc global, kas perkiraan, QRIS/GF-Pay). */
const COLS = `
  t.id::int AS id, t.lunas_tipe AS tipe, t.hide, t.gfpayment, t.show_qris AS "showQris",
  t.perkir_id AS "perkirId", p.nama AS "perkirNama",
  t.chargestxt, t.charges::text AS charges, t.chargesnil::text AS chargesnil,
  t.chargescd1::text AS chargescd1, t.chargescd2::text AS chargescd2, t.chargesitm, t.no_round AS "noRound",
  t.adjust AS adjust, t.glb_discs AS "glbDiscs", t.glb_disc::text AS "glbDisc",
  t.glb_discnl::text AS "glbDiscnl", t.glb_disccd::text AS "glbDisccd", t.cost::text AS cost,
  t.perkir_id2 AS "perkirId2"`;

@Injectable()
export class TipePembayaranService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 100, offset = 0, q?: string): Promise<TipePembayaranPage> {
    const params: unknown[] = [];
    let where = "WHERE t.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND t.lunas_tipe ILIKE $${params.length}`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_luntip t ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${COLS} FROM gf.s_luntip t LEFT JOIN gf.s_perkir p ON p.id=t.perkir_id ${where} ORDER BY t.id LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as TipePembayaran[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<TipePembayaran | null> {
    const r = await this.pool.query(
      `SELECT ${COLS} FROM gf.s_luntip t LEFT JOIN gf.s_perkir p ON p.id=t.perkir_id WHERE t.id=$1 AND t.hapus_oleh IS NULL`,
      [id],
    );
    return (r.rows[0] as TipePembayaran) ?? null;
  }

  async create(input: TipePembayaranInput, userId = 1): Promise<TipePembayaran> {
    const r = await this.pool.query(
      `INSERT INTO gf.s_luntip (id, lunas_tipe, hide, gfpayment, show_qris, perkir_id, chargestxt,
         charges, chargesnil, chargescd1, chargescd2, chargesitm, no_round, adjust,
         glb_discs, glb_disc, glb_discnl, glb_disccd, cost, perkir_id2, input_oleh, tgl_input, jam_input)
       VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_luntip), $1, COALESCE($2,false), COALESCE($3,false), COALESCE($4,false),
         $5, $6, COALESCE($7::numeric,0), COALESCE($8::numeric,0), COALESCE($9::numeric,0), COALESCE($10::numeric,0),
         COALESCE($11,false), COALESCE($12,false), COALESCE($13,0),
         COALESCE($14,false), COALESCE($15::numeric,0), COALESCE($16::numeric,0), COALESCE($17::numeric,0),
         COALESCE($18::numeric,0), $19, $20, now()::date, to_char(now(),'HH24:MI:SS'))
       RETURNING id`,
      [nn(input.tipe), input.hide ?? false, input.gfpayment ?? false, input.showQris ?? false,
       nn(input.perkirId), nn(input.chargestxt), num(input.charges), num(input.chargesnil),
       num(input.chargescd1), num(input.chargescd2), input.chargesitm ?? false, input.noRound ?? false,
       Math.round(num(input.adjust)), input.glbDiscs ?? false, num(input.glbDisc), num(input.glbDiscnl), num(input.glbDisccd),
       num(input.cost), nn(input.perkirId2), userId],
    );
    return (await this.byId(r.rows[0].id as number))!;
  }

  async update(id: number, input: TipePembayaranInput, userId = 1): Promise<TipePembayaran | null> {
    await this.pool.query(
      `UPDATE gf.s_luntip SET lunas_tipe=$2, hide=COALESCE($3,false), gfpayment=COALESCE($4,false), show_qris=COALESCE($5,false),
         perkir_id=$6, chargestxt=$7, charges=COALESCE($8::numeric,0), chargesnil=COALESCE($9::numeric,0),
         chargescd1=COALESCE($10::numeric,0), chargescd2=COALESCE($11::numeric,0),
         chargesitm=COALESCE($12,false), no_round=COALESCE($13,false), adjust=COALESCE($14,0),
         glb_discs=COALESCE($15,false), glb_disc=COALESCE($16::numeric,0), glb_discnl=COALESCE($17::numeric,0),
         glb_disccd=COALESCE($18::numeric,0), cost=COALESCE($19::numeric,0), perkir_id2=$20,
         ubah_oleh=$21, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, nn(input.tipe), input.hide ?? false, input.gfpayment ?? false, input.showQris ?? false,
       nn(input.perkirId), nn(input.chargestxt), num(input.charges), num(input.chargesnil),
       num(input.chargescd1), num(input.chargescd2), input.chargesitm ?? false, input.noRound ?? false,
       Math.round(num(input.adjust)), input.glbDiscs ?? false, num(input.glbDisc), num(input.glbDiscnl), num(input.glbDisccd),
       num(input.cost), nn(input.perkirId2), userId],
    );
    return this.byId(id);
  }

  async softDelete(id: number, userId = 1): Promise<boolean> {
    const r = await this.pool.query(
      `UPDATE gf.s_luntip SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
