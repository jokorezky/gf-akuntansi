import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { BarangTransfer, BarangTransferInput, BarangTransferPage, SisaStockInfo, TrfLine } from "./barang-transfer.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}
function r2(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

const HDR = `
  t.id::int AS id, t.no, to_char(t.tanggal,'YYYY-MM-DD') AS tanggal, t.pukul, t.divisi_id AS "divisiId", t.gudang,
  t.mauang, t.tot_harga::text AS "nilai1", t.tot_harex1::text AS "nilai2", t.tot_harex2::text AS "nilai3",
  NULL::int AS "perkir1", NULL::int AS "perkir2", NULL::int AS "perkir3",
  t.catatan, t.catatan_2 AS "catatan2", t.catatan_3 AS "catatan3", NULL::text AS "catatan4",
  st.tot AS "totHarga", st.qty AS "totJumlah"`;

const JOINS = `LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(e.jumlah*e.harga),0) AS tot, COALESCE(SUM(e.jumlah),0) AS qty
    FROM gf.s_trmsex e WHERE e.trmstk_id=t.id AND e.tgl_hapus IS NULL) st ON true`;

@Injectable()
export class BarangTransferService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<BarangTransferPage> {
    const params: unknown[] = [];
    let where = "WHERE t.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (COALESCE(t.no,'') ILIKE $${params.length} OR t.catatan ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_trmstk t ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_trmstk t ${JOINS} ${where} ORDER BY t.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      rows: (rows.rows as Record<string, unknown>[]).map((r) => ({
        ...(r as unknown as BarangTransfer),
        nilai1: r2(num(r.nilai1)), nilai2: r2(num(r.nilai2)), nilai3: r2(num(r.nilai3)),
        totHarga: r2(num(r.totHarga)), totJumlah: String(num(r.totJumlah)),
      })),
      total: total.rows[0].n as number,
    };
  }

  async byId(id: number): Promise<BarangTransfer | null> {
    const h = await this.pool.query(`SELECT ${HDR} FROM gf.s_trmstk t ${JOINS} WHERE t.id=$1 AND t.hapus_oleh IS NULL`, [id]);
    if (!h.rows[0]) return null;
    const d = await this.pool.query(
      `SELECT e.stock_id::int AS "stockId", s.nama AS "stockNama", NULL::text AS "satuanC",
              e.jumlah::text AS jumlah, e.harga::text AS harga, e.catatan
       FROM gf.s_trmsex e LEFT JOIN gf.s_stock s ON s.id=e.stock_id
       WHERE e.trmstk_id=$1 AND e.tgl_hapus IS NULL ORDER BY e.sys_id`,
      [id],
    );
    const hdr = h.rows[0] as Record<string, unknown>;
    return {
      ...(hdr as unknown as BarangTransfer),
      nilai1: r2(num(hdr.nilai1)), nilai2: r2(num(hdr.nilai2)), nilai3: r2(num(hdr.nilai3)),
      totHarga: r2(num(hdr.totHarga)), totJumlah: String(num(hdr.totJumlah)),
      lines: d.rows as TrfLine[],
    };
  }

  private async writeLines(client: { query: (q: string, p?: unknown[]) => Promise<unknown> }, pid: number, tanggal: string | null | undefined, lines: BarangTransferInput["lines"]) {
    for (const l of lines) {
      await client.query(
        `INSERT INTO gf.s_trmsex (trmstk_id, stock_id, tanggal, jumlah, harga, catatan)
         VALUES ($1,$2, COALESCE($3, now()::date), $4, $5, $6)`,
        [pid, l.stockId, nn(tanggal), num(l.jumlah), num(l.harga), nn(l.catatan)],
      );
    }
  }

  async create(input: BarangTransferInput, userId = 1): Promise<BarangTransfer> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_trmstk (id, no, tanggal, divisi_id, gudang, mauang, tot_harga, tot_harex1, tot_harex2,
           catatan, catatan_2, catatan_3, input_oleh, tgl_input, jam_input)
         VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_trmstk), $1, COALESCE($2, now()::date), $3, COALESCE($4,1),
           COALESCE($5,1), $6, $7, $8, $9, $10, $11, $12, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.no), nn(input.tanggal), nn(input.divisiId), nn(input.gudang), nn(input.mauang),
         num(input.nilai1), num(input.nilai2), num(input.nilai3),
         nn(input.catatan), nn(input.catatan2), nn(input.catatan3), userId],
      );
      const pid = h.rows[0].id as number;
      await this.writeLines(client, pid, input.tanggal, input.lines);
      await client.query("COMMIT");
      return (await this.byId(pid))!;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async update(id: number, input: BarangTransferInput, userId = 1): Promise<BarangTransfer | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE gf.s_trmstk SET no=$2, tanggal=COALESCE($3, tanggal), divisi_id=$4, gudang=COALESCE($5,1), mauang=COALESCE($6,1),
           tot_harga=$7, tot_harex1=$8, tot_harex2=$9,
           catatan=$10, catatan_2=$11, catatan_3=$12,
           ubah_oleh=$13, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.no), nn(input.tanggal), nn(input.divisiId), nn(input.gudang), nn(input.mauang),
         num(input.nilai1), num(input.nilai2), num(input.nilai3),
         nn(input.catatan), nn(input.catatan2), nn(input.catatan3), userId],
      );
      await client.query(`UPDATE gf.s_trmsex SET tgl_hapus=now()::date WHERE trmstk_id=$1 AND tgl_hapus IS NULL`, [id]);
      await this.writeLines(client, id, input.tanggal, input.lines);
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
      `UPDATE gf.s_trmstk SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  /** Sisa stock utk display (label GF: TIDAK DIHITUNG bila kosong). */
  async sisaStock(stockId: number): Promise<SisaStockInfo | null> {
    const r = await this.pool.query(
      `SELECT s.id::int AS "stockId", s.nama, COALESCE(s.sisa_stk01,0)::text AS sisa FROM gf.s_stock s WHERE s.id=$1`,
      [stockId],
    );
    return (r.rows[0] as SisaStockInfo) ?? null;
  }
}
