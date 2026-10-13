import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { Sale, SaleInput, SaleLine, SalePage, KartuPiutangPage } from "./sale.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const HDR = `
  j.id::int AS id, COALESCE(j.no_c, j.no::text) AS no, to_char(j.tanggal,'YYYY-MM-DD') AS tanggal,
  j.pelang::int AS "pelangId", p.nama AS "pelangNama", j.gudang,
  j.tot_harga::text AS "totHarga", j.tot_disc::text AS "totDisc", j.ppn_pers::text AS "ppnPers",
  j.ppn_nilai::text AS "ppnNilai", j.lunas::text AS lunas, j.catatan`;

@Injectable()
export class SaleService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<SalePage> {
    const params: unknown[] = [];
    let where = "WHERE j.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (COALESCE(j.no_c, j.no::text) ILIKE $${params.length} OR p.nama ILIKE $${params.length})`;
    }
    const total = await this.pool.query(
      `SELECT count(*)::int AS n FROM gf.s_penjua j LEFT JOIN gf.s_pelang p ON p.id=j.pelang ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_penjua j LEFT JOIN gf.s_pelang p ON p.id=j.pelang ${where} ORDER BY j.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as Sale[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<Sale | null> {
    const h = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_penjua j LEFT JOIN gf.s_pelang p ON p.id=j.pelang WHERE j.id=$1 AND j.hapus_oleh IS NULL`,
      [id],
    );
    if (!h.rows[0]) return null;
    const d = await this.pool.query(
      `SELECT d.stock_id::int AS "stockId", s.nama AS "stockNama", d.satuan_c AS satuan,
              d.jumlah::text AS jumlah, d.harga::text AS harga, d.disc_pers::text AS "discPers", d.catatan
       FROM gf.s_penjud d LEFT JOIN gf.s_stock s ON s.id=d.stock_id WHERE d.penjua_id=$1 ORDER BY d.sys_id`,
      [id],
    );
    return { ...(h.rows[0] as Sale), lines: d.rows as SaleLine[] };
  }

  private totals(input: SaleInput) {
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

  async create(input: SaleInput, userId = 1): Promise<Sale> {
    const t = this.totals(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_penjua
           (id, no, no_c, tanggal, pelang, gudang, tot_harga, tot_disc, ppn_pers, ppn_nilai, lunas, catatan,
            input_oleh, tgl_input, jam_input)
         VALUES
           ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_penjua),
            (SELECT COALESCE(MAX(no),0)+1 FROM gf.s_penjua),
            $1, COALESCE($2, now()::date), $3, $4, $5, $6, $7, $8, $9, $10,
            $11, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.no), nn(input.tanggal), input.pelangId, nn(input.gudang), t.totHarga, t.totDisc,
         t.ppnPers, t.ppnNilai, num(input.lunas), nn(input.catatan), userId],
      );
      const pid = h.rows[0].id as number;
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO gf.s_penjud (penjua_id, stock_id, pelang, tanggal, satuan, jumlah, harga, disc_pers, catatan)
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

  async update(id: number, input: SaleInput, userId = 1): Promise<Sale | null> {
    const t = this.totals(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE gf.s_penjua SET no_c=$2, tanggal=COALESCE($3, tanggal), pelang=$4, gudang=$5,
           tot_harga=$6, tot_disc=$7, ppn_pers=$8, ppn_nilai=$9, lunas=$10, catatan=$11,
           ubah_oleh=$12, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.no), nn(input.tanggal), input.pelangId, nn(input.gudang), t.totHarga, t.totDisc,
         t.ppnPers, t.ppnNilai, num(input.lunas), nn(input.catatan), userId],
      );
      await client.query(`DELETE FROM gf.s_penjud WHERE penjua_id=$1`, [id]);
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO gf.s_penjud (penjua_id, stock_id, pelang, tanggal, satuan, jumlah, harga, disc_pers, catatan)
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
      `UPDATE gf.s_penjua SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  /** Kartu Piutang (read-only): mutasi per pelanggan = penjualan (DEBET) + penerimaan (KREDIT). */
  async kartuPiutangList(limit = 100, offset = 0, q?: string): Promise<KartuPiutangPage> {
    const params: unknown[] = [];
    let filter = "";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      filter = ` AND p.nama ILIKE $${params.length}`;
    }
    const union = `
      SELECT p.nama AS pelang_nama, j.tanggal, 'PENJUALAN' AS jenis, COALESCE(j.no_c, j.no::text) AS no,
             round(j.tot_harga + COALESCE(j.ppn_nilai,0),2) AS nilai
      FROM gf.s_penjua j LEFT JOIN gf.s_pelang p ON p.id=j.pelang
      WHERE j.hapus_oleh IS NULL${filter}
      UNION ALL
      SELECT p.nama AS pelang_nama, l.tanggal, 'PENERIMAAN' AS jenis, COALESCE(m.no_c, m.no::text) AS no,
             round(l.lunas,2) AS nilai
      FROM gf.s_lunpen l JOIN gf.s_lpenma m ON m.id=l.lpenma_id LEFT JOIN gf.s_pelang p ON p.id=m.pelang
      WHERE m.hapus_oleh IS NULL${filter}`;
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM (${union}) x`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT pelang_nama AS "pelangNama", to_char(tanggal,'YYYY-MM-DD') AS tanggal, jenis, no::text AS no, nilai::text AS nilai
       FROM (${union}) x ORDER BY tanggal DESC, jenis LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as never, total: total.rows[0].n as number };
  }
}
