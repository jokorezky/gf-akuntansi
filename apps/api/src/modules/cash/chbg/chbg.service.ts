import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { ChbgPage, ChbgRef, ChbgRow } from "./chbg.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}

interface Cfg {
  det: string;
  mas: string;
  fk: string;
  dbf: string;
}

const CFG: Record<string, Cfg> = {
  masuk: { det: "gf.s_kasmex", mas: "gf.s_kasmsk", fk: "kasmsk_id", dbf: "CASE WHEN d.kredit THEN 'CR' ELSE 'DB' END" },
  keluar: { det: "gf.s_kaskex", mas: "gf.s_kasklr", fk: "kasklr_id", dbf: "CASE WHEN d.debet THEN 'DB' ELSE 'CR' END" },
};

@Injectable()
export class ChbgService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private cfg(tipe: string): Cfg {
    const c = CFG[tipe];
    if (!c) throw new Error(`tipe tidak dikenal: ${tipe}`);
    return c;
  }

  async list(tipe: string, dari?: string, sampai?: string, q?: string, status?: string, vendorId?: number, pelangId?: number, limit = 300, offset = 0): Promise<ChbgPage> {
    const c = this.cfg(tipe);
    const params: unknown[] = [];
    const where: string[] = ["d.tgl_hapus IS NULL", "COALESCE(d.no,'') <> ''"];
    if (dari) { params.push(dari); where.push(`d.tanggal >= $${params.length}::date`); }
    if (sampai) { params.push(sampai); where.push(`d.tanggal <= $${params.length}::date`); }
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      const p = `$${params.length}`;
      where.push(`(d.no ILIKE ${p} OR COALESCE(d.lunas_doc,'') ILIKE ${p} OR COALESCE(v.nama,'') ILIKE ${p} OR COALESCE(pl.nama,'') ILIKE ${p})`);
    }
    if (status === "belum") where.push("COALESCE(d.cairchbg,false) = false");
    if (status === "sudah") where.push("COALESCE(d.cairchbg,false) = true");
    if (vendorId) { params.push(vendorId); where.push(`d.vendor = $${params.length}`); }
    if (pelangId) { params.push(pelangId); where.push(`d.pelang = $${params.length}`); }
    const W = `WHERE ${where.join(" AND ")}`;
    const JOIN = `LEFT JOIN ${c.mas} m ON m.id=d.${c.fk}
      LEFT JOIN gf.s_perkir pk ON pk.id=d.perkir_id
      LEFT JOIN gf.s_vendor v ON v.id=d.vendor
      LEFT JOIN gf.s_pelang pl ON pl.id=d.pelang`;
    const SEL = `d.sys_id::int AS "sysId", d.${c.fk}::int AS "kasId", ${c.dbf} AS "dbCr", d.no, to_char(d.tanggal,'YYYY-MM-DD') AS tanggal,
      to_char(d.lunas_dt,'YYYY-MM-DD') AS "lunasDt", d.lunas_doc AS "lunasDoc", d.mauang,
      d.nilai::text AS nilai, d.nilai_3::text AS "nilai3", NULL::text AS kurs,
      d.perkir_id AS "perkirId", pk.nama AS "perkirNama",
      to_char(d.lunas_cair,'YYYY-MM-DD') AS "lunasCair", d.luncair_nb AS "lunasCairKe",
      d.vendor AS "vendorId", v.nama AS "vendorNama", d.pelang::int AS "pelangId", pl.nama AS "pelangNama",
      COALESCE(d.cairchbg,false) AS cairchbg`;
    const total = await this.pool.query(`SELECT count(*)::int AS n, COALESCE(sum(d.nilai),0)::text AS sum FROM ${c.det} d ${JOIN} ${W}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${SEL} FROM ${c.det} d ${JOIN} ${W} ORDER BY d.sys_id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      rows: rows.rows as ChbgRow[],
      total: total.rows[0].n as number,
      totalNilai: total.rows[0].sum as string,
    };
  }

  async cairkan(tipe: string, ids: number[], tgl?: string, catatan?: string): Promise<number> {
    const c = this.cfg(tipe);
    if (ids.length === 0) return 0;
    const r = await this.pool.query(
      `UPDATE ${c.det} SET cairchbg=true, lunas_cair=COALESCE($2::date, now()::date), luncair_nb=$3
       WHERE sys_id = ANY($1::bigint[]) AND COALESCE(cairchbg,false)=false AND tgl_hapus IS NULL`,
      [ids, nn(tgl), nn(catatan)],
    );
    return r.rowCount ?? 0;
  }

  async batalCair(tipe: string, ids: number[]): Promise<number> {
    const c = this.cfg(tipe);
    if (ids.length === 0) return 0;
    const r = await this.pool.query(
      `UPDATE ${c.det} SET cairchbg=false, lunas_cair=NULL, luncair_nb=NULL
       WHERE sys_id = ANY($1::bigint[]) AND COALESCE(cairchbg,false)=true`,
      [ids],
    );
    return r.rowCount ?? 0;
  }

  async vendorRef(q?: string, limit = 300): Promise<ChbgRef[]> {
    const params: unknown[] = [];
    let where = "WHERE COALESCE(v.hapus_oleh IS NULL, true)";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (v.nama ILIKE $${params.length} OR COALESCE(v.alamat,'') ILIKE $${params.length})`;
    }
    params.push(limit);
    const r = await this.pool.query(
      `SELECT v.id::int AS id, v.nama, v.alamat, v.daerah AS "daerahId", dr.daerah AS "daerahNama"
       FROM gf.s_vendor v LEFT JOIN gf.s_daerah dr ON dr.id=v.daerah ${where} ORDER BY v.nama LIMIT $${params.length}`,
      params,
    );
    return r.rows as ChbgRef[];
  }

  async pelangganRef(q?: string, limit = 300): Promise<ChbgRef[]> {
    const params: unknown[] = [];
    let where = "WHERE COALESCE(pl.hapus_oleh IS NULL, true)";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (pl.nama ILIKE $${params.length} OR COALESCE(pl.alamat,'') ILIKE $${params.length})`;
    }
    params.push(limit);
    const r = await this.pool.query(
      `SELECT pl.id::int AS id, pl.nama, pl.alamat, pl.daerah AS "daerahId", dr.daerah AS "daerahNama"
       FROM gf.s_pelang pl LEFT JOIN gf.s_daerah dr ON dr.id=pl.daerah ${where} ORDER BY pl.nama LIMIT $${params.length}`,
      params,
    );
    return r.rows as ChbgRef[];
  }
}
