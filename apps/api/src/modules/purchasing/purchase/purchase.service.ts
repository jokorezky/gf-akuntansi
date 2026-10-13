import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { Purchase, PurchaseInput, PurchaseLine, PurchasePage, KartuHutangPage } from "./purchase.types";

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

const HDR = `
  p.id::int AS id, p.no, to_char(p.tanggal,'YYYY-MM-DD') AS tanggal, to_char(p.tanggal2,'YYYY-MM-DD') AS tanggal2,
  p.vendor AS "vendorId", v.nama AS "vendorNama",
  p.gudang, p.purcor_id AS "purcorId", p.no_fakpjk AS "noFakpjk", to_char(p.tgl_fakpjk,'YYYY-MM-DD') AS "tglFakpjk",
  p.mauang, p.kurs::text AS kurs,
  p.tot_harga::text AS "totHarga", p.tot_disc::text AS "totDisc", p.disc_nilai::text AS "discNilai",
  p.tot_retur::text AS "totRetur",
  p.adj_01::text AS "adj01", p.adj_02::text AS "adj02", p.adj_03::text AS "adj03",
  p.adj_04::text AS "adj04", p.adj_05::text AS "adj05",
  p.ppn_tipe AS "ppnTipe", p.ppn_pers::text AS "ppnPers",
  p.ppn_nilai::text AS "ppnNilai", p.deposit::text AS "deposit", p.term_crd AS "termCrd", p.catatan`;

