import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { Receipt, ReceiptInput, ReceiptLine, ReceiptPage } from "./receipt.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const HDR = `
  m.id::int AS id, COALESCE(m.no_c, m.no::text) AS no, to_char(m.tanggal,'YYYY-MM-DD') AS tanggal,
  m.pelang::int AS "pelangId", p.nama AS "pelangNama", m.divisi_id AS "divisiId", m.catatan,
  (SELECT COALESCE(SUM(l.lunas),0)::text FROM gf.s_lunpen l WHERE l.lpenma_id=m.id) AS total`;

@Injectable()
export class ReceiptService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<ReceiptPage> {
    const params: unknown[] = [];
    let where = "WHERE m.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (COALESCE(m.no_c, m.no::text) ILIKE $${params.length} OR p.nama ILIKE $${params.length})`;
    }
    const total = await this.pool.query(
      `SELECT count(*)::int AS n FROM gf.s_lpenma m LEFT JOIN gf.s_pelang p ON p.id=m.pelang ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_lpenma m LEFT JOIN gf.s_pelang p ON p.id=m.pelang ${where} ORDER BY m.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as Receipt[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<Receipt | null> {
    const h = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_lpenma m LEFT JOIN gf.s_pelang p ON p.id=m.pelang WHERE m.id=$1 AND m.hapus_oleh IS NULL`,
      [id],
    );
    if (!h.rows[0]) return null;
    const d = await this.pool.query(
      `SELECT l.penjua_id::int AS "penjuaId", l.lunas::text AS lunas, l.discount::text AS discount,
              l.denda::text AS denda, l.catatan
       FROM gf.s_lunpen l WHERE l.lpenma_id=$1 ORDER BY l.sys_id`,
      [id],
    );
    return { ...(h.rows[0] as Receipt), lines: d.rows as ReceiptLine[] };
  }

  async create(input: ReceiptInput, userId = 1): Promise<Receipt> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_lpenma (id, no, no_c, tanggal, pelang, divisi_id, catatan, input_oleh, tgl_input, jam_input)
         VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_lpenma), (SELECT COALESCE(MAX(no),0)+1 FROM gf.s_lpenma),
          $1, COALESCE($2, now()::date), $3, $4, $5, $6, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.no), nn(input.tanggal), input.pelangId, nn(input.divisiId), nn(input.catatan), userId],
      );
      const pid = h.rows[0].id as number;
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO gf.s_lunpen (lpenma_id, penjua_id, tanggal, lunas, discount, denda, catatan)
           VALUES ($1,$2, COALESCE($3, now()::date), $4, $5, $6, $7)`,
          [pid, nn(l.penjuaId), nn(input.tanggal), num(l.lunas), num(l.discount), num(l.denda), nn(l.catatan)],
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

  async update(id: number, input: ReceiptInput, userId = 1): Promise<Receipt | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE gf.s_lpenma SET no_c=$2, tanggal=COALESCE($3, tanggal), pelang=$4, divisi_id=$5, catatan=$6,
           ubah_oleh=$7, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.no), nn(input.tanggal), input.pelangId, nn(input.divisiId), nn(input.catatan), userId],
      );
      await client.query(`DELETE FROM gf.s_lunpen WHERE lpenma_id=$1`, [id]);
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO gf.s_lunpen (lpenma_id, penjua_id, tanggal, lunas, discount, denda, catatan)
           VALUES ($1,$2, COALESCE($3, now()::date), $4, $5, $6, $7)`,
          [id, nn(l.penjuaId), nn(input.tanggal), num(l.lunas), num(l.discount), num(l.denda), nn(l.catatan)],
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
      `UPDATE gf.s_lpenma SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  /** Daftar Piutang (read-only): sisa = total penjualan + PPN - diterima - retur. */
  async daftarPiutangList(limit = 100, offset = 0, q?: string) {
    const params: unknown[] = [];
    let filter = "";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      filter = ` AND (COALESCE(j.no_c, j.no::text) ILIKE $${params.length} OR p.nama ILIKE $${params.length})`;
    }
    const base = `FROM gf.s_penjua j LEFT JOIN gf.s_pelang p ON p.id=j.pelang WHERE j.hapus_oleh IS NULL${filter}`;
    const expr = `
      (j.tot_harga + COALESCE(j.ppn_nilai,0))::text AS total,
      COALESCE((SELECT SUM(l.lunas) FROM gf.s_lunpen l WHERE l.penjua_id=j.id),0)::text AS dibayar,
      COALESCE((SELECT SUM(r.tot_harga) FROM gf.s_retpen r WHERE r.penjua_id=j.id AND r.hapus_oleh IS NULL),0)::text AS retur,
      (j.tot_harga + COALESCE(j.ppn_nilai,0)
        - COALESCE((SELECT SUM(l.lunas) FROM gf.s_lunpen l WHERE l.penjua_id=j.id),0)
        - COALESCE((SELECT SUM(r.tot_harga) FROM gf.s_retpen r WHERE r.penjua_id=j.id AND r.hapus_oleh IS NULL),0))::text AS sisa`;
    const total = await this.pool.query(`SELECT count(*)::int AS n ${base}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT j.id::int AS id, COALESCE(j.no_c, j.no::text) AS no, to_char(j.tanggal,'YYYY-MM-DD') AS tanggal,
              p.nama AS "pelangNama", ${expr}
       ${base} ORDER BY j.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as never, total: total.rows[0].n as number };
  }
}
