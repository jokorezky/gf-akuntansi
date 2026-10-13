import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../db/pg.provider";
import { LAPORAN_CATALOG, LaporanCatalogItem } from "./laporan.catalog";
import { buildSpec, isImplemented, isNA, LapSpec } from "./laporan.engine";
import { LaporanCatalog, LaporanHasil } from "./laporan.types";

function s(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}

const NATIVE_PREFIX = ["011 ", "012 ", "005 ", "021 ", "031 ", "131 ", "241 ", "801 ", "821 "];

@Injectable()
export class LaporanService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  catalog(): LaporanCatalog {
    const total = LAPORAN_CATALOG.reduce((n, g) => n + g.items.length, 0);
    const groups = LAPORAN_CATALOG.map((g) => ({
      label: g.label,
      items: g.items.map((it) => ({ ...it, implemented: this.implemented(it), na: isNA(it.file) })),
    }));
    return { total, groups };
  }

  private implemented(it: LaporanCatalogItem): boolean {
    if (NATIVE_PREFIX.some((p) => it.file.startsWith(p))) return true;
    return isImplemented(it.file, it.nama);
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
    if (isNA(it.file)) {
      return {
        kode: it.kode,
        judul: it.nama,
        kolom: ["Status"],
        baris: [[`N/A — modul ${it.file.startsWith("204 ") ? "forecasting" : "hotel"} tidak ada di data minimarket (fokus data yang ada di DB).`]],
        total: 1,
        catatan: "N/A",
      };
    }
    if (it.file.startsWith("011 ")) return this.daftarItem(it, q, limit, offset);
    if (it.file.startsWith("012 ") && /sisa stock/i.test(it.file)) return this.sisaStock(it, q, limit, offset);
    if (it.file.startsWith("005 ")) return this.daftarPerkiraan(it, q, limit, offset);
    if (it.file.startsWith("021 ")) return this.daftarVendor(it, q, limit, offset);
    if (it.file.startsWith("031 ")) return this.daftarPelanggan(it, q, limit, offset);
    if (it.file.startsWith("801 ") && /buku besar/i.test(it.file)) return this.bukuBesar(it, q, limit, offset);
    if (it.file.startsWith("821 ")) return this.kasRincian(it, q, limit, offset);
    const eng = await this.runEngine(it, q, limit, offset);
    if (eng) return eng;
    return {
      kode: it.kode,
      judul: it.nama,
      kolom: ["Status"],
      baris: [[`Laporan "${it.nama}" belum diimplementasikan di clone (file GF: ${it.file}).`]],
      total: 1,
      catatan: "belum diimplementasikan",
    };
  }

  /** Runner engine generik: SELECT c0..cn FROM base WHERE ... [GROUP BY] ORDER BY. */
  private async runEngine(it: LaporanCatalogItem, q: string | undefined, limit: number, offset: number): Promise<LaporanHasil | null> {
    const spec: LapSpec | null = buildSpec(it.file, it.nama);
    if (!spec) return null;
    const sel = spec.cols.map((c, i) => `${c.sql} AS c${i}`).join(", ");
    const params: unknown[] = [];
    let where = spec.where ? `WHERE ${spec.where}` : "WHERE true";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (${spec.cols[0].sql})::text ILIKE $${params.length}`;
    }
    const totalSql = spec.groupBy
      ? `SELECT count(*)::int AS n FROM (SELECT 1 ${spec.base} ${where} ${spec.groupBy}) z`
      : `SELECT count(*)::int AS n ${spec.base} ${where}`;
    const total = await this.pool.query(totalSql, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${sel} ${spec.base} ${where} ${spec.groupBy ?? ""} ORDER BY ${spec.orderBy ?? "1"} LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      kode: it.kode,
      judul: it.nama,
      kolom: spec.cols.map((c) => c.label),
      baris: (rows.rows as Record<string, unknown>[]).map((r) => spec.cols.map((_, i) => s(r[`c${i}`]))),
      total: total.rows[0].n as number,
      catatan: (spec.catatan ?? `File GF: ${it.file}`) + ` — file GF: ${it.file}`,
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

  /** 005 Daftar Semua Perkiraan. */
  private async daftarPerkiraan(it: LaporanCatalogItem, q: string | undefined, limit: number, offset: number): Promise<LaporanHasil> {
    const params: unknown[] = [];
    let where = "WHERE p.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (p.nama ILIKE $${params.length} OR p.kode ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_perkir p ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT p.kode, p.nama FROM gf.s_perkir p ${where} ORDER BY p.kode LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      kode: it.kode,
      judul: it.nama,
      kolom: ["Kode", "Nama Perkiraan"],
      baris: rows.rows.map((r) => [s(r.kode), s(r.nama)]),
      total: total.rows[0].n as number,
      catatan: `Sumber: gf.s_perkir — file GF: ${it.file}`,
    };
  }

  /** 021 Daftar Vendor. */
  private async daftarVendor(it: LaporanCatalogItem, q: string | undefined, limit: number, offset: number): Promise<LaporanHasil> {
    const params: unknown[] = [];
    let where = "WHERE v.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (v.nama ILIKE $${params.length} OR v.alamat ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_vendor v ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT v.nama, v.alamat, v.telepon FROM gf.s_vendor v ${where} ORDER BY v.id LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      kode: it.kode,
      judul: it.nama,
      kolom: ["Nama", "Alamat", "Telepon"],
      baris: rows.rows.map((r) => [s(r.nama), s(r.alamat), s(r.telepon)]),
      total: total.rows[0].n as number,
      catatan: `Sumber: gf.s_vendor — file GF: ${it.file}`,
    };
  }

  /** 031 Daftar Pelanggan. */
  private async daftarPelanggan(it: LaporanCatalogItem, q: string | undefined, limit: number, offset: number): Promise<LaporanHasil> {
    const params: unknown[] = [];
    let where = "WHERE p.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (p.nama ILIKE $${params.length} OR p.kode ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_pelang p ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT p.kode, p.nama, p.alamat, p.telepon FROM gf.s_pelang p ${where} ORDER BY p.id LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      kode: it.kode,
      judul: it.nama,
      kolom: ["Kode", "Nama", "Alamat", "Telepon"],
      baris: rows.rows.map((r) => [s(r.kode), s(r.nama), s(r.alamat), s(r.telepon)]),
      total: total.rows[0].n as number,
      catatan: `Sumber: gf.s_pelang — file GF: ${it.file}`,
    };
  }

  /** 131 Laporan Pembelian (header). */
  private async pembelian(it: LaporanCatalogItem, q: string | undefined, limit: number, offset: number): Promise<LaporanHasil> {
    const params: unknown[] = [];
    let where = "WHERE p.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (p.no ILIKE $${params.length} OR v.nama ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_pembel p LEFT JOIN gf.s_vendor v ON v.id=p.vendor ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT p.no, to_char(p.tanggal,'YYYY-MM-DD') AS tanggal, v.nama AS vendor,
              p.tot_harga::text AS tot_harga, p.tot_disc::text AS tot_disc, p.ppn_nilai::text AS ppn,
              round(COALESCE(p.tot_harga,0)-COALESCE(p.tot_disc,0)+COALESCE(p.ppn_nilai,0),2)::text AS netto
       FROM gf.s_pembel p LEFT JOIN gf.s_vendor v ON v.id=p.vendor
       ${where} ORDER BY p.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      kode: it.kode,
      judul: it.nama,
      kolom: ["No", "Tanggal", "Vendor", "Tot Harga", "Disc", "PPN", "Netto"],
      baris: rows.rows.map((r) => [s(r.no), s(r.tanggal), s(r.vendor), s(r.tot_harga), s(r.tot_disc), s(r.ppn), s(r.netto)]),
      total: total.rows[0].n as number,
      catatan: `Sumber: gf.s_pembel — file GF: ${it.file}`,
    };
  }

  /** 241 Laporan Penjualan (header). */
  private async penjualan(it: LaporanCatalogItem, q: string | undefined, limit: number, offset: number): Promise<LaporanHasil> {
    const params: unknown[] = [];
    let where = "WHERE j.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (COALESCE(j.no_c, j.no::text) ILIKE $${params.length} OR p.nama ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_penjua j LEFT JOIN gf.s_pelang p ON p.id=j.pelang ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT COALESCE(j.no_c, j.no::text) AS no, to_char(j.tanggal,'YYYY-MM-DD') AS tanggal, p.nama AS pelanggan,
              j.tot_harga::text AS tot_harga, j.tot_disc::text AS tot_disc, j.ppn_nilai::text AS ppn,
              round(COALESCE(j.tot_harga,0)-COALESCE(j.tot_disc,0)+COALESCE(j.ppn_nilai,0),2)::text AS netto
       FROM gf.s_penjua j LEFT JOIN gf.s_pelang p ON p.id=j.pelang
       ${where} ORDER BY j.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      kode: it.kode,
      judul: it.nama,
      kolom: ["No", "Tanggal", "Pelanggan", "Tot Harga", "Disc", "PPN", "Netto"],
      baris: rows.rows.map((r) => [s(r.no), s(r.tanggal), s(r.pelanggan), s(r.tot_harga), s(r.tot_disc), s(r.ppn), s(r.netto)]),
      total: total.rows[0].n as number,
      catatan: `Sumber: gf.s_penjua — file GF: ${it.file}`,
    };
  }

  /** 801 Laporan Buku Besar (saldo per akun). */
  private async bukuBesar(it: LaporanCatalogItem, q: string | undefined, limit: number, offset: number): Promise<LaporanHasil> {
    const params: unknown[] = [];
    let where = "WHERE p.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND p.nama ILIKE $${params.length}`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_perkir p ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT p.nama, p.kode,
              round(COALESCE(SUM(CASE WHEN d.debet THEN d.nilai ELSE 0 END),0),2)::text AS debet,
              round(COALESCE(SUM(CASE WHEN NOT d.debet THEN d.nilai ELSE 0 END),0),2)::text AS kredit,
              round(COALESCE(SUM(CASE WHEN d.debet THEN d.nilai ELSE -d.nilai END),0),2)::text AS saldo
       FROM gf.s_perkir p LEFT JOIN gf.s_jurnex d ON d.perkir_id=p.id
       ${where} GROUP BY p.id, p.nama, p.kode ORDER BY p.kode LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      kode: it.kode,
      judul: it.nama,
      kolom: ["Akun", "Kode", "Debet", "Kredit", "Saldo"],
      baris: rows.rows.map((r) => [s(r.nama), s(r.kode), s(r.debet), s(r.kredit), s(r.saldo)]),
      total: total.rows[0].n as number,
      catatan: `Sumber: gf.s_perkir + gf.s_jurnex — file GF: ${it.file}`,
    };
  }

  /** 821 Laporan Kas Rincian (kas masuk + keluar). */
  private async kasRincian(it: LaporanCatalogItem, q: string | undefined, limit: number, offset: number): Promise<LaporanHasil> {
    const union = `
      SELECT to_char(k.tanggal,'YYYY-MM-DD') AS tanggal, 'MASUK' AS jenis, COALESCE(k.no_c, k.no::text) AS no,
             p.nama AS perkir, d.nilai::text AS nilai, k.catatan
      FROM gf.s_kasmex d JOIN gf.s_kasmsk k ON k.id=d.kasmsk_id LEFT JOIN gf.s_perkir p ON p.id=d.perkir_id
      WHERE k.hapus_oleh IS NULL
      UNION ALL
      SELECT to_char(k.tanggal,'YYYY-MM-DD') AS tanggal, 'KELUAR' AS jenis, COALESCE(k.no_c, k.no::text) AS no,
             p.nama AS perkir, d.nilai::text AS nilai, k.catatan
      FROM gf.s_kaskex d JOIN gf.s_kasklr k ON k.id=d.kasklr_id LEFT JOIN gf.s_perkir p ON p.id=d.perkir_id
      WHERE k.hapus_oleh IS NULL`;
    const params: unknown[] = [];
    let where = "";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where = ` WHERE (no ILIKE $${params.length} OR perkir ILIKE $${params.length} OR catatan ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM (${union}) x ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT tanggal, jenis, no, perkir, nilai FROM (${union}) x ${where} ORDER BY tanggal DESC, jenis LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      kode: it.kode,
      judul: it.nama,
      kolom: ["Tanggal", "Jenis", "No", "Perkiraan", "Nilai"],
      baris: rows.rows.map((r) => [s(r.tanggal), s(r.jenis), s(r.no), s(r.perkir), s(r.nilai)]),
      total: total.rows[0].n as number,
      catatan: `Sumber: gf.s_kasmex + gf.s_kaskex — file GF: ${it.file}`,
    };
  }
}