@Injectable()
export class PurchaseService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<PurchasePage> {
    const params: unknown[] = [];
    let where = "WHERE p.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (p.no ILIKE $${params.length} OR v.nama ILIKE $${params.length})`;
    }
    const total = await this.pool.query(
      `SELECT count(*)::int AS n FROM gf.s_pembel p LEFT JOIN gf.s_vendor v ON v.id=p.vendor ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_pembel p LEFT JOIN gf.s_vendor v ON v.id=p.vendor ${where} ORDER BY p.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as Purchase[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<Purchase | null> {
    const h = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_pembel p LEFT JOIN gf.s_vendor v ON v.id=p.vendor WHERE p.id=$1 AND p.hapus_oleh IS NULL`,
      [id],
    );
    if (!h.rows[0]) return null;
    const d = await this.pool.query(
      `SELECT d.stock_id::int AS "stockId", s.nama AS "stockNama", d.satuan_c AS satuan, d.satuan::int AS "satuanId",
              d.jumlah::text AS jumlah, d.harga::text AS harga,
              d.disc_pers::text AS "discPers", d.disc_pers2::text AS "discPers2", d.disc_pers3::text AS "discPers3",
              d.disc_nilai::text AS "discNilai",
              round((d.jumlah*d.harga)
                    * (1-COALESCE(d.disc_pers,0)/100) * (1-COALESCE(d.disc_pers2,0)/100) * (1-COALESCE(d.disc_pers3,0)/100)
                    - COALESCE(d.disc_nilai,0), 2)::text AS nilai,
              to_char(d.expired,'YYYY-MM-DD') AS expired, d.catatan
       FROM gf.s_pembed d LEFT JOIN gf.s_stock s ON s.id=d.stock_id WHERE d.pembel_id=$1 ORDER BY d.sys_id`,
      [id],
    );
    return { ...(h.rows[0] as Purchase), lines: d.rows as PurchaseLine[] };
  }

  /** Logic GF: nilai baris = (jumlah*harga) berlapis Disc% x3 - Disc nilai; disc header ikut totDisc. */
  private totals(input: PurchaseInput) {
    let gross = 0;
    let disc = 0;
    for (const l of input.lines) {
      const g = num(l.jumlah) * num(l.harga);
      const net = g * (1 - num(l.discPers) / 100) * (1 - num(l.discPers2) / 100) * (1 - num(l.discPers3) / 100);
      const nilai = net - num(l.discNilai);
      gross += g;
      disc += g - nilai;
    }
    const totHarga = r2(gross);
    const totDisc = r2(disc + num(input.discNilai));
    const ppnPers = num(input.ppnPers);
    const ppnNilai = r2((totHarga - totDisc) * ppnPers / 100);
    return { totHarga, totDisc, ppnPers, ppnNilai };
  }

  async create(input: PurchaseInput, userId = 1): Promise<Purchase> {
    const t = this.totals(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_pembel
           (id, no, tanggal, tanggal2, vendor, gudang, purcor_id, no_fakpjk, tgl_fakpjk, mauang, kurs,
            tot_harga, tot_disc, disc_nilai, adj_01, adj_02, adj_03, adj_04, adj_05,
            ppn_tipe, ppn_pers, ppn_nilai, deposit, term_crd, catatan,
            input_oleh, tgl_input, jam_input)
         VALUES
           ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_pembel), $1, COALESCE($2, now()::date), $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18,
            $19, $20, $21, $22, $23, $24,
            $25, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.no), nn(input.tanggal), nn(input.tanggal2), input.vendorId, nn(input.gudang), nn(input.purcorId),
         nn(input.noFakpjk), nn(input.tglFakpjk), nn(input.mauang), nn(input.kurs),
         t.totHarga, t.totDisc, num(input.discNilai),
         num(input.adj01), num(input.adj02), num(input.adj03), num(input.adj04), num(input.adj05),
         input.ppnTipe ?? 0, t.ppnPers, t.ppnNilai, num(input.deposit), nn(input.termCrd), nn(input.catatan), userId],
      );
      const pid = h.rows[0].id as number;
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO gf.s_pembed (pembel_id, stock_id, vendor, tanggal, satuan, jumlah, harga,
              disc_pers, disc_pers2, disc_pers3, disc_nilai, expired, catatan)
           VALUES ($1,$2,$3, COALESCE($4, now()::date), $5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [pid, l.stockId, input.vendorId, nn(input.tanggal), nn(l.satuan), num(l.jumlah), num(l.harga),
           num(l.discPers), num(l.discPers2), num(l.discPers3), num(l.discNilai), nn(l.expired), nn(l.catatan)],
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

  async update(id: number, input: PurchaseInput, userId = 1): Promise<Purchase | null> {
    const t = this.totals(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE gf.s_pembel SET no=$2, tanggal=COALESCE($3, tanggal), tanggal2=$4, vendor=$5, gudang=$6,
           purcor_id=$7, no_fakpjk=$8, tgl_fakpjk=$9, mauang=$10, kurs=$11,
           tot_harga=$12, tot_disc=$13, disc_nilai=$14, adj_01=$15, adj_02=$16, adj_03=$17, adj_04=$18, adj_05=$19,
           ppn_tipe=$20, ppn_pers=$21, ppn_nilai=$22, deposit=$23, term_crd=$24, catatan=$25,
           ubah_oleh=$26, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.no), nn(input.tanggal), nn(input.tanggal2), input.vendorId, nn(input.gudang),
         nn(input.purcorId), nn(input.noFakpjk), nn(input.tglFakpjk), nn(input.mauang), nn(input.kurs),
         t.totHarga, t.totDisc, num(input.discNilai),
         num(input.adj01), num(input.adj02), num(input.adj03), num(input.adj04), num(input.adj05),
         input.ppnTipe ?? 0, t.ppnPers, t.ppnNilai, num(input.deposit), nn(input.termCrd), nn(input.catatan), userId],
      );
      await client.query(`DELETE FROM gf.s_pembed WHERE pembel_id=$1`, [id]);
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO gf.s_pembed (pembel_id, stock_id, vendor, tanggal, satuan, jumlah, harga,
              disc_pers, disc_pers2, disc_pers3, disc_nilai, expired, catatan)
           VALUES ($1,$2,$3, COALESCE($4, now()::date), $5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [id, l.stockId, input.vendorId, nn(input.tanggal), nn(l.satuan), num(l.jumlah), num(l.harga),
           num(l.discPers), num(l.discPers2), num(l.discPers3), num(l.discNilai), nn(l.expired), nn(l.catatan)],
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
      `UPDATE gf.s_pembel SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  /** Kartu Hutang (read-only): mutasi per vendor = pembelian (DEBET) + pembayaran (KREDIT). */
  async kartuHutangList(limit = 100, offset = 0, q?: string): Promise<KartuHutangPage> {
    const params: unknown[] = [];
    let filter = "";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      filter = ` AND v.nama ILIKE $${params.length}`;
    }
    const union = `
      SELECT v.nama AS vendor_nama, p.tanggal, 'PEMBELIAN' AS jenis, p.no AS no,
             round(p.tot_harga + COALESCE(p.ppn_nilai,0),2) AS nilai
      FROM gf.s_pembel p LEFT JOIN gf.s_vendor v ON v.id=p.vendor
      WHERE p.hapus_oleh IS NULL${filter}
      UNION ALL
      SELECT v.nama AS vendor_nama, l.tanggal, 'PEMBAYARAN' AS jenis, m.no::text AS no,
             round(l.lunas,2) AS nilai
      FROM gf.s_lunpem l JOIN gf.s_lpemma m ON m.id=l.lpemma_id LEFT JOIN gf.s_vendor v ON v.id=m.vendor
      WHERE m.hapus_oleh IS NULL${filter}`;
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM (${union}) x`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT vendor_nama AS "vendorNama", to_char(tanggal,'YYYY-MM-DD') AS tanggal, jenis, no::text AS no, nilai::text AS nilai
       FROM (${union}) x ORDER BY tanggal DESC, jenis LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as never, total: total.rows[0].n as number };
  }
}
