import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { ReturLine, ReturPembelian, ReturPembelianInput, ReturPembelianPage } from "./retur-pembelian.types";

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
  p.id::int AS id, p.no, to_char(p.tanggal,'YYYY-MM-DD') AS tanggal,
  p.vendor AS "vendorId", v.nama AS "vendorNama", p.gudang,
  p.pembel_id::int AS "pembelId", p.pembel_id2::int AS "pembelId2",
  p.no_fakpjk AS "noFakpjk", to_char(p.tgl_fakpjk,'YYYY-MM-DD') AS "tglFakpjk",
  p.mauang, p.kurs::text AS kurs,
  p.tot_harga::text AS "totHarga", p.tot_disc::text AS "totDisc", p.disc_nilai::text AS "discNilai",
  p.ppn_tipe AS "ppnTipe", p.ppn_pers::text AS "ppnPers", p.ppn_nilai::text AS "ppnNilai",
  p.adj_01::text AS "adj01", p.adj_02::text AS "adj02", p.adj_03::text AS "adj03",
  p.adj_04::text AS "adj04", p.adj_05::text AS "adj05",
  p.term_crd AS "termCrd", p.catatan`;

const LINE_SEL = `
  SELECT d.stock_id::int AS "stockId", s.nama AS "stockNama", d.satuan_c AS satuan, d.satuan::int AS "satuanId",
         d.jumlah::text AS jumlah, d.harga::text AS harga,
         d.disc_pers::text AS "discPers", d.disc_pers2::text AS "discPers2", d.disc_pers3::text AS "discPers3",
         d.disc_nilai::text AS "discNilai",
         round((d.jumlah*d.harga)
               * (1-COALESCE(d.disc_pers,0)/100) * (1-COALESCE(d.disc_pers2,0)/100) * (1-COALESCE(d.disc_pers3,0)/100)
               - COALESCE(d.disc_nilai,0), 2)::text AS nilai,
         d.catatan
  FROM gf.s_retpbd d LEFT JOIN gf.s_stock s ON s.id=d.stock_id WHERE d.retpem_id=$1 ORDER BY d.sys_id`;

@Injectable()
export class ReturPembelianService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<ReturPembelianPage> {
    const params: unknown[] = [];
    let where = "WHERE p.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (p.no ILIKE $${params.length} OR v.nama ILIKE $${params.length})`;
    }
    const total = await this.pool.query(
      `SELECT count(*)::int AS n FROM gf.s_retpem p LEFT JOIN gf.s_vendor v ON v.id=p.vendor ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_retpem p LEFT JOIN gf.s_vendor v ON v.id=p.vendor ${where} ORDER BY p.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as ReturPembelian[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<ReturPembelian | null> {
    const h = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_retpem p LEFT JOIN gf.s_vendor v ON v.id=p.vendor WHERE p.id=$1 AND p.hapus_oleh IS NULL`,
      [id],
    );
    if (!h.rows[0]) return null;
    const d = await this.pool.query(LINE_SEL, [id]);
    return { ...(h.rows[0] as ReturPembelian), lines: d.rows as ReturLine[] };
  }

  /** Logic GF: nilai baris berlapis Disc% x3 - Disc nilai; totDisc = baris + header. */
  private totals(input: ReturPembelianInput) {
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

  private async insertLines(client: { query: (q: string, v: unknown[]) => Promise<unknown> }, pid: number, input: ReturPembelianInput) {
    for (const l of input.lines) {
      await client.query(
        `INSERT INTO gf.s_retpbd (retpem_id, stock_id, vendor, tanggal, satuan, jumlah, harga,
            disc_pers, disc_pers2, disc_pers3, disc_nilai, catatan)
         VALUES ($1,$2,$3, COALESCE($4, now()::date), $5,$6,$7,$8,$9,$10,$11,$12)`,
        [pid, l.stockId, input.vendorId, nn(input.tanggal), nn(l.satuan), num(l.jumlah), num(l.harga),
         num(l.discPers), num(l.discPers2), num(l.discPers3), num(l.discNilai), nn(l.catatan)],
      );
    }
  }

  async create(input: ReturPembelianInput, userId = 1): Promise<ReturPembelian> {
    const t = this.totals(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_retpem (id, no, tanggal, vendor, gudang, pembel_id, pembel_id2, no_fakpjk, tgl_fakpjk,
            mauang, kurs, tot_harga, tot_disc, disc_nilai, ppn_tipe, ppn_pers, ppn_nilai,
            adj_01, adj_02, adj_03, adj_04, adj_05, term_crd, catatan,
            input_oleh, tgl_input, jam_input)
         VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_retpem), $1, COALESCE($2, now()::date), $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22, $23,
            $24, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.no), nn(input.tanggal), input.vendorId, nn(input.gudang), nn(input.pembelId), nn(input.pembelId2),
         nn(input.noFakpjk), nn(input.tglFakpjk), nn(input.mauang), nn(input.kurs),
         t.totHarga, t.totDisc, num(input.discNilai), input.ppnTipe ?? 0, num(input.ppnPers), t.ppnNilai,
         num(input.adj01), num(input.adj02), num(input.adj03), num(input.adj04), num(input.adj05),
         nn(input.termCrd), nn(input.catatan), userId],
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

  async update(id: number, input: ReturPembelianInput, userId = 1): Promise<ReturPembelian | null> {
    const t = this.totals(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE gf.s_retpem SET no=$2, tanggal=COALESCE($3, tanggal), vendor=$4, gudang=$5,
           pembel_id=$6, pembel_id2=$7, no_fakpjk=$8, tgl_fakpjk=$9, mauang=$10, kurs=$11,
           tot_harga=$12, tot_disc=$13, disc_nilai=$14, ppn_tipe=$15, ppn_pers=$16, ppn_nilai=$17,
           adj_01=$18, adj_02=$19, adj_03=$20, adj_04=$21, adj_05=$22, term_crd=$23, catatan=$24,
           ubah_oleh=$25, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.no), nn(input.tanggal), input.vendorId, nn(input.gudang),
         nn(input.pembelId), nn(input.pembelId2), nn(input.noFakpjk), nn(input.tglFakpjk),
         nn(input.mauang), nn(input.kurs), t.totHarga, t.totDisc, num(input.discNilai),
         input.ppnTipe ?? 0, num(input.ppnPers), t.ppnNilai,
         num(input.adj01), num(input.adj02), num(input.adj03), num(input.adj04), num(input.adj05),
         nn(input.termCrd), nn(input.catatan), userId],
      );
      await client.query(`DELETE FROM gf.s_retpbd WHERE retpem_id=$1`, [id]);
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
      `UPDATE gf.s_retpem SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
