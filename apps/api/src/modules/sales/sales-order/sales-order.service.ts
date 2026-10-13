import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { SalesOrder, SalesOrderInput, SalesOrderPage, SoLine } from "./sales-order.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const HDR = `
  o.id::int AS id, COALESCE(o.no_c, o.no::text) AS no, to_char(o.tanggal,'YYYY-MM-DD') AS tanggal,
  o.pelang::int AS "pelangId", p.nama AS "pelangNama", o.tot_harga::text AS "totHarga", o.tot_disc::text AS "totDisc",
  o.ppn_pers::text AS "ppnPers", o.ppn_nilai::text AS "ppnNilai", o.catatan`;

@Injectable()
export class SalesOrderService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<SalesOrderPage> {
    const params: unknown[] = [];
    let where = "WHERE o.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (COALESCE(o.no_c, o.no::text) ILIKE $${params.length} OR p.nama ILIKE $${params.length})`;
    }
    const total = await this.pool.query(
      `SELECT count(*)::int AS n FROM gf.s_salord o LEFT JOIN gf.s_pelang p ON p.id=o.pelang ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_salord o LEFT JOIN gf.s_pelang p ON p.id=o.pelang ${where} ORDER BY o.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as SalesOrder[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<SalesOrder | null> {
    const h = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_salord o LEFT JOIN gf.s_pelang p ON p.id=o.pelang WHERE o.id=$1 AND o.hapus_oleh IS NULL`,
      [id],
    );
    if (!h.rows[0]) return null;
    const d = await this.pool.query(
      `SELECT d.stock_id::int AS "stockId", s.nama AS "stockNama", d.satuan_c AS satuan,
              d.jumlah::text AS jumlah, d.harga::text AS harga, d.disc_pers::text AS "discPers", d.catatan
       FROM gf.s_saloex d LEFT JOIN gf.s_stock s ON s.id=d.stock_id WHERE d.salord_id=$1 ORDER BY d.sys_id`,
      [id],
    );
    return { ...(h.rows[0] as SalesOrder), lines: d.rows as SoLine[] };
  }

  private totals(input: SalesOrderInput) {
    let totHarga = 0, totDisc = 0;
    for (const l of input.lines) {
      const g = num(l.jumlah) * num(l.harga);
      const disc = g * num(l.discPers) / 100;
      totHarga += g - disc;
      totDisc += disc;
    }
    const ppnPers = num(input.ppnPers);
    return { totHarga, totDisc, ppnPers, ppnNilai: totHarga * ppnPers / 100 };
  }

  async create(input: SalesOrderInput, userId = 1): Promise<SalesOrder> {
    const t = this.totals(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_salord
           (id, no, no_c, tanggal, pelang, tot_harga, tot_disc, ppn_pers, ppn_nilai, catatan, input_oleh, tgl_input, jam_input)
         VALUES
           ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_salord), (SELECT COALESCE(MAX(no),0)+1 FROM gf.s_salord),
            $1, COALESCE($2, now()::date), $3, $4, $5, $6, $7, $8, $9, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.no), nn(input.tanggal), input.pelangId, t.totHarga, t.totDisc, t.ppnPers, t.ppnNilai, nn(input.catatan), userId],
      );
      const pid = h.rows[0].id as number;
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO gf.s_saloex (salord_id, stock_id, pelang, tanggal, satuan, jumlah, harga, disc_pers, catatan)
           VALUES ($1,$2,$3, COALESCE($4, now()::date), $5,$6,$7,$8,$9)`,
          [pid, l.stockId, input.pelangId, nn(input.tanggal), nn(l.satuan), num(l.jumlah), num(l.harga), num(l.discPers), nn(l.catatan)],
        );
      }
      await client.query("COMMIT");
      return (await this.byId(pid))!;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async update(id: number, input: SalesOrderInput, userId = 1): Promise<SalesOrder | null> {
    const t = this.totals(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE gf.s_salord SET no_c=$2, tanggal=COALESCE($3, tanggal), pelang=$4, tot_harga=$5, tot_disc=$6,
           ppn_pers=$7, ppn_nilai=$8, catatan=$9, ubah_oleh=$10, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.no), nn(input.tanggal), input.pelangId, t.totHarga, t.totDisc, t.ppnPers, t.ppnNilai, nn(input.catatan), userId],
      );
      await client.query(`DELETE FROM gf.s_saloex WHERE salord_id=$1`, [id]);
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO gf.s_saloex (salord_id, stock_id, pelang, tanggal, satuan, jumlah, harga, disc_pers, catatan)
           VALUES ($1,$2,$3, COALESCE($4, now()::date), $5,$6,$7,$8,$9)`,
          [id, l.stockId, input.pelangId, nn(input.tanggal), nn(l.satuan), num(l.jumlah), num(l.harga), num(l.discPers), nn(l.catatan)],
        );
      }
      await client.query("COMMIT");
      return this.byId(id);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async softDelete(id: number, userId = 1): Promise<boolean> {
    const r = await this.pool.query(
      `UPDATE gf.s_salord SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
