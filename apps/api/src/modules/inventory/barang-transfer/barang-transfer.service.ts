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

/** Barang Transfer (24650/24651): header s_stktra (item utama + #Acc*1..3/nilai) + baris s_stktex
 *  ("Item/Stock yang berkurang"), relasi s_stktex.stktra_id -> s_stktra.id. */
const HDR = `
  t.id::int AS id, t.id::text AS no, to_char(t.tanggal,'YYYY-MM-DD') AS tanggal, t.divisi_id AS "divisiId",
  t.stock_id AS "stockId", s.nama AS "stockNama", t.stock_gdg AS gudang, t.jumlah::text AS jumlah, t.hpp::text AS hpp,
  t.per1_nil::text AS "nilai1", t.per2_nil::text AS "nilai2", t.per3_nil::text AS "nilai3",
  t.perkir_1 AS "perkir1", t.perkir_2 AS "perkir2", t.perkir_3 AS "perkir3",
  t.catatan, t.catatan_2 AS "catatan2", t.catatan_3 AS "catatan3", NULL::text AS "catatan4",
  st.tot AS "totHarga", st.qty AS "totJumlah"`;

const JOINS = `LEFT JOIN gf.s_stock s ON s.id=t.stock_id
  LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(e.jumlah*COALESCE(e.hpp,0)),0) AS tot, COALESCE(SUM(e.jumlah),0) AS qty
    FROM gf.s_stktex e WHERE e.stktra_id=t.id AND e.tgl_hapus IS NULL) st ON true`;

@Injectable()
export class BarangTransferService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<BarangTransferPage> {
    const params: unknown[] = [];
    let where = "WHERE t.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (t.id::text ILIKE $${params.length} OR COALESCE(s.nama,'') ILIKE $${params.length} OR COALESCE(t.catatan,'') ILIKE $${params.length})`;
    }
    const total = await this.pool.query(
      `SELECT count(*)::int AS n FROM gf.s_stktra t LEFT JOIN gf.s_stock s ON s.id=t.stock_id ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_stktra t ${JOINS} ${where} ORDER BY t.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
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
    const h = await this.pool.query(`SELECT ${HDR} FROM gf.s_stktra t ${JOINS} WHERE t.id=$1 AND t.hapus_oleh IS NULL`, [id]);
    if (!h.rows[0]) return null;
    const d = await this.pool.query(
      `SELECT e.stock_id::int AS "stockId", s2.nama AS "stockNama", e.stock_gdg AS "stockGdg",
              NULL::text AS "satuanC", e.jumlah::text AS jumlah, e.hpp::text AS hpp, e.catatan
       FROM gf.s_stktex e LEFT JOIN gf.s_stock s2 ON s2.id=e.stock_id
       WHERE e.stktra_id=$1 AND e.tgl_hapus IS NULL ORDER BY e.sys_id`,
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
        `INSERT INTO gf.s_stktex (stktra_id, stock_id, stock_gdg, tanggal, jumlah, hpp, catatan)
         VALUES ($1,$2,$3, COALESCE($4, now()::date), $5, $6, $7)`,
        [pid, l.stockId, nn(l.stockGdg), nn(tanggal), num(l.jumlah), num(l.hpp), nn(l.catatan)],
      );
    }
  }

  async create(input: BarangTransferInput, userId = 1): Promise<BarangTransfer> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_stktra (id, divisi_id, stock_id, stock_gdg, tanggal, jumlah, hpp,
           perkir_1, perkir_2, perkir_3, per1_nil, per2_nil, per3_nil,
           catatan, catatan_2, catatan_3, input_oleh, tgl_input, jam_input)
         VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_stktra), $1, $2, COALESCE($3,1), COALESCE($4, now()::date), $5, $6,
           $7, $8, $9, $10, $11, $12,
           $13, $14, $15, $16, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.divisiId), nn(input.stockId), nn(input.gudang), nn(input.tanggal), num(input.jumlah), num(input.hpp),
         nn(input.perkir1), nn(input.perkir2), nn(input.perkir3),
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
        `UPDATE gf.s_stktra SET divisi_id=$2, stock_id=$3, stock_gdg=COALESCE($4,1), tanggal=COALESCE($5, tanggal),
           jumlah=$6, hpp=$7,
           perkir_1=$8, perkir_2=$9, perkir_3=$10, per1_nil=$11, per2_nil=$12, per3_nil=$13,
           catatan=$14, catatan_2=$15, catatan_3=$16,
           ubah_oleh=$17, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.divisiId), nn(input.stockId), nn(input.gudang), nn(input.tanggal), num(input.jumlah), num(input.hpp),
         nn(input.perkir1), nn(input.perkir2), nn(input.perkir3),
         num(input.nilai1), num(input.nilai2), num(input.nilai3),
         nn(input.catatan), nn(input.catatan2), nn(input.catatan3), userId],
      );
      await client.query(`UPDATE gf.s_stktex SET tgl_hapus=now()::date WHERE stktra_id=$1 AND tgl_hapus IS NULL`, [id]);
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
      `UPDATE gf.s_stktra SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
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
