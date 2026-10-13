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
function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

const HDR = `
  j.id::int AS id, COALESCE(j.no_c, j.no::text) AS no, to_char(j.tanggal,'YYYY-MM-DD') AS tanggal,
  j.pelang::int AS "pelangId", p.nama AS "pelangNama", j.gudang, j.salord_id::int AS "salordId", j.po,
  j.sales, j.sales_kom::text AS "salesKom", j.mauang, j.kurs::text AS kurs,
  j.tot_harga::text AS "totHarga", j.tot_disc::text AS "totDisc", j.disc_nilai::text AS "discNilai",
  j.tot_retur::text AS "totRetur",
  j.ppn_tipe AS "ppnTipe", j.ppn_pers::text AS "ppnPers", j.ppn_nilai::text AS "ppnNilai",
  j.adj_01::text AS "adj01", j.adj_02::text AS "adj02", j.adj_03::text AS "adj03",
  j.adj_04::text AS "adj04", j.adj_05::text AS "adj05",
  j.deposit::text AS deposit, j.term_crd AS "termCrd", j.lunas::text AS lunas,
  j.no_pjk AS "noPjk", j.no_pjk_sr AS "noPjkSr", to_char(j.tgl_pajak,'YYYY-MM-DD') AS "tglPajak",
  j.kurs_pajak::text AS "kursPajak", j.catatan`;

const LINE_SEL = `
  SELECT d.stock_id::int AS "stockId", s.nama AS "stockNama", d.satuan_c AS satuan, d.satuan::int AS "satuanId",
         d.jumlah::text AS jumlah, d.bon_jumlah::text AS bonus, d.harga::text AS harga,
         d.disc_pers::text AS "discPers", d.disc_pers2::text AS "discPers2", d.disc_pers3::text AS "discPers3",
         d.disc_nilai::text AS "discNilai",
         round((d.jumlah*d.harga)
               * (1-COALESCE(d.disc_pers,0)/100) * (1-COALESCE(d.disc_pers2,0)/100) * (1-COALESCE(d.disc_pers3,0)/100)
               - COALESCE(d.disc_nilai,0), 2)::text AS nilai,
         to_char(d.expired,'YYYY-MM-DD') AS expired, d.catatan
  FROM gf.s_penjud d LEFT JOIN gf.s_stock s ON s.id=d.stock_id WHERE d.penjua_id=$1 ORDER BY d.sys_id`;

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
    const d = await this.pool.query(LINE_SEL, [id]);
    return { ...(h.rows[0] as Sale), lines: d.rows as SaleLine[] };
  }

  /** Logic GF: nilai baris = (jumlah*harga) berlapis Disc% x3 - Disc nilai; disc header ikut totDisc. */
  private totals(input: SaleInput) {
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

  private async insertLines(client: { query: (q: string, v: unknown[]) => Promise<unknown> }, pid: number, input: SaleInput) {
    for (const l of input.lines) {
      await client.query(
        `INSERT INTO gf.s_penjud (penjua_id, stock_id, pelang, tanggal, satuan, jumlah, bon_jumlah, harga,
            disc_pers, disc_pers2, disc_pers3, disc_nilai, expired, catatan)
         VALUES ($1,$2,$3, COALESCE($4, now()::date), $5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [pid, l.stockId, input.pelangId, nn(input.tanggal), nn(l.satuan), num(l.jumlah), num(l.bonus), num(l.harga),
         num(l.discPers), num(l.discPers2), num(l.discPers3), num(l.discNilai), nn(l.expired), nn(l.catatan)],
      );
    }
  }

  async create(input: SaleInput, userId = 1): Promise<Sale> {
    const t = this.totals(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_penjua
           (id, no, no_c, tanggal, pelang, gudang, salord_id, po, sales, sales_kom, mauang, kurs,
            tot_harga, tot_disc, disc_nilai, tot_retur,
            ppn_tipe, ppn_pers, ppn_nilai, adj_01, adj_02, adj_03, adj_04, adj_05,
            deposit, term_crd, lunas, no_pjk, no_pjk_sr, tgl_pajak, kurs_pajak, catatan,
            input_oleh, tgl_input, jam_input)
         VALUES
           ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_penjua),
            (SELECT COALESCE(MAX(no),0)+1 FROM gf.s_penjua),
            $1, COALESCE($2, now()::date), $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, 0,
            $14, $15, $16, $17, $18, $19, $20, $21,
            $22, $23, $24, $25, $26, $27, $28, $29,
            $30, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.no), nn(input.tanggal), input.pelangId, nn(input.gudang), nn(input.salordId), nn(input.po),
         nn(input.salesId), num(input.salesKom), nn(input.mauang), nn(input.kurs),
         t.totHarga, t.totDisc, num(input.discNilai),
         input.ppnTipe ?? 0, num(input.ppnPers), t.ppnNilai,
         num(input.adj01), num(input.adj02), num(input.adj03), num(input.adj04), num(input.adj05),
         num(input.deposit), nn(input.termCrd), num(input.lunas), nn(input.noPjk), nn(input.noPjkSr),
         nn(input.tglPajak), nn(input.kursPajak), nn(input.catatan), userId],
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

  async update(id: number, input: SaleInput, userId = 1): Promise<Sale | null> {
    const t = this.totals(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE gf.s_penjua SET no_c=$2, tanggal=COALESCE($3, tanggal), pelang=$4, gudang=$5,
           salord_id=$6, po=$7, sales=$8, sales_kom=$9, mauang=$10, kurs=$11,
           tot_harga=$12, tot_disc=$13, disc_nilai=$14,
           ppn_tipe=$15, ppn_pers=$16, ppn_nilai=$17, adj_01=$18, adj_02=$19, adj_03=$20, adj_04=$21, adj_05=$22,
           deposit=$23, term_crd=$24, lunas=$25, no_pjk=$26, no_pjk_sr=$27, tgl_pajak=$28, kurs_pajak=$29, catatan=$30,
           ubah_oleh=$31, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.no), nn(input.tanggal), input.pelangId, nn(input.gudang),
         nn(input.salordId), nn(input.po), nn(input.salesId), num(input.salesKom), nn(input.mauang), nn(input.kurs),
         t.totHarga, t.totDisc, num(input.discNilai),
         input.ppnTipe ?? 0, num(input.ppnPers), t.ppnNilai,
         num(input.adj01), num(input.adj02), num(input.adj03), num(input.adj04), num(input.adj05),
         num(input.deposit), nn(input.termCrd), num(input.lunas), nn(input.noPjk), nn(input.noPjkSr),
         nn(input.tglPajak), nn(input.kursPajak), nn(input.catatan), userId],
      );
      await client.query(`DELETE FROM gf.s_penjud WHERE penjua_id=$1`, [id]);
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
