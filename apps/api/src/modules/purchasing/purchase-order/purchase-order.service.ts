import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { PoLine, PurchaseOrder, PurchaseOrderInput, PurchaseOrderPage } from "./purchase-order.types";

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

/** Nilai baris ala GF: (jumlah*harga) berlapis disc% x3, dikurangi disc nilai. */
function lineNilai(l: { jumlah?: string; harga?: string; discPers?: string; discPers2?: string; discPers3?: string; discNilai?: string }): number {
  const gross = num(l.jumlah) * num(l.harga);
  const net = gross * (1 - num(l.discPers) / 100) * (1 - num(l.discPers2) / 100) * (1 - num(l.discPers3) / 100);
  return r2(net - num(l.discNilai));
}

const HDR = `
  p.id::int AS id, p.po AS no, to_char(p.tanggal,'YYYY-MM-DD') AS tanggal,
  to_char(p.tgl_kirim,'YYYY-MM-DD') AS "tglKirim", to_char(p.tgl_tutup,'YYYY-MM-DD') AS "tglTutup",
  p.divisi_id AS "divisiId", p.jenpem_id AS "jenpemId",
  p.vendor AS "vendorId", v.nama AS "vendorNama", p.mauang,
  p.tot_harga::text AS "totHarga", p.tot_disc::text AS "totDisc", p.disc_nilai::text AS "discNilai",
  p.ppn_tipe AS "ppnTipe", p.ppn_pers::text AS "ppnPers", p.ppn_nilai::text AS "ppnNilai",
  p.term_bayar AS "termBayar", p.prt_t_jml AS "prtTJml", p.prt_harga AS "prtHarga", p.catatan`;

const LINE_SEL = `
  SELECT d.stock_id::int AS "stockId", s.nama AS "stockNama", d.satuan_c AS satuan,
         d.satuan::int AS "satuan", d.jumlah::text AS jumlah, d.harga::text AS harga,
         d.disc_nilai::text AS "discNilai", d.disc_pers::text AS "discPers",
         d.disc_pers2::text AS "discPers2", d.disc_pers3::text AS "discPers3",
         round((d.jumlah*d.harga)
               * (1-COALESCE(d.disc_pers,0)/100) * (1-COALESCE(d.disc_pers2,0)/100) * (1-COALESCE(d.disc_pers3,0)/100)
               - COALESCE(d.disc_nilai,0), 2)::text AS nilai,
         d.catatan
  FROM gf.s_purcod d LEFT JOIN gf.s_stock s ON s.id=d.stock_id WHERE d.purcor_id=$1 ORDER BY d.sys_id`;

@Injectable()
export class PurchaseOrderService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<PurchaseOrderPage> {
    const params: unknown[] = [];
    let where = "WHERE p.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (v.nama ILIKE $${params.length} OR p.po::text ILIKE $${params.length})`;
    }
    const total = await this.pool.query(
      `SELECT count(*)::int AS n FROM gf.s_purcor p LEFT JOIN gf.s_vendor v ON v.id=p.vendor ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_purcor p LEFT JOIN gf.s_vendor v ON v.id=p.vendor ${where} ORDER BY p.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as PurchaseOrder[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<PurchaseOrder | null> {
    const h = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_purcor p LEFT JOIN gf.s_vendor v ON v.id=p.vendor WHERE p.id=$1 AND p.hapus_oleh IS NULL`,
      [id],
    );
    if (!h.rows[0]) return null;
    const d = await this.pool.query(LINE_SEL, [id]);
    return { ...(h.rows[0] as PurchaseOrder), lines: d.rows as PoLine[] };
  }

  /** Total ala GF: gross, discount baris + disc header, total, PPN. */
  private totals(input: PurchaseOrderInput) {
    let gross = 0;
    let disc = 0;
    for (const l of input.lines) {
      const g = num(l.jumlah) * num(l.harga);
      gross += g;
      disc += g - lineNilai(l);
    }
    const totHarga = r2(gross);
    const totDisc = r2(disc + num(input.discNilai));
    const total = r2(totHarga - totDisc);
    const ppnNilai = num(input.ppnPers) > 0 ? r2(total * num(input.ppnPers) / 100) : 0;
    return { totHarga, totDisc, ppnNilai };
  }

  private async insertLines(client: { query: (q: string, v: unknown[]) => Promise<unknown> }, pid: number, input: PurchaseOrderInput) {
    for (const l of input.lines) {
      await client.query(
        `INSERT INTO gf.s_purcod (purcor_id, stock_id, vendor, tanggal, satuan, jumlah, harga,
            disc_nilai, disc_pers, disc_pers2, disc_pers3, catatan)
         VALUES ($1,$2,$3, COALESCE($4, now()::date), $5,$6,$7,$8,$9,$10,$11,$12)`,
        [pid, l.stockId, input.vendorId, nn(input.tanggal), nn(l.satuan), num(l.jumlah), num(l.harga),
         num(l.discNilai), num(l.discPers), num(l.discPers2), num(l.discPers3), nn(l.catatan)],
      );
    }
  }

  async create(input: PurchaseOrderInput, userId = 1): Promise<PurchaseOrder> {
    const t = this.totals(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_purcor (id, po, tanggal, tgl_kirim, divisi_id, jenpem_id, vendor, mauang,
            tot_harga, tot_disc, disc_nilai, ppn_tipe, ppn_pers, ppn_nilai, term_bayar, prt_t_jml, prt_harga,
            catatan, input_oleh, tgl_input, jam_input)
         VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_purcor), $1, COALESCE($2, now()::date), $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17, $18, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.no), nn(input.tanggal), nn(input.tglKirim), nn(input.divisiId), nn(input.jenpemId), input.vendorId,
         nn(input.mauang), t.totHarga, t.totDisc, num(input.discNilai), input.ppnTipe ?? 0, num(input.ppnPers),
         t.ppnNilai, nn(input.termBayar), input.prtTJml ?? false, input.prtHarga ?? false,
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

  async update(id: number, input: PurchaseOrderInput, userId = 1): Promise<PurchaseOrder | null> {
    const t = this.totals(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE gf.s_purcor SET po=$2, tanggal=COALESCE($3, tanggal), tgl_kirim=$4, divisi_id=$5, jenpem_id=$6,
           vendor=$7, mauang=$8, tot_harga=$9, tot_disc=$10, disc_nilai=$11, ppn_tipe=$12, ppn_pers=$13,
           ppn_nilai=$14, term_bayar=$15, prt_t_jml=$16, prt_harga=$17, catatan=$18,
           ubah_oleh=$19, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.no), nn(input.tanggal), nn(input.tglKirim), nn(input.divisiId), nn(input.jenpemId),
         input.vendorId, nn(input.mauang), t.totHarga, t.totDisc, num(input.discNilai), input.ppnTipe ?? 0,
         num(input.ppnPers), t.ppnNilai, nn(input.termBayar), input.prtTJml ?? false, input.prtHarga ?? false,
         nn(input.catatan), userId],
      );
      await client.query(`DELETE FROM gf.s_purcod WHERE purcor_id=$1`, [id]);
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
      `UPDATE gf.s_purcor SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
