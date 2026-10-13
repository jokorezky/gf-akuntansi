import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { Jurnal, JurnalInput, JurnalLine, JurnalPage, BukuBesarPage } from "./jurnal.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const HDR = `
  j.id::int AS id, j.no::text AS no, to_char(j.tanggal,'YYYY-MM-DD') AS tanggal, j.divisi_id AS "divisiId",
  j.vendor AS "vendorId", v.nama AS "vendorNama", j.pelang::int AS "pelangId", pl.nama AS "pelangNama", j.jenis, j.catatan,
  (SELECT round(COALESCE(SUM(CASE WHEN d.debet THEN d.nilai ELSE 0 END),0),2)::text FROM gf.s_jurnex d WHERE d.jurnal_id=j.id) AS "totalDebet",
  (SELECT round(COALESCE(SUM(CASE WHEN NOT d.debet THEN d.nilai ELSE 0 END),0),2)::text FROM gf.s_jurnex d WHERE d.jurnal_id=j.id) AS "totalKredit"`;

const JOIN = `LEFT JOIN gf.s_vendor v ON v.id=j.vendor LEFT JOIN gf.s_pelang pl ON pl.id=j.pelang`;

@Injectable()
export class JurnalService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<JurnalPage> {
    const params: unknown[] = [];
    let where = "WHERE j.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (j.no::text ILIKE $${params.length} OR j.catatan ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_jurnal j ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_jurnal j ${JOIN} ${where} ORDER BY j.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as Jurnal[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<Jurnal | null> {
    const h = await this.pool.query(`SELECT ${HDR} FROM gf.s_jurnal j ${JOIN} WHERE j.id=$1 AND j.hapus_oleh IS NULL`, [id]);
    if (!h.rows[0]) return null;
    const d = await this.pool.query(
      `SELECT d.perkir_id::int AS "perkirId", p.nama AS "perkirNama", d.nilai::text AS nilai, d.debet,
              d.lunas_doc AS note, to_char(d.lunas_dt,'YYYY-MM-DD') AS date, d.mauang
       FROM gf.s_jurnex d LEFT JOIN gf.s_perkir p ON p.id=d.perkir_id WHERE d.jurnal_id=$1 ORDER BY d.sys_id`,
      [id],
    );
    return { ...(h.rows[0] as Jurnal), lines: d.rows as JurnalLine[] };
  }

  async create(input: JurnalInput, userId = 1): Promise<Jurnal> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_jurnal (id, no, tanggal, divisi_id, vendor, pelang, jenis, catatan, input_oleh, tgl_input, jam_input)
         VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_jurnal), (SELECT COALESCE(MAX(no),0)+1 FROM gf.s_jurnal),
          COALESCE($1, now()::date), $2, $3, $4, $5, $6, $7, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.tanggal), nn(input.divisiId), nn(input.vendorId), nn(input.pelangId), nn(input.jenis), nn(input.catatan), userId],
      );
      const pid = h.rows[0].id as number;
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO gf.s_jurnex (jurnal_id, perkir_id, debet, nilai, tanggal, lunas_doc, lunas_dt, mauang)
           VALUES ($1,$2,$3,$4, COALESCE($5, now()::date), $6, $7, COALESCE($8,1))`,
          [pid, nn(l.perkirId), l.debet ?? false, num(l.nilai), nn(input.tanggal), nn(l.note), nn(l.date), nn(l.mauang)],
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

  async update(id: number, input: JurnalInput, userId = 1): Promise<Jurnal | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE gf.s_jurnal SET tanggal=COALESCE($2, tanggal), divisi_id=$3, vendor=$4, pelang=$5, jenis=$6, catatan=$7,
           ubah_oleh=$8, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.tanggal), nn(input.divisiId), nn(input.vendorId), nn(input.pelangId), nn(input.jenis), nn(input.catatan), userId],
      );
      await client.query(`DELETE FROM gf.s_jurnex WHERE jurnal_id=$1`, [id]);
      for (const l of input.lines) {
        await client.query(
          `INSERT INTO gf.s_jurnex (jurnal_id, perkir_id, debet, nilai, tanggal, lunas_doc, lunas_dt, mauang)
           VALUES ($1,$2,$3,$4, COALESCE($5, now()::date), $6, $7, COALESCE($8,1))`,
          [id, nn(l.perkirId), l.debet ?? false, num(l.nilai), nn(input.tanggal), nn(l.note), nn(l.date), nn(l.mauang)],
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
      `UPDATE gf.s_jurnal SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  /** Buku Besar (read-only): per akun, total debet/kredit + saldo. */
  async bukuBesarList(limit = 100, offset = 0, q?: string): Promise<BukuBesarPage> {
    const params: unknown[] = [];
    let where = "WHERE p.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND p.nama ILIKE $${params.length}`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_perkir p ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT p.id::int AS id, p.nama, p.kode,
              round(COALESCE(SUM(CASE WHEN d.debet THEN d.nilai ELSE 0 END),0),2)::text AS debet,
              round(COALESCE(SUM(CASE WHEN NOT d.debet THEN d.nilai ELSE 0 END),0),2)::text AS kredit,
              round(COALESCE(SUM(CASE WHEN d.debet THEN d.nilai ELSE -d.nilai END),0),2)::text AS saldo
       FROM gf.s_perkir p LEFT JOIN gf.s_jurnex d ON d.perkir_id=p.id
       ${where} GROUP BY p.id, p.nama, p.kode ORDER BY p.id LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as never, total: total.rows[0].n as number };
  }
}
