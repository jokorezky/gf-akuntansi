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
  m.divisi_id AS "divisiId", m.catatan,
  (SELECT COALESCE(SUM(l.lunas),0)::text FROM gf.s_lunpem l WHERE l.lpemma_id=m.id) AS total`;

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
      `SELECT l.pembel_id::int AS "pembelId", l.lunas::text AS lunas, l.discount::text AS discount,
              l.denda::text AS denda, l.catatan
       FROM gf.s_lunpem l WHERE l.lpemma_id=$1 ORDER BY l.sys_id`,
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
          `INSERT INTO gf.s_lunpem (lpemma_id, pembel_id, tanggal, lunas, discount, denda, catatan)
           VALUES ($1,$2, COALESCE($3, now()::date), $4, $5, $6, $7)`,
          [pid, nn(l.pembelId), nn(input.tanggal), num(l.lunas), num(l.discount), num(l.denda), nn(l.catatan)],
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
          `INSERT INTO gf.s_lunpem (lpemma_id, pembel_id, tanggal, lunas, discount, denda, catatan)
           VALUES ($1,$2, COALESCE($3, now()::date), $4, $5, $6, $7)`,
          [id, nn(l.pembelId), nn(input.tanggal), num(l.lunas), num(l.discount), num(l.denda), nn(l.catatan)],
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
      COALESCE((SELECT SUM(l.lunas) FROM gf.s_lunpem l WHERE l.pembel_id=p.id),0)::text AS dibayar,
      COALESCE((SELECT SUM(r.tot_harga) FROM gf.s_retpem r WHERE r.pembel_id=p.id AND r.hapus_oleh IS NULL),0)::text AS retur,
      (p.tot_harga + COALESCE(p.ppn_nilai,0)
        - COALESCE((SELECT SUM(l.lunas) FROM gf.s_lunpem l WHERE l.pembel_id=p.id),0)
        - COALESCE((SELECT SUM(r.tot_harga) FROM gf.s_retpem r WHERE r.pembel_id=p.id AND r.hapus_oleh IS NULL),0))::text AS sisa`;
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
