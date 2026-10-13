import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../db/pg.provider";
import { DbInfoRow, LookupResult } from "./util.types";

const TABLES: [string, string][] = [
  ["s_stock", "Master Item"],
  ["s_pelang", "Pelanggan"],
  ["s_vendor", "Vendor"],
  ["s_karyaw", "Karyawan"],
  ["s_perkir", "Perkiraan"],
  ["s_penjua", "Penjualan (header)"],
  ["s_penjud", "Penjualan (baris)"],
  ["s_pembel", "Pembelian (header)"],
  ["s_pembed", "Pembelian (baris)"],
  ["s_jurnal", "Jurnal (header)"],
  ["s_jurnex", "Jurnal (baris)"],
  ["s_kasmsk", "Kas Masuk"],
  ["s_kasmex", "Kas Masuk (baris)"],
  ["s_kasklr", "Kas Keluar"],
  ["s_kaskex", "Kas Keluar (baris)"],
  ["s_stkmas", "Barang Masuk"],
  ["s_stkklr", "Barang Keluar"],
  ["s_ecrlst", "Eceran/POS"],
];

type LookupCfg = { table: string; judul: string; fields: [string, string][]; order: string; limit?: number };

const LOOKUPS: Record<string, LookupCfg> = {
  mauang: { table: "s_mauang", judul: "Mata Uang", fields: [["kode", "Kode"], ["mata_uang", "Mata Uang"], ["terb_cent", "Terbilang Cent"], ["decimal", "Decimal"]], order: "id" },
  kurs: { table: "s_kursma", judul: "Kurs", fields: [["tanggal", "Tanggal"], ["mul_pukul", "Pukul"], ["kurs_beli", "Kurs Beli"], ["kurs_jual", "Kurs Jual"]], order: "tanggal DESC, sys_id DESC", limit: 200 },
  grphjl: { table: "s_grphjl", judul: "Pembulatan Harga Jual", fields: [["nama", "Nama"]], order: "id" },
  negara: { table: "s_negara", judul: "Negara", fields: [["negara", "Negara"]], order: "negara" },
  daerah: { table: "s_daerah", judul: "Daerah", fields: [["daerah", "Daerah"]], order: "daerah" },
  daera2: { table: "s_daera2", judul: "Daerah *2", fields: [["daerah", "Daerah *2"]], order: "daerah" },
  divisi: { table: "s_divisi", judul: "Divisi", fields: [["divisi", "Divisi"], ["harga_jual", "Harga Jual"]], order: "id" },
  grpven: { table: "s_grpven", judul: "Group Vendor", fields: [["nama", "Nama"]], order: "id" },
  grpstk: { table: "s_grpstk", judul: "Group Stock", fields: [["nama", "Nama"]], order: "id" },
  grpst2: { table: "s_grpst2", judul: "Group Stock *2", fields: [["nama", "Nama"]], order: "id" },
  grpst3: { table: "s_grpst3", judul: "Group Stock *3", fields: [["nama", "Nama"]], order: "id" },
  jenpen: { table: "s_jenpen", judul: "Jenis Penjualan", fields: [["jenis", "Jenis"], ["no_pj_pre", "No PJ Pref"]], order: "id" },
  jenpem: { table: "s_jenpem", judul: "Jenis Pembelian", fields: [["jenis", "Jenis"]], order: "id" },
};

