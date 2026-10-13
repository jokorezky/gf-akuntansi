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

const HDR = `
  p.id::int AS id, p.no, to_char(p.tanggal,'YYYY-MM-DD') AS tanggal, p.vendor AS "vendorId", v.nama AS "vendorNama",
  p.gudang, p.pembel_id::int AS "pembelId", p.tot_harga::text AS "totHarga", p.catatan`;

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
    const d = await this.pool.query(
      `SELECT d.stock_id::int AS "stockId", s.nama AS "stockNama", d.satuan_c AS satuan,
              d.jumlah::text AS jumlah, d.harga::text AS harga, d.disc_pers::text AS "discPers", d.catatan
       FROM gf.s_retpbd d LEFT JOIN gf.s_stock s ON s.id=d.stock_id WHERE d.retpem_id=$1 ORDER BY d.sys_id`,
      [id],
    );
    return { ...(h.rows[0] as ReturPembelian), lines: d.rows as ReturLine[] };
  }

  private tot(input: ReturPembelianInput) {
    return input.lines.reduce((s, l) => {
      const g = num(l.jumlah) * num(l.harga);
      return s + g - g * num(l.discPers) / 100;
    }, 0);
  }

  async create(input: ReturPembelianInput, userId = 1): Promise<ReturPembelian> {
    const tot = this.tot(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_retpem (id, no, tanggal, vendor, gudang, pembel_id, tot_harga, catatan, input_oleh, tgl_input, jam_input)
         VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_retpem), $1, COALESCE($2, now()::date), $3, $4, $5, $6, $7, $8, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.no), nn(input.tanggal), input.vendorId, nn(input.gudang), nn(input.pembelId), tot, nn(input.catatan), userId],
      );
      const pid = h.rows[0].id as number;
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO gf.s_retpbd (retpem_id, stock_id, vendor, tanggal, satuan, jumlah, harga, disc_pers, catatan)
           VALUES ($1,$2,$3, COALESCE($4, now()::date), $5,$6,$7,$8,$9)`,
          [pid, l.stockId, input.vendorId, nn(input.tanggal), nn(l.satuan), num(l.jumlah), num(l.harga), num(l.discPers), nn(l.catatan)],
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

  async update(id: number, input: ReturPembelianInput, userId = 1): Promise<ReturPembelian | null> {
    const tot = this.tot(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE gf.s_retpem SET no=$2, tanggal=COALESCE($3, tanggal), vendor=$4, gudang=$5, pembel_id=$6, tot_harga=$7, catatan=$8,
           ubah_oleh=$9, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.no), nn(input.tanggal), input.vendorId, nn(input.gudang), nn(input.pembelId), tot, nn(input.catatan), userId],
      );
      await client.query(`DELETE FROM gf.s_retpbd WHERE retpem_id=$1`, [id]);
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO gf.s_retpbd (retpem_id, stock_id, vendor, tanggal, satuan, jumlah, harga, disc_pers, catatan)
           VALUES ($1,$2,$3, COALESCE($4, now()::date), $5,$6,$7,$8,$9)`,
          [id, l.stockId, input.vendorId, nn(input.tanggal), nn(l.satuan), num(l.jumlah), num(l.harga), num(l.discPers), nn(l.catatan)],
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
      `UPDATE gf.s_retpem SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
