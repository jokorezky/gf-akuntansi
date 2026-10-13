import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { GlCekKursPage, GlCekPerantaraPage, GlSaldoAkhirPage } from "./gl-checks.types";

function s(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}

/** Prefix kode akun per kelas (mengikuti combo GF). */
const KELAS_PREFIX: Record<string, string> = {
  AKTIVA: "1",
  KEWAJIBAN: "2",
  EKUITAS: "3",
  PENDAPATAN: "4",
  "HARGA POKOK PENJUALAN": "5",
  "BIAYA/BEBAN": "6",
  "PENDAPATAN LAINNYA": "8",
  "BIAYA/BEBAN LAINNYA": "9",
};

/** Golongan akun (kolom gf.s_perkir.golongan). */
const GOLONGAN_CODE: Record<string, string> = {
  "Golongan Kas/Bank": "1",
  "Golongan Piutang/Hutang": "8",
  "Golongan Aktiva Tetap": "7",
};

@Injectable()
export class GlChecksService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async cekKurs(mu?: string, dari?: string, sampai?: string, limit = 500, offset = 0): Promise<GlCekKursPage> {
    const params: unknown[] = [];
    let where =
      "WHERE j.hapus_oleh IS NULL AND d.nilai IS NOT NULL AND d.nilai <> 0 AND d.nilai_3 IS NOT NULL" +
      " AND round(d.nilai_3,2) <> round(d.nilai,2)";
    if (mu && mu.trim() && mu !== "---") {
      params.push(mu.trim());
      where += ` AND m.kode = $${params.length}`;
    }
    if (dari && dari.trim()) {
      params.push(dari.trim());
      where += ` AND d.tanggal >= $${params.length}::date`;
    }
    if (sampai && sampai.trim()) {
      params.push(sampai.trim());
      where += ` AND d.tanggal <= $${params.length}::date`;
    }
    const total = await this.pool.query(
      `SELECT count(*)::int AS n FROM gf.s_jurnex d
       JOIN gf.s_jurnal j ON j.id=d.jurnal_id
       LEFT JOIN gf.s_mauang m ON m.id = d.mauang
       ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT to_char(d.tanggal,'DD/MM/YYYY') AS tanggal, COALESCE(j.no::text,'00000000') AS no, j.catatan,
              COALESCE(m.kode, d.mauang::text) AS mu,
              CASE WHEN d.debet THEN d.nilai::text ELSE '' END AS debet,
              CASE WHEN NOT d.debet THEN d.nilai::text ELSE '' END AS kredit,
              round(d.nilai_3/NULLIF(d.nilai,0), 4)::text AS kurs,
              CASE WHEN d.debet THEN d.nilai_3::text ELSE '' END AS debet_idr,
              CASE WHEN NOT d.debet THEN d.nilai_3::text ELSE '' END AS kredit_idr
       FROM gf.s_jurnex d
       JOIN gf.s_jurnal j ON j.id=d.jurnal_id
       LEFT JOIN gf.s_mauang m ON m.id = d.mauang
       ${where} ORDER BY d.tanggal, d.no LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      total: total.rows[0].n as number,
      rows: rows.rows.map((r) => ({
        tanggal: s(r.tanggal), no: s(r.no), catatan: s(r.catatan), mu: s(r.mu),
        debet: s(r.debet), kredit: s(r.kredit), kurs: s(r.kurs),
        debetIdr: s(r.debet_idr), kreditIdr: s(r.kredit_idr),
      })),
    };
  }

  async muList(): Promise<string[]> {
    const r = await this.pool.query(`SELECT kode FROM gf.s_mauang WHERE hapus_oleh IS NULL ORDER BY kode`);
    return r.rows.map((x) => s(x.kode));
  }

  async cekPerantara(dari?: string, sampai?: string, limit = 500, offset = 0): Promise<GlCekPerantaraPage> {
    const params: unknown[] = [];
    let where = "WHERE d.perkir_id IN (SELECT id FROM gf.s_perkir WHERE kode LIKE '199%')";
    if (dari && dari.trim()) {
      params.push(dari.trim());
      where += ` AND d.tanggal >= $${params.length}::date`;
    }
    if (sampai && sampai.trim()) {
      params.push(sampai.trim());
      where += ` AND d.tanggal <= $${params.length}::date`;
    }
    const total = await this.pool.query(
      `SELECT count(*)::int AS n FROM (
         SELECT d.tanggal FROM gf.s_jurnex d ${where}
         GROUP BY d.tanggal
         HAVING round(SUM(CASE WHEN d.debet THEN d.nilai ELSE -d.nilai END),2) <> 0
       ) x`,
      params,
    );
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT to_char(d.tanggal,'DD/MM/YYYY') AS tanggal,
              round(SUM(CASE WHEN d.debet THEN d.nilai ELSE 0 END),2)::text AS debet,
              round(SUM(CASE WHEN NOT d.debet THEN d.nilai ELSE 0 END),2)::text AS kredit,
              round(SUM(CASE WHEN d.debet THEN d.nilai ELSE -d.nilai END),2)::text AS selisih
       FROM gf.s_jurnex d ${where}
       GROUP BY d.tanggal
       HAVING round(SUM(CASE WHEN d.debet THEN d.nilai ELSE -d.nilai END),2) <> 0
       ORDER BY d.tanggal DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      total: total.rows[0].n as number,
      rows: rows.rows.map((r) => ({ tanggal: s(r.tanggal), debet: s(r.debet), kredit: s(r.kredit), selisih: s(r.selisih) })),
    };
  }

  async saldoAkhir(kelas?: string, golongan?: string, sampai?: string, limit = 500, offset = 0): Promise<GlSaldoAkhirPage> {
    const makeFilter = (arr: unknown[]): string => {
      let w = "";
      if (kelas && kelas.trim() && KELAS_PREFIX[kelas.trim().toUpperCase()]) {
        arr.push(`${KELAS_PREFIX[kelas.trim().toUpperCase()]}%`);
        w += ` AND p.kode LIKE $${arr.length}`;
      }
      if (golongan && golongan.trim() && golongan.trim() !== "---") {
        if (GOLONGAN_CODE[golongan.trim()]) {
          arr.push(Number(GOLONGAN_CODE[golongan.trim()]));
          w += ` AND p.golongan = $${arr.length}`;
        } else if (/lainnya/i.test(golongan)) {
          w += ` AND p.golongan NOT IN (1,7,8)`;
        }
      }
      return w;
    };

    const countParams: unknown[] = [];
    const total = await this.pool.query(
      `SELECT count(*)::int AS n FROM gf.s_perkir p WHERE p.hapus_oleh IS NULL AND p.header = false${makeFilter(countParams)}`,
      countParams,
    );

    const params: unknown[] = [];
    let join = "LEFT JOIN gf.s_jurnex d ON d.perkir_id=p.id";
    if (sampai && sampai.trim()) {
      params.push(sampai.trim());
      join += ` AND d.tanggal <= $${params.length}::date`;
    }
    const where = `WHERE p.hapus_oleh IS NULL AND p.header = false${makeFilter(params)}`;
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT p.kode, p.nama, COALESCE(m.kode,'') AS mu,
              round(COALESCE(p.sal_awal_3, p.sal_awal, 0) + COALESCE(SUM(CASE WHEN d.debet THEN d.nilai ELSE -d.nilai END),0),2)::text AS saldo
       FROM gf.s_perkir p LEFT JOIN gf.s_mauang m ON m.id = p.mauang ${join}
       ${where} GROUP BY p.id, p.kode, p.nama, m.kode, p.sal_awal_3, p.sal_awal
       ORDER BY p.kode LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      total: total.rows[0].n as number,
      rows: rows.rows.map((r, i) => ({
        no: offset + i + 1,
        kode: r.kode && String(r.kode).length > 1 ? `${String(r.kode).slice(0, 1)}.${String(r.kode).slice(1)}` : s(r.kode),
        nama: s(r.nama),
        mu: s(r.mu),
        saldo: s(r.saldo),
      })),
    };
  }
}
