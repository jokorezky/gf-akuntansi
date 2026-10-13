import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { Pos, PosInput, PosLine, PosPage } from "./pos.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const HDR = `
  e.id::int AS id, e.list AS no, to_char(e.tanggal,'YYYY-MM-DD') AS tanggal,
  e.pelang AS "pelangId", COALESCE(e.pel_nama, p.nama) AS "pelNama", e.gudang, e.catatan,
  (SELECT round(COALESCE(SUM(d.jumlah*d.harga*(1-COALESCE(d.disc_pers,0)/100)),0),2)::text FROM gf.s_penecr d WHERE d.ecrlst_id=e.id) AS total`;

@Injectable()
export class PosService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<PosPage> {
    const params: unknown[] = [];
    let where = "WHERE e.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (e.list ILIKE $${params.length} OR COALESCE(e.pel_nama, p.nama) ILIKE $${params.length})`;
    }
    const total = await this.pool.query(
      `SELECT count(*)::int AS n FROM gf.s_ecrlst e LEFT JOIN gf.s_pelang p ON p.id=e.pelang ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_ecrlst e LEFT JOIN gf.s_pelang p ON p.id=e.pelang ${where} ORDER BY e.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as Pos[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<Pos | null> {
    const h = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_ecrlst e LEFT JOIN gf.s_pelang p ON p.id=e.pelang WHERE e.id=$1 AND e.hapus_oleh IS NULL`,
      [id],
    );
    if (!h.rows[0]) return null;
    const d = await this.pool.query(
      `SELECT d.stock_id::int AS "stockId", s.nama AS "stockNama", d.satuan_c AS satuan,
              d.jumlah::text AS jumlah, d.harga::text AS harga, d.disc_pers::text AS "discPers", d.catatan
       FROM gf.s_penecr d LEFT JOIN gf.s_stock s ON s.id=d.stock_id WHERE d.ecrlst_id=$1 ORDER BY d.sys_id`,
      [id],
    );
    return { ...(h.rows[0] as Pos), lines: d.rows as PosLine[] };
  }

  private tot(input: PosInput) {
    return input.lines.reduce((s, l) => {
      const g = num(l.jumlah) * num(l.harga);
      return s + g - g * num(l.discPers) / 100;
    }, 0);
  }

  async create(input: PosInput, userId = 1): Promise<Pos> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_ecrlst (id, list, tanggal, pelang, pel_nama, gudang, catatan, input_oleh, tgl_input, jam_input)
         VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_ecrlst), $1, COALESCE($2, now()::date), $3, $4, $5, $6, $7, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.no), nn(input.tanggal), nn(input.pelangId), null, nn(input.gudang), nn(input.catatan), userId],
      );
      const pid = h.rows[0].id as number;
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO gf.s_penecr (ecrlst_id, stock_id, satuan, jumlah, harga, disc_pers, catatan)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [pid, l.stockId, nn(l.satuan), num(l.jumlah), num(l.harga), num(l.discPers), nn(l.catatan)],
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

  async update(id: number, input: PosInput, userId = 1): Promise<Pos | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE gf.s_ecrlst SET list=$2, tanggal=COALESCE($3, tanggal), pelang=$4, gudang=$5, catatan=$6,
           ubah_oleh=$7, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.no), nn(input.tanggal), nn(input.pelangId), nn(input.gudang), nn(input.catatan), userId],
      );
      await client.query(`DELETE FROM gf.s_penecr WHERE ecrlst_id=$1`, [id]);
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO gf.s_penecr (ecrlst_id, stock_id, satuan, jumlah, harga, disc_pers, catatan)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [id, l.stockId, nn(l.satuan), num(l.jumlah), num(l.harga), num(l.discPers), nn(l.catatan)],
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
      `UPDATE gf.s_ecrlst SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