@Injectable()
export class UtilService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async dbInfo(): Promise<DbInfoRow[]> {
    const rows: DbInfoRow[] = [];
    const size = await this.pool.query(
      "SELECT pg_size_pretty(pg_database_size(current_database())) AS s, current_database() AS d",
    );
    rows.push({ tabel: "Database", keterangan: size.rows[0].d, nilai: size.rows[0].s });
    for (const [t, label] of TABLES) {
      try {
        const r = await this.pool.query(`SELECT count(*)::int AS n FROM gf.${t}`);
        rows.push({ tabel: label, keterangan: `gf.${t}`, nilai: String(r.rows[0].n) });
      } catch {
        rows.push({ tabel: label, keterangan: `gf.${t}`, nilai: "-" });
      }
    }
    return rows;
  }

  async lookupList(kode: string): Promise<LookupResult> {
    const cfg = LOOKUPS[kode];
    if (!cfg) return { kode, judul: kode, kolom: ["Info"], baris: [["Lookup tidak dikenal."]] };
    const sel = ["id::text AS c0", ...cfg.fields.map(([c], i) => `COALESCE(${c}::text,'') AS c${i + 1}`)].join(", ");
    const lim = cfg.limit ?? 5000;
    const r = await this.pool.query(`SELECT ${sel} FROM gf.${cfg.table} ORDER BY ${cfg.order} LIMIT ${lim}`);
    return {
      kode,
      judul: cfg.judul,
      kolom: ["ID", ...cfg.fields.map(([, label]) => label)],
      baris: (r.rows as Record<string, unknown>[]).map((row) => [
        String(row.c0 ?? ""),
        ...cfg.fields.map((_, i) => String(row[`c${i + 1}`] ?? "")),
      ]),
    };
  }

  // ---------- Periode (Set Proteksi / Tutup Hari / Tutup Tahun) ----------
  private static readonly KH_COLS: Record<string, string> = {
    proteksi: "tgl_kunci",
    tutup_hari: "tutup_hari",
    tutup_buku: "gl_tutup",
  };

  async khInfo(): Promise<DbInfoRow[]> {
    const r = await this.pool.query(
      "SELECT min(tgl_kunci)::text AS proteksi, min(tutup_hari)::text AS tutup_hari, min(gl_tutup)::text AS tutup_buku FROM gf.s_kontro",
    );
    return [
      { tabel: "Set Proteksi Data", keterangan: "gf.s_kontro.tgl_kunci", nilai: r.rows[0].proteksi ?? "-" },
      { tabel: "Tutup Hari", keterangan: "gf.s_kontro.tutup_hari", nilai: r.rows[0].tutup_hari ?? "-" },
      { tabel: "Tutup Tahun Pembukuan", keterangan: "gf.s_kontro.gl_tutup", nilai: r.rows[0].tutup_buku ?? "-" },
    ];
  }

  async khSave(jenis: string, tanggal: string): Promise<string> {
    const col = UtilService.KH_COLS[jenis];
    if (!col) throw new Error("Jenis periode tidak dikenal.");
    await this.pool.query(`UPDATE gf.s_kontro SET ${col} = $1`, [tanggal ? tanggal : null]);
    return `OK:${col}=${tanggal || "(kosong)"}`;
  }

  // ---------- HPP Testing ----------
  async hppTest(): Promise<LookupResult> {
    const total = await this.pool.query(
      "SELECT count(*)::int AS n FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id WHERE d.tgl_hapus IS NULL AND COALESCE(h.als_batal,'')='' AND COALESCE(d.jumlah,0)>0 AND COALESCE(d.hpp,0)=0",
    );
    const r = await this.pool.query(
      `SELECT j.no AS c0, j.tanggal::text AS c1, s.kode_c AS c2, COALESCE(s.nama,'') AS c3, d.jumlah::text AS c4
       FROM gf.s_penjud d JOIN gf.s_penjua j ON j.id=d.penjua_id LEFT JOIN gf.s_stock s ON s.id=d.stock_id
       WHERE d.tgl_hapus IS NULL AND COALESCE(j.als_batal,'')='' AND COALESCE(d.jumlah,0)>0 AND COALESCE(d.hpp,0)=0
       ORDER BY j.id DESC LIMIT 500`,
    );
    return {
      kode: "hpp-test",
      judul: `HPP Testing — ${total.rows[0].n} baris jual tanpa HPP`,
      kolom: ["No", "Tanggal", "Kode", "Nama", "Jumlah"],
      baris: (r.rows as Record<string, unknown>[]).map((x) => [x.c0, x.c1, x.c2, x.c3, x.c4].map((v) => String(v ?? ""))),
    };
  }

  // ---------- Hitung Point ----------
  async pointInfo(): Promise<LookupResult> {
    const cfg = await this.pool.query(
      "SELECT COALESCE(NULLIF(regexp_replace(min(pel_point::text), '[^0-9.]', '', 'g'), '')::numeric, 0)::text AS pel_point, COALESCE(NULLIF(regexp_replace(min(gf_point::text), '[^0-9.]', '', 'g'), '')::numeric, 0)::text AS gf_point FROM gf.s_kontro",
    );
    const pelpoint = Number(cfg.rows[0]?.pel_point ?? 0);
    const gfp = Number(cfg.rows[0]?.gf_point ?? 0);
    const r = await this.pool.query(
      `SELECT COALESCE(p.nama,'') AS nama, round(COALESCE(SUM(j.tot_harga - COALESCE(j.tot_disc,0)),0),2)::text AS belanja
       FROM gf.s_pelang p LEFT JOIN gf.s_penjua j ON j.pelang=p.id AND COALESCE(j.als_batal,'')=''
       WHERE COALESCE(p.hapus_oleh,0)=0 GROUP BY p.nama HAVING COALESCE(SUM(j.tot_harga - COALESCE(j.tot_disc,0)),0) <> 0
       ORDER BY 2 DESC NULLS LAST LIMIT 100`,
    );
    const rows = (r.rows as Record<string, unknown>[]).map((x) => {
      const belanja = Number(x.belanja ?? 0);
      const poin = pelpoint > 0 ? Math.floor(belanja / pelpoint) : 0;
      return [String(x.nama ?? ""), String(x.belanja ?? "0"), String(poin)];
    });
    return {
      kode: "point",
      judul: `Hitung Point — nilai point pelanggan: ${pelpoint || "belum diset"} · point GF: ${gfp}`,
      kolom: ["Pelanggan", "Nilai Belanja", "Estimasi Point"],
      baris: rows,
    };
  }

  // ---------- Proses Laporan Total Transaksi ----------
  async totalTransaksi(dari: string, sampai: string): Promise<LookupResult> {
    const r = await this.pool.query(
      `SELECT to_char(tanggal,'YYYY-MM-DD') AS c0, count(*)::text AS c1,
              round(COALESCE(SUM(tot_harga - COALESCE(tot_disc,0) + COALESCE(ppn_nilai,0)),0),2)::text AS c2
       FROM gf.s_penjua
       WHERE COALESCE(als_batal,'')='' AND to_char(tanggal,'YYYY-MM-DD') >= $1 AND to_char(tanggal,'YYYY-MM-DD') <= $2
       GROUP BY to_char(tanggal,'YYYY-MM-DD') ORDER BY 1 DESC`,
      [dari || "0000-01-01", sampai || "9999-12-31"],
    );
    return {
      kode: "total-transaksi",
      judul: "Proses Laporan Total Transaksi",
      kolom: ["Tanggal", "Jml Nota", "Nilai"],
      baris: (r.rows as Record<string, unknown>[]).map((x) => [x.c0, x.c1, x.c2].map((v) => String(v ?? ""))),
    };
  }

  // ---------- Hapus Data s/d Tanggal ----------
  private static readonly HAPUS_TABLES: [string, string][] = [
    ["s_penjud", "Penjualan (baris)"],
    ["s_penjua", "Penjualan (header)"],
    ["s_pembed", "Pembelian (baris)"],
    ["s_pembel", "Pembelian (header)"],
    ["s_retpjd", "Retur Penjualan (baris)"],
    ["s_retpen", "Retur Penjualan (header)"],
    ["s_retpbd", "Retur Pembelian (baris)"],
    ["s_retpem", "Retur Pembelian (header)"],
    ["s_jurnex", "Jurnal (baris)"],
    ["s_jurnal", "Jurnal (header)"],
    ["s_kaskex", "Kas Keluar (baris)"],
    ["s_kasklr", "Kas Keluar (header)"],
    ["s_kasmex", "Kas Masuk (baris)"],
    ["s_kasmsk", "Kas Masuk (header)"],
  ];

  async hapusPreview(sampai: string): Promise<DbInfoRow[]> {
    const out: DbInfoRow[] = [];
    for (const [t, label] of UtilService.HAPUS_TABLES) {
      try {
        const r = await this.pool.query(
          `SELECT count(*)::int AS n FROM gf.${t} WHERE to_char(tanggal,'YYYY-MM-DD') <= $1`,
          [sampai || "0000-01-01"],
        );
        out.push({ tabel: label, keterangan: `gf.${t}`, nilai: String(r.rows[0].n) });
      } catch {
        out.push({ tabel: label, keterangan: `gf.${t}`, nilai: "-" });
      }
    }
    return out;
  }

  async hapusData(sampai: string, konfirmasi: string): Promise<string> {
    if (konfirmasi !== "HAPUS") throw new Error("Konfirmasi tidak valid — ketik HAPUS untuk melanjutkan.");
    if (!sampai) throw new Error("Tanggal wajib diisi.");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      let total = 0;
      for (const [t] of UtilService.HAPUS_TABLES) {
        try {
          const r = await client.query(
            `DELETE FROM gf.${t} WHERE to_char(tanggal,'YYYY-MM-DD') <= $1`,
            [sampai],
          );
          total += r.rowCount ?? 0;
        } catch {
          /* tabel tanpa kolom tanggal — lewati */
        }
      }
      await client.query("COMMIT");
      return `OK: ${total} baris terhapus (s/d ${sampai}).`;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}
