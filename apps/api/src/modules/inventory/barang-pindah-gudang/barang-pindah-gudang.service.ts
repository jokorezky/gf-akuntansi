import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { BarangPindahGudang, BarangPindahGudangInput, BarangPindahGudangPage, PindahLine } from "./barang-pindah-gudang.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Barang Pindah Gudang (24652): header s_stkpin (Dr gudang_1 -> Ke gudang_2) + baris s_stkpex (stkpin_id). */
const HDR = `
  p.id::int AS id, p.no, to_char(p.tanggal,'YYYY-MM-DD') AS tanggal, p.divisi_id AS "divisiId",
  p.nama, p.alamat, p.gudang_1 AS "gudang1", p.gudang_2 AS "gudang2", p.catatan,
  st.qty AS "totJumlah"`;

const JOINS = `LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(e.jumlah),0) AS qty FROM gf.s_stkpex e WHERE e.stkpin_id=p.id AND e.tgl_hapus IS NULL) st ON true`;

@Injectable()
export class BarangPindahGudangService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<BarangPindahGudangPage> {
    const params: unknown[] = [];
    let where = "WHERE p.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (p.no::text ILIKE $${params.length} OR COALESCE(p.nama,'') ILIKE $${params.length} OR COALESCE(p.catatan,'') ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_stkpin p ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_stkpin p ${JOINS} ${where} ORDER BY p.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as BarangPindahGudang[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<BarangPindahGudang | null> {
    const h = await this.pool.query(`SELECT ${HDR} FROM gf.s_stkpin p ${JOINS} WHERE p.id=$1 AND p.hapus_oleh IS NULL`, [id]);
    if (!h.rows[0]) return null;
    const d = await this.pool.query(
      `SELECT e.stock_id::int AS "stockId", s.nama AS "stockNama", e.stock_gdg AS "stockGdg", e.stock_gdg2 AS "stockGdg2",
              e.jumlah::text AS jumlah, e.hpp::text AS hpp, e.catatan
       FROM gf.s_stkpex e LEFT JOIN gf.s_stock s ON s.id=e.stock_id
       WHERE e.stkpin_id=$1 AND e.tgl_hapus IS NULL ORDER BY e.sys_id`,
      [id],
    );
    return { ...(h.rows[0] as BarangPindahGudang), lines: d.rows as PindahLine[] };
  }

  private async writeLines(client: { query: (q: string, p?: unknown[]) => Promise<unknown> }, pid: number, g1: number | null | undefined, g2: number | null | undefined, tanggal: string | null | undefined, lines: BarangPindahGudangInput["lines"]) {
    for (const l of lines) {
      await client.query(
        `INSERT INTO gf.s_stkpex (stkpin_id, stock_id, stock_gdg, stock_gdg2, tanggal, jumlah, hpp, catatan)
         VALUES ($1,$2,$3,$4, COALESCE($5, now()::date), $6, $7, $8)`,
        [pid, l.stockId, nn(l.stockGdg ?? g1), nn(l.stockGdg2 ?? g2), nn(tanggal), num(l.jumlah), num(l.hpp), nn(l.catatan)],
      );
    }
  }

  async create(input: BarangPindahGudangInput, userId = 1): Promise<BarangPindahGudang> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_stkpin (id, no, tanggal, divisi_id, nama, alamat, gudang_1, gudang_2, catatan, input_oleh, tgl_input, jam_input)
         VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_stkpin), (SELECT COALESCE(MAX(no),0)+1 FROM gf.s_stkpin),
           COALESCE($1, now()::date), $2, $3, $4, COALESCE($5,1), COALESCE($6,1), $7, $8, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.tanggal), nn(input.divisiId), nn(input.nama), nn(input.alamat), nn(input.gudang1), nn(input.gudang2), nn(input.catatan), userId],
      );
      const pid = h.rows[0].id as number;
      await this.writeLines(client, pid, input.gudang1, input.gudang2, input.tanggal, input.lines);
      await client.query("COMMIT");
      return (await this.byId(pid))!;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async update(id: number, input: BarangPindahGudangInput, userId = 1): Promise<BarangPindahGudang | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE gf.s_stkpin SET tanggal=COALESCE($2, tanggal), divisi_id=$3, nama=$4, alamat=$5,
           gudang_1=COALESCE($6,1), gudang_2=COALESCE($7,1), catatan=$8,
           ubah_oleh=$9, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.tanggal), nn(input.divisiId), nn(input.nama), nn(input.alamat), nn(input.gudang1), nn(input.gudang2), nn(input.catatan), userId],
      );
      await client.query(`UPDATE gf.s_stkpex SET tgl_hapus=now()::date WHERE stkpin_id=$1 AND tgl_hapus IS NULL`, [id]);
      await this.writeLines(client, id, input.gudang1, input.gudang2, input.tanggal, input.lines);
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
      `UPDATE gf.s_stkpin SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
