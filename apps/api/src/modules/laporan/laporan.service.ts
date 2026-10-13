import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../db/pg.provider";
import { LAPORAN_CATALOG, LaporanCatalogItem } from "./laporan.catalog";
import { LaporanCatalog, LaporanHasil } from "./laporan.types";

function s(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}

@Injectable()
export class LaporanService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  catalog(): LaporanCatalog {
    const total = LAPORAN_CATALOG.reduce((n, g) => n + g.items.length, 0);
    return { total, groups: LAPORAN_CATALOG };
  }

  private find(kode: string): LaporanCatalogItem | undefined {
    for (const g of LAPORAN_CATALOG) {
      const it = g.items.find((x) => x.kode === kode || x.file === kode);
      if (it) return it;
    }
    return undefined;
  }

  async hasil(kode: string, q?: string, limit = 500, offset = 0): Promise<LaporanHasil> {
    const it = this.find(kode);
    if (!it) {
      return { kode, judul: kode, kolom: ["Info"], baris: [["Laporan tidak ditemukan di katalog clone."]], total: 1 };
    }
    if (it.file.startsWith("011 ")) return this.daftarItem(it, q, limit, offset);
    if (it.file.startsWith("012 ") && /sisa stock/i.test(it.file)) return this.sisaStock(it, q, limit, offset);
    return {
      kode: it.kode,
      judul: it.nama,
      kolom: ["Status"],
      baris: [[`Laporan "${it.nama}" belum diimplementasikan di clone (file GF: ${it.file}).`]],
      total: 1,
      catatan: "belum diimplementasikan",
    };
  }

  /** 011 Daftar Item — kolom mengikuti contoh GF (subset). */
  private async daftarItem(it: LaporanCatalogItem, q: string | undefined, limit: number, offset: number): Promise<LaporanHasil> {
    const params: unknown[] = [];
    let where = "WHERE s.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (s.nama ILIKE $${params.length} OR s.barcode ILIKE $${params.length} OR s.kode_c ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_stock s ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT s.kode_c, s.barcode, s.nama, g.nama AS group_nama, s.sat_def,
              s.harga_beli::text AS harga_beli, s.harga_j_01::text AS harga_jual1
       FROM gf.s_stock s LEFT JOIN gf.s_grpstk g ON g.id = s.group_stk
       ${where} ORDER BY s.id LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      kode: it.kode,
      judul: it.nama,
      kolom: ["Kode", "Barcode", "Nama", "Group", "Satuan", "H.Beli", "H.Jual #1"],
      baris: rows.rows.map((r) => [s(r.kode_c), s(r.barcode), s(r.nama), s(r.group_nama), s(r.sat_def), s(r.harga_beli), s(r.harga_jual1)]),
      total: total.rows[0].n as number,
      catatan: `Sumber: gf.s_stock — file GF: ${it.file}`,
    };
  }

  /** 012 Laporan Sisa Stock — reuse logika Sisa Stock. */
  private async sisaStock(it: LaporanCatalogItem, q: string | undefined, limit: number, offset: number): Promise<LaporanHasil> {
    const params: unknown[] = [];
    let where = "WHERE s.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (s.nama ILIKE $${params.length} OR s.barcode ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_stock s ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT g.nama AS group_nama, s.kode_c, s.nama, s.tipe_satu,
              (COALESCE(s.sisa_stk01,0)+COALESCE(s.sisa_stk02,0)+COALESCE(s.sisa_stk03,0)+COALESCE(s.sisa_stk04,0)+COALESCE(s.sisa_stk05,0))::text AS sisa,
              s.harga_j_01::text AS harga_jual1, s.harga_j_02::text AS harga_jual2
       FROM gf.s_stock s LEFT JOIN gf.s_grpstk g ON g.id = s.group_stk
       ${where} ORDER BY s.id LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      kode: it.kode,
      judul: it.nama,
      kolom: ["Group", "Kode", "Nama", "Tipe", "Sisa", "H.Jual #1", "H.Jual #2"],
      baris: rows.rows.map((r) => [s(r.group_nama), s(r.kode_c), s(r.nama), s(r.tipe_satu), s(r.sisa), s(r.harga_jual1), s(r.harga_jual2)]),
      total: total.rows[0].n as number,
      catatan: `Sumber: gf.s_stock (sisa_stk01..05) — file GF: ${it.file}`,
    };
  }
}
