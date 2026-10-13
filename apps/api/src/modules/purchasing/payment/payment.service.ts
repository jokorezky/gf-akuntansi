import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { PayLine, Payment, PaymentInput, PaymentPage, DaftarHutangPage } from "./payment.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const HDR = `
  m.id::int AS id, m.no, to_char(m.tanggal,'YYYY-MM-DD') AS tanggal, m.vendor AS "vendorId", v.nama AS "vendorNama",
  m.divisi_id AS "divisiId", m.catatan, m.als_batal AS "alsBatal", m.konf_oleh AS "konfOleh",
  to_char(m.konf_tgl,'YYYY-MM-DD') AS "konfTgl", m.konf_jam AS "konfJam",
  m.input_oleh AS "entryBy", to_char(m.tgl_input,'YYYY-MM-DD') AS "entryDate",
  (SELECT COALESCE(SUM(l.lunas),0)::text FROM gf.s_lunpem l WHERE l.lpemma_id=m.id) AS total,
  (SELECT COALESCE(SUM(l.discount),0)::text FROM gf.s_lunpem l WHERE l.lpemma_id=m.id) AS "discTotal"`;

@Injectable()
export class PaymentService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<PaymentPage> {
    const params: unknown[] = [];
    let where = "WHERE m.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (m.no ILIKE $${params.length} OR v.nama ILIKE $${params.length})`;
    }
    const total = await this.pool.query(
      `SELECT count(*)::int AS n FROM gf.s_lpemma m LEFT JOIN gf.s_vendor v ON v.id=m.vendor ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_lpemma m LEFT JOIN gf.s_vendor v ON v.id=m.vendor ${where} ORDER BY m.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as Payment[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<Payment | null> {
    const h = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_lpemma m LEFT JOIN gf.s_vendor v ON v.id=m.vendor WHERE m.id=$1 AND m.hapus_oleh IS NULL`,
      [id],
    );
    if (!h.rows[0]) return null;
    const d = await this.pool.query(
      `SELECT l.pembel_id::int AS "pembelId", l.retpem_id::int AS "retpemId", l.dcnhut_id::int AS "dcnhutId",
              l.deppem_id::int AS "deppemId",
              l.lunas::text AS lunas, l.discount::text AS discount,
              l.denda::text AS denda, l.catatan,
              p.no AS no, to_char(p.tanggal,'YYYY-MM-DD') AS tanggal,
              (SELECT round(COALESCE(pp.tot_harga,0)+COALESCE(pp.ppn_nilai,0),2)::text FROM gf.s_pembel pp WHERE pp.id=l.pembel_id) AS "invTotal"
       FROM gf.s_lunpem l LEFT JOIN gf.s_pembel p ON p.id=l.pembel_id WHERE l.lpemma_id=$1 ORDER BY l.sys_id`,
      [id],
    );
    return { ...(h.rows[0] as Payment), lines: d.rows as PayLine[] };
  }

  async create(input: PaymentInput, userId = 1): Promise<Payment> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_lpemma (id, no, tanggal, vendor, divisi_id, catatan, input_oleh, tgl_input, jam_input)
         VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_lpemma), $1, COALESCE($2, now()::date), $3, $4, $5, $6, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.no), nn(input.tanggal), input.vendorId, nn(input.divisiId), nn(input.catatan), userId],
      );
      const pid = h.rows[0].id as number;
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO gf.s_lunpem (lpemma_id, pembel_id, retpem_id, dcnhut_id, deppem_id, tanggal, lunas, discount, denda, catatan)
           VALUES ($1,$2,$3,$4,$5, COALESCE($6, now()::date), $7, $8, $9, $10)`,
          [pid, nn(l.pembelId), nn(l.retpemId), nn(l.dcnhutId), nn(l.deppemId), nn(input.tanggal),
           num(l.lunas), num(l.discount), num(l.denda), nn(l.catatan)],
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

  async update(id: number, input: PaymentInput, userId = 1): Promise<Payment | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE gf.s_lpemma SET no=$2, tanggal=COALESCE($3, tanggal), vendor=$4, divisi_id=$5, catatan=$6,
           ubah_oleh=$7, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.no), nn(input.tanggal), input.vendorId, nn(input.divisiId), nn(input.catatan), userId],
      );
      await client.query(`DELETE FROM gf.s_lunpem WHERE lpemma_id=$1`, [id]);
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO gf.s_lunpem (lpemma_id, pembel_id, retpem_id, dcnhut_id, deppem_id, tanggal, lunas, discount, denda, catatan)
           VALUES ($1,$2,$3,$4,$5, COALESCE($6, now()::date), $7, $8, $9, $10)`,
          [id, nn(l.pembelId), nn(l.retpemId), nn(l.dcnhutId), nn(l.deppemId), nn(input.tanggal),
           num(l.lunas), num(l.discount), num(l.denda), nn(l.catatan)],
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
      `UPDATE gf.s_lpemma SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  /** Daftar Hutang (read-only): sisa = total pembelian + PPN - dibayar - retur. */
  async daftarHutangList(limit = 100, offset = 0, q?: string): Promise<DaftarHutangPage> {
    const params: unknown[] = [];
    let filter = "";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      filter = ` AND (p.no ILIKE $${params.length} OR v.nama ILIKE $${params.length})`;
    }
    const base = `
      FROM gf.s_pembel p LEFT JOIN gf.s_vendor v ON v.id=p.vendor
      WHERE p.hapus_oleh IS NULL${filter}`;
    const expr = `
      (p.tot_harga + COALESCE(p.ppn_nilai,0))::text AS total,
      COALESCE((SELECT SUM(l.lunas) FROM gf.s_lunpem l JOIN gf.s_lpemma m2 ON m2.id=l.lpemma_id AND COALESCE(m2.hapus_oleh,0)=0 WHERE l.pembel_id=p.id),0)::text AS dibayar,
      COALESCE((SELECT SUM(r.tot_harga) FROM gf.s_retpem r WHERE r.pembel_id=p.id AND r.hapus_oleh IS NULL),0)::text AS retur,
      (p.tot_harga + COALESCE(p.ppn_nilai,0)
        - COALESCE((SELECT SUM(l.lunas) FROM gf.s_lunpem l JOIN gf.s_lpemma m2 ON m2.id=l.lpemma_id AND COALESCE(m2.hapus_oleh,0)=0 WHERE l.pembel_id=p.id),0)
        - COALESCE((SELECT SUM(r.tot_harga) FROM gf.s_retpem r WHERE r.pembel_id=p.id AND r.hapus_oleh IS NULL),0))::text AS sisa,
      p.divisi_id AS "divisiId", p.purcor_id::int AS "purcorId",
      p.tot_harga::text AS "totHarga", p.tot_disc::text AS "totDisc", p.disc_nilai::text AS "adjNilai",
      p.ppn_nilai::text AS "ppnNilai", p.deposit::text AS deposit, p.kurs::text AS kurs, p.term_crd AS "termCrd",
      to_char(p.tanggal + COALESCE(p.term_crd,0),'YYYY-MM-DD') AS "jatuhTempo",
      to_char((SELECT MAX(l.tanggal) FROM gf.s_lunpem l JOIN gf.s_lpemma m2 ON m2.id=l.lpemma_id AND COALESCE(m2.hapus_oleh,0)=0 WHERE l.pembel_id=p.id),'YYYY-MM-DD') AS "lunasOn",
      to_char((SELECT MAX(l.tanggal) FROM gf.s_lunpem l JOIN gf.s_lpemma m2 ON m2.id=l.lpemma_id AND COALESCE(m2.hapus_oleh,0)=0 WHERE l.pembel_id=p.id AND COALESCE(l.discount,0)>0),'YYYY-MM-DD') AS "lunasOnDisc",
      p.konf_oleh AS "konfOleh", p.catatan`;
    const total = await this.pool.query(`SELECT count(*)::int AS n ${base}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT p.id::int AS id, p.no, to_char(p.tanggal,'YYYY-MM-DD') AS tanggal, v.nama AS "vendorNama", ${expr}
       ${base} ORDER BY p.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as never, total: total.rows[0].n as number };
  }
}
