import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { BarangKeluarInput, BarangLine, BarangMasukInput, BarangExpiredPage, KartuStockPage } from "./barang.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

type Cfg = { m: string; d: string; fk: string };
const MASUK: Cfg = { m: "gf.s_stkmas", d: "gf.s_stkmex", fk: "stkmas_id" };
const KELUAR: Cfg = { m: "gf.s_stkklr", d: "gf.s_stkkex", fk: "stkklr_id" };

type LineIn = { stockId: number; jumlah?: string; satuan?: number; hpp?: string; catatan?: string };
type DocIn = { no?: string; tanggal?: string; divisiId?: number; gudang?: number; perkirId?: number; grpsmkId?: number; catatan?: string; lines: LineIn[] };

const JOIN_AUX = `LEFT JOIN gf.s_grpsmk g ON g.id=k.grpsmk_id LEFT JOIN gf.s_perkir p2 ON p2.id=k.perkir_id`;

@Injectable()
export class BarangService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private async listOf(t: Cfg, limit: number, offset: number, q?: string) {
    const params: unknown[] = [];
    let where = "WHERE k.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (k.no::text ILIKE $${params.length} OR k.catatan ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM ${t.m} k ${where}`, params);
    params.push(limit, offset);
    const hdr = `k.id::int AS id, k.no::text AS no, to_char(k.tanggal,'YYYY-MM-DD') AS tanggal, k.divisi_id AS "divisiId",
      k.gudang, k.perkir_id AS "perkirId", p2.nama AS "perkirNama", k.grpsmk_id AS "grpsmkId", g.nama AS "grpsmkNama", k.catatan,
      (SELECT round(COALESCE(SUM(d.jumlah),0),2)::text FROM ${t.d} d WHERE d.${t.fk}=k.id) AS "totalQty",
      (SELECT round(COALESCE(SUM(d.jumlah*COALESCE(d.hpp,0)),0),2)::text FROM ${t.d} d WHERE d.${t.fk}=k.id) AS "totalHpp"`;
    const rows = await this.pool.query(
      `SELECT ${hdr} FROM ${t.m} k ${JOIN_AUX} ${where} ORDER BY k.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows, total: total.rows[0].n as number };
  }

  private async byIdOf(t: Cfg, id: number) {
    const hdr = `k.id::int AS id, k.no::text AS no, to_char(k.tanggal,'YYYY-MM-DD') AS tanggal, k.divisi_id AS "divisiId",
      k.gudang, k.perkir_id AS "perkirId", p2.nama AS "perkirNama", k.grpsmk_id AS "grpsmkId", g.nama AS "grpsmkNama", k.catatan,
      (SELECT round(COALESCE(SUM(d.jumlah),0),2)::text FROM ${t.d} d WHERE d.${t.fk}=k.id) AS "totalQty",
      (SELECT round(COALESCE(SUM(d.jumlah*COALESCE(d.hpp,0)),0),2)::text FROM ${t.d} d WHERE d.${t.fk}=k.id) AS "totalHpp"`;
    const h = await this.pool.query(`SELECT ${hdr} FROM ${t.m} k ${JOIN_AUX} WHERE k.id=$1 AND k.hapus_oleh IS NULL`, [id]);
    if (!h.rows[0]) return null;
    const d = await this.pool.query(
      `SELECT d.stock_id::int AS "stockId", s.nama AS "stockNama", d.satuan::text AS satuan,
              d.jumlah::text AS jumlah, d.hpp::text AS hpp, d.catatan
       FROM ${t.d} d LEFT JOIN gf.s_stock s ON s.id=d.stock_id WHERE d.${t.fk}=$1 ORDER BY d.sys_id`,
      [id],
    );
    return { ...h.rows[0], lines: d.rows as BarangLine[] };
  }

  private async createOf(t: Cfg, input: DocIn, userId: number) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO ${t.m} (id, no, tanggal, divisi_id, gudang, perkir_id, grpsmk_id, catatan, input_oleh, tgl_input, jam_input)
         VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM ${t.m}), (SELECT COALESCE(MAX(no),0)+1 FROM ${t.m}),
          COALESCE($1, now()::date), $2, $3, $4, $5, $6, $7, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.tanggal), nn(input.divisiId), nn(input.gudang), nn(input.perkirId), nn(input.grpsmkId), nn(input.catatan), userId],
      );
      const pid = h.rows[0].id as number;
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO ${t.d} (${t.fk}, stock_id, satuan, jumlah, hpp, catatan, tanggal) VALUES ($1,$2,$3,$4,$5,$6, COALESCE($7, now()::date))`,
          [pid, l.stockId, nn(l.satuan), num(l.jumlah), num(l.hpp), nn(l.catatan), nn(input.tanggal)],
        );
      }
      await client.query("COMMIT");
      return (await this.byIdOf(t, pid))!;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  private async updateOf(t: Cfg, id: number, input: DocIn, userId: number) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE ${t.m} SET tanggal=COALESCE($2, tanggal), divisi_id=$3, gudang=$4, perkir_id=$5, grpsmk_id=$6, catatan=$7,
           ubah_oleh=$8, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.tanggal), nn(input.divisiId), nn(input.gudang), nn(input.perkirId), nn(input.grpsmkId), nn(input.catatan), userId],
      );
      await client.query(`DELETE FROM ${t.d} WHERE ${t.fk}=$1`, [id]);
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO ${t.d} (${t.fk}, stock_id, satuan, jumlah, hpp, catatan, tanggal) VALUES ($1,$2,$3,$4,$5,$6, COALESCE($7, now()::date))`,
          [id, l.stockId, nn(l.satuan), num(l.jumlah), num(l.hpp), nn(l.catatan), nn(input.tanggal)],
        );
      }
      await client.query("COMMIT");
      return this.byIdOf(t, id);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  private async softDel(t: Cfg, id: number, userId: number) {
    const r = await this.pool.query(
      `UPDATE ${t.m} SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  listMasuk(limit = 50, offset = 0, q?: string) { return this.listOf(MASUK, limit, offset, q); }
  byIdMasuk(id: number) { return this.byIdOf(MASUK, id); }
  createMasuk(input: BarangMasukInput) { return this.createOf(MASUK, input, 1); }
  updateMasuk(id: number, input: BarangMasukInput) { return this.updateOf(MASUK, id, input, 1); }
  deleteMasuk(id: number) { return this.softDel(MASUK, id, 1); }

  listKeluar(limit = 50, offset = 0, q?: string) { return this.listOf(KELUAR, limit, offset, q); }
  byIdKeluar(id: number) { return this.byIdOf(KELUAR, id); }
  createKeluar(input: BarangKeluarInput) { return this.createOf(KELUAR, input, 1); }
  updateKeluar(id: number, input: BarangKeluarInput) { return this.updateOf(KELUAR, id, input, 1); }
  deleteKeluar(id: number) { return this.softDel(KELUAR, id, 1); }

  /** Grup Masuk/Keluar (Grouping) — s_grpsmk. */
  async grpsmkRef() {
    const r = await this.pool.query(
      `SELECT id::int AS id, nama, stk_masuk AS "stkMasuk", stk_keluar AS "stkKeluar" FROM gf.s_grpsmk WHERE COALESCE(hapus_oleh,0)=0 ORDER BY id`,
    );
    return r.rows;
  }

  /** Kartu Stock (read-only): mutasi stok dari Barang Masuk & Barang Keluar. */
  async kartuStockList(limit = 100, offset = 0, q?: string): Promise<KartuStockPage> {
    const params: unknown[] = [];
    let filter = "";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      filter = ` AND s.nama ILIKE $${params.length}`;
    }
    const union = `
      SELECT m.id AS no, m.tanggal, d.stock_id, s.nama AS stock_nama, 'MASUK' AS jenis, m.gudang, d.jumlah, d.catatan
      FROM gf.s_stkmex d JOIN gf.s_stkmas m ON m.id=d.stkmas_id LEFT JOIN gf.s_stock s ON s.id=d.stock_id
      WHERE m.hapus_oleh IS NULL${filter}
      UNION ALL
      SELECT k.id AS no, k.tanggal, d.stock_id, s.nama AS stock_nama, 'KELUAR' AS jenis, k.gudang, d.jumlah, d.catatan
      FROM gf.s_stkkex d JOIN gf.s_stkklr k ON k.id=d.stkklr_id LEFT JOIN gf.s_stock s ON s.id=d.stock_id
      WHERE k.hapus_oleh IS NULL${filter}`;
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM (${union}) x`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT stock_id::int AS "stockId", stock_nama AS "stockNama", to_char(tanggal,'YYYY-MM-DD') AS tanggal,
              no::text AS no, jenis, gudang, jumlah::text AS jumlah, catatan
       FROM (${union}) x ORDER BY tanggal DESC, no DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as never, total: total.rows[0].n as number };
  }

  /** Barang Expired (read-only): baris pembelian yang punya tanggal ED. */
  async barangExpiredList(limit = 100, offset = 0, q?: string): Promise<BarangExpiredPage> {
    const params: unknown[] = [];
    let filter = "";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      filter = ` AND s.nama ILIKE $${params.length}`;
    }
    const base = `FROM gf.s_pembed d JOIN gf.s_pembel m ON m.id=d.pembel_id
                  LEFT JOIN gf.s_stock s ON s.id=d.stock_id
                  WHERE m.hapus_oleh IS NULL AND d.expired IS NOT NULL${filter}`;
    const total = await this.pool.query(`SELECT count(*)::int AS n ${base}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT d.stock_id::int AS "stockId", s.nama AS "stockNama", to_char(d.expired,'YYYY-MM-DD') AS expired,
              d.jumlah::text AS jumlah, m.gudang
       ${base} ORDER BY d.expired ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as never, total: total.rows[0].n as number };
  }
}
