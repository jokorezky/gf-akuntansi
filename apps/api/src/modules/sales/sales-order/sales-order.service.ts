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
function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Relasi: salord.penjua_id <-> penjua.salord_id (realisasi S/O -> Penjualan). */
const HDR = `
  o.id::int AS id, COALESCE(o.no_c, o.no::text) AS no, to_char(o.tanggal,'YYYY-MM-DD') AS tanggal,
  to_char(o.tgl_kirim,'YYYY-MM-DD') AS "tglKirim", to_char(o.tgl_tutup,'YYYY-MM-DD') AS "tglTutup",
  o.pelang::int AS "pelangId", p.nama AS "pelangNama", o.po, o.sales AS "salesId", o.jenpen_id AS "jenpemId",
  o.mauang, o.tot_harga::text AS "totHarga", o.tot_disc::text AS "totDisc", o.disc_nilai::text AS "discNilai",
  o.ppn_tipe AS "ppnTipe", o.ppn_pers::text AS "ppnPers", o.ppn_nilai::text AS "ppnNilai",
  (SELECT j.id::int FROM gf.s_penjua j WHERE j.salord_id=o.id AND j.hapus_oleh IS NULL ORDER BY j.id LIMIT 1) AS "penjuaId",
  (SELECT COALESCE(j.no_c, j.no::text) FROM gf.s_penjua j WHERE j.salord_id=o.id AND j.hapus_oleh IS NULL ORDER BY j.id LIMIT 1) AS "penjuaNo",
  o.catatan`;

const LINE_SEL = `
  SELECT d.stock_id::int AS "stockId", s.nama AS "stockNama", d.satuan_c AS satuan, d.satuan::int AS "satuanId",
         d.jumlah::text AS jumlah, d.bon_jumlah::text AS bonus, d.harga::text AS harga,
         d.disc_pers::text AS "discPers", d.disc_pers2::text AS "discPers2", d.disc_pers3::text AS "discPers3",
         d.disc_nilai::text AS "discNilai",
         round((d.jumlah*d.harga)
               * (1-COALESCE(d.disc_pers,0)/100) * (1-COALESCE(d.disc_pers2,0)/100) * (1-COALESCE(d.disc_pers3,0)/100)
               - COALESCE(d.disc_nilai,0), 2)::text AS nilai,
         d.toex_rec AS "toexRec", d.catatan
  FROM gf.s_saloex d LEFT JOIN gf.s_stock s ON s.id=d.stock_id WHERE d.salord_id=$1 ORDER BY d.sys_id`;

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
    const d = await this.pool.query(LINE_SEL, [id]);
    return { ...(h.rows[0] as SalesOrder), lines: d.rows as SoLine[] };
  }

  /** Logic GF: nilai baris berlapis Disc% x3 - Disc nilai; totDisc = baris + header. */
  private totals(input: SalesOrderInput) {
    let gross = 0;
    let disc = 0;
    for (const l of input.lines) {
      const g = num(l.jumlah) * num(l.harga);
      const net = g * (1 - num(l.discPers) / 100) * (1 - num(l.discPers2) / 100) * (1 - num(l.discPers3) / 100);
      gross += g;
      disc += g - (net - num(l.discNilai));
    }
    const totHarga = r2(gross);
    const totDisc = r2(disc + num(input.discNilai));
    const ppnNilai = r2((totHarga - totDisc) * num(input.ppnPers) / 100);
    return { totHarga, totDisc, ppnNilai };
  }

  private async insertLines(client: { query: (q: string, v: unknown[]) => Promise<unknown> }, pid: number, input: SalesOrderInput) {
    for (const l of input.lines) {
      await client.query(
        `INSERT INTO gf.s_saloex (salord_id, stock_id, pelang, tanggal, satuan, jumlah, bon_jumlah, harga,
            disc_pers, disc_pers2, disc_pers3, disc_nilai, catatan)
         VALUES ($1,$2,$3, COALESCE($4, now()::date), $5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [pid, l.stockId, input.pelangId, nn(input.tanggal), nn(l.satuan), num(l.jumlah), num(l.bonus), num(l.harga),
         num(l.discPers), num(l.discPers2), num(l.discPers3), num(l.discNilai), nn(l.catatan)],
      );
    }
  }

  async create(input: SalesOrderInput, userId = 1): Promise<SalesOrder> {
    const t = this.totals(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_salord
           (id, no, no_c, tanggal, tgl_kirim, tgl_tutup, pelang, po, sales, jenpen_id, mauang,
            tot_harga, tot_disc, disc_nilai, ppn_tipe, ppn_pers, ppn_nilai, catatan,
            input_oleh, tgl_input, jam_input)
         VALUES
           ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_salord), (SELECT COALESCE(MAX(no),0)+1 FROM gf.s_salord),
            $1, COALESCE($2, now()::date), $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14, $15, $16,
            $17, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.no), nn(input.tanggal), nn(input.tglKirim), nn(input.tglTutup), input.pelangId, nn(input.po),
         nn(input.salesId), nn(input.jenpemId), nn(input.mauang),
         t.totHarga, t.totDisc, num(input.discNilai), input.ppnTipe ?? 0, num(input.ppnPers), t.ppnNilai,
         nn(input.catatan), userId],
      );
      const pid = h.rows[0].id as number;
      await this.insertLines(client, pid, input);
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
        `UPDATE gf.s_salord SET no_c=$2, tanggal=COALESCE($3, tanggal), tgl_kirim=$4, tgl_tutup=$5, pelang=$6,
           po=$7, sales=$8, jenpen_id=$9, mauang=$10, tot_harga=$11, tot_disc=$12, disc_nilai=$13,
           ppn_tipe=$14, ppn_pers=$15, ppn_nilai=$16, catatan=$17,
           ubah_oleh=$18, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.no), nn(input.tanggal), nn(input.tglKirim), nn(input.tglTutup), input.pelangId,
         nn(input.po), nn(input.salesId), nn(input.jenpemId), nn(input.mauang),
         t.totHarga, t.totDisc, num(input.discNilai), input.ppnTipe ?? 0, num(input.ppnPers), t.ppnNilai,
         nn(input.catatan), userId],
      );
      await client.query(`DELETE FROM gf.s_saloex WHERE salord_id=$1`, [id]);
      await this.insertLines(client, id, input);
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
