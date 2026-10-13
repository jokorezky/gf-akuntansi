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
function r2(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

const HDR = `
  m.id::int AS id, COALESCE(m.no_c, m.no::text) AS no, to_char(m.tanggal,'YYYY-MM-DD') AS tanggal,
  m.pelang::int AS "pelangId", p.nama AS "pelangNama", m.divisi_id AS "divisiId", m.collector,
  m.als_batal AS "alsBatal", m.catatan,
  st.lunas AS "totalLunas", st.disc AS "totalDisc", st.denda AS "totalDenda", st.bayar AS total`;

const JOINS = `LEFT JOIN gf.s_pelang p ON p.id=m.pelang
  LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(l.lunas),0) AS lunas, COALESCE(SUM(l.discount),0) AS disc, COALESCE(SUM(l.denda),0) AS denda,
           COALESCE(SUM(l.lunas - l.discount + l.denda),0) AS bayar
    FROM gf.s_lunpen l WHERE l.lpenma_id=m.id) st ON true`;

const LINE_SEL = `
  l.penjua_id::int AS "penjuaId", j.no AS "penjuaNo", to_char(j.tanggal,'YYYY-MM-DD') AS "penjuaTanggal",
  (j.tot_harga + COALESCE(j.ppn_nilai,0))::text AS "penjuaTotal",
  l.invpen_id::int AS "invpenId", l.retpen_id::int AS "retpenId", COALESCE(r.no_c, 'RJ'||r.no::text) AS "retpenNo",
  l.dcnpiu_id::int AS "dcnpiuId", l.deppen_id::int AS "deppenId",
  l.lunas::text AS lunas, l.discount::text AS discount, l.denda::text AS denda, l.catatan`;

const LINE_JOINS = `LEFT JOIN gf.s_penjua j ON j.id=l.penjua_id
  LEFT JOIN gf.s_retpen r ON r.id=l.retpen_id`;

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
      `SELECT ${HDR} FROM gf.s_lpenma m ${JOINS} ${where} ORDER BY m.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      rows: (rows.rows as Record<string, unknown>[]).map((r) => ({
        ...(r as unknown as Receipt),
        total: r2(num(r.total)),
        totalLunas: r2(num(r.totalLunas)),
        totalDisc: r2(num(r.totalDisc)),
        totalDenda: r2(num(r.totalDenda)),
      })),
      total: total.rows[0].n as number,
    };
  }

  async byId(id: number): Promise<Receipt | null> {
    const h = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_lpenma m ${JOINS} WHERE m.id=$1 AND m.hapus_oleh IS NULL`,
      [id],
    );
    if (!h.rows[0]) return null;
    const d = await this.pool.query(
      `SELECT ${LINE_SEL} FROM gf.s_lunpen l ${LINE_JOINS} WHERE l.lpenma_id=$1 ORDER BY l.sys_id`,
      [id],
    );
    const hdr = h.rows[0] as Record<string, unknown>;
    return {
      ...(hdr as unknown as Receipt),
      total: r2(num(hdr.total)),
      totalLunas: r2(num(hdr.totalLunas)),
      totalDisc: r2(num(hdr.totalDisc)),
      totalDenda: r2(num(hdr.totalDenda)),
      lines: d.rows as ReceiptLine[],
    };
  }

  private async writeLines(client: { query: (q: string, p?: unknown[]) => Promise<unknown> }, pid: number, tanggal: string | null | undefined, lines: ReceiptInput["lines"]) {
    for (const l of lines) {
      await client.query(
        `INSERT INTO gf.s_lunpen (lpenma_id, invpen_id, penjua_id, retpen_id, dcnpiu_id, deppen_id, tanggal, discount, lunas, denda, catatan)
         VALUES ($1,$2,$3,$4,$5,$6, COALESCE($7, now()::date), $8, $9, $10, $11)`,
        [pid, nn(l.invpenId), nn(l.penjuaId), nn(l.retpenId), nn(l.dcnpiuId), nn(l.deppenId),
         nn(tanggal), num(l.discount), num(l.lunas), num(l.denda), nn(l.catatan)],
      );
    }
  }

  async create(input: ReceiptInput, userId = 1): Promise<Receipt> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_lpenma (id, no, no_c, tanggal, pelang, divisi_id, collector, catatan, als_batal, input_oleh, tgl_input, jam_input)
         VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_lpenma), (SELECT COALESCE(MAX(no),0)+1 FROM gf.s_lpenma),
          $1, COALESCE($2, now()::date), $3, $4, $5, $6, $7, $8, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.no), nn(input.tanggal), input.pelangId, nn(input.divisiId), nn(input.collector),
         nn(input.catatan), nn(input.alsBatal), userId],
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

  async update(id: number, input: ReceiptInput, userId = 1): Promise<Receipt | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE gf.s_lpenma SET no_c=COALESCE($2, no_c), tanggal=COALESCE($3, tanggal), pelang=$4, divisi_id=$5,
           collector=$6, catatan=$7, als_batal=$8,
           ubah_oleh=$9, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.no), nn(input.tanggal), input.pelangId, nn(input.divisiId), nn(input.collector),
         nn(input.catatan), nn(input.alsBatal), userId],
      );
      await client.query(`DELETE FROM gf.s_lunpen WHERE lpenma_id=$1`, [id]);
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
      COALESCE((SELECT SUM(l.lunas - l.discount + l.denda) FROM gf.s_lunpen l JOIN gf.s_lpenma m2 ON m2.id=l.lpenma_id AND m2.hapus_oleh IS NULL WHERE l.penjua_id=j.id),0)::text AS dibayar,
      COALESCE((SELECT SUM(r.tot_harga) FROM gf.s_retpen r WHERE r.penjua_id=j.id AND r.hapus_oleh IS NULL),0)::text AS retur,
      (j.tot_harga + COALESCE(j.ppn_nilai,0)
        - COALESCE((SELECT SUM(l.lunas - l.discount + l.denda) FROM gf.s_lunpen l JOIN gf.s_lpenma m2 ON m2.id=l.lpenma_id AND m2.hapus_oleh IS NULL WHERE l.penjua_id=j.id),0)
        - COALESCE((SELECT SUM(r.tot_harga) FROM gf.s_retpen r WHERE r.penjua_id=j.id AND r.hapus_oleh IS NULL),0))::text AS sisa`;
    const total = await this.pool.query(`SELECT count(*)::int AS n ${base}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT j.id::int AS id, COALESCE(j.no_c, j.no::text) AS no, to_char(j.tanggal,'YYYY-MM-DD') AS tanggal,
              j.pelang::int AS "pelangId", p.nama AS "pelangNama", ${expr}
       ${base} ORDER BY j.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as never, total: total.rows[0].n as number };
  }
}
