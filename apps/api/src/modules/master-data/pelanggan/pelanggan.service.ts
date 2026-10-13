import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { Pelanggan, PelangganInput, PelangganPage } from "./pelanggan.types";

type Kind = "s" | "n" | "b" | "d";
type FieldDef = { t: string; sql: string; kind: Kind };

/** Satu sumber kebenaran field pelanggan (dari deep-scan form GF 7 tab). */
const FIELDS: FieldDef[] = [
  { t: "tipe", sql: "tipe", kind: "n" },
  { t: "tglDaftar", sql: "tgl_daftar", kind: "d" },
  { t: "nonAktif", sql: "non_aktif", kind: "d" },
  { t: "kode", sql: "kode", kind: "s" },
  { t: "title", sql: "title", kind: "n" },
  { t: "nama", sql: "nama", kind: "s" },
  { t: "alamat", sql: "alamat", kind: "s" },
  { t: "kodePos", sql: "kode_pos", kind: "s" },
  { t: "daerahId", sql: "daerah", kind: "n" },
  { t: "daerah2Id", sql: "daerah2", kind: "n" },
  { t: "negara", sql: "negara", kind: "n" },
  { t: "npwp", sql: "npwp", kind: "s" },
  { t: "npwpNama", sql: "npwp_nama", kind: "s" },
  { t: "npwpAlamat", sql: "npwp_alama", kind: "s" },
  { t: "telepon", sql: "telepon", kind: "s" },
  { t: "telepon2", sql: "telepon_2", kind: "s" },
  { t: "telepon3", sql: "telepon_3", kind: "s" },
  { t: "fax", sql: "fax", kind: "s" },
  { t: "email", sql: "email", kind: "s" },
  { t: "website", sql: "website", kind: "s" },
  { t: "hubungi", sql: "hubungi", kind: "s" },
  { t: "hubTelp1", sql: "hub_telp_1", kind: "s" },
  { t: "hubungi2", sql: "hubungi_2", kind: "s" },
  { t: "hubTelp2", sql: "hub_telp_2", kind: "s" },
  { t: "hubungi3", sql: "hubungi_3", kind: "s" },
  { t: "hubTelp3", sql: "hub_telp_3", kind: "s" },
  { t: "termCrd", sql: "term_crd", kind: "n" },
  { t: "termCrdex", sql: "term_crdex", kind: "n" },
  { t: "spsDisc", sql: "sps_disc", kind: "s" },
  { t: "discPri", sql: "disc_pri", kind: "n" },
  { t: "discPri2", sql: "disc_pri2", kind: "s" },
  { t: "muCredit", sql: "mu_credit", kind: "n" },
  { t: "muJual", sql: "mu_jual", kind: "n" },
  { t: "maxCrd", sql: "max_crd", kind: "n" },
  { t: "maxCrd2", sql: "max_crd2", kind: "n" },
  { t: "max2Crd", sql: "max2_crd", kind: "n" },
  { t: "max2Crd2", sql: "max2_crd2", kind: "n" },
  { t: "max3Crd", sql: "max3_crd", kind: "n" },
  { t: "tanpaCrdc", sql: "tanpa_crdc", kind: "b" },
  { t: "blackList", sql: "black_list", kind: "b" },
  { t: "pjHarLst", sql: "pj_har_lst", kind: "b" },
  { t: "pelGabung", sql: "pel_gabung", kind: "b" },
  { t: "catShow", sql: "cat_show", kind: "b" },
  { t: "groupPelId", sql: "group_pel", kind: "n" },
  { t: "groupPe2Id", sql: "group_pe2", kind: "n" },
  { t: "jenpenId", sql: "jenpen_id", kind: "n" },
  { t: "fakpjkNo", sql: "fakpjk_no", kind: "s" },
  { t: "salesId", sql: "sales", kind: "n" },
  { t: "collectorId", sql: "collector", kind: "n" },
  { t: "divisiId", sql: "divisi_id", kind: "n" },
  { t: "grphjlId", sql: "grphjl_id", kind: "n" },
  { t: "hargaJual", sql: "harga_jual", kind: "n" },
  { t: "ppnTipe", sql: "ppn_tipe", kind: "n" },
  { t: "ppnPers", sql: "ppn_pers", kind: "s" },
  { t: "ppnPersex", sql: "ppn_persex", kind: "s" },
  { t: "setadj1per", sql: "setadj1per", kind: "s" },
  { t: "setadj2per", sql: "setadj2per", kind: "s" },
  { t: "setadj3per", sql: "setadj3per", kind: "s" },
  { t: "setadj4per", sql: "setadj4per", kind: "s" },
  { t: "setadj5per", sql: "setadj5per", kind: "s" },
  { t: "setadj1nil", sql: "setadj1nil", kind: "s" },
  { t: "setadj2nil", sql: "setadj2nil", kind: "s" },
  { t: "setadj3nil", sql: "setadj3nil", kind: "s" },
  { t: "setadj4nil", sql: "setadj4nil", kind: "s" },
  { t: "setadj5nil", sql: "setadj5nil", kind: "s" },
  { t: "stsPers", sql: "sts_pers", kind: "s" },
  { t: "agama", sql: "agama", kind: "n" },
  { t: "noKtp", sql: "no_ktp", kind: "s" },
  { t: "jenisKel", sql: "jenis_kel", kind: "n" },
  { t: "tmpLahir", sql: "tmp_lahir", kind: "s" },
  { t: "tglLahir", sql: "tgl_lahir", kind: "d" },
  { t: "pendAkhir", sql: "pend_akhir", kind: "s" },
  { t: "krmNama", sql: "krm_nama", kind: "s" },
  { t: "krmAlamat", sql: "krm_alamat", kind: "s" },
  { t: "userLvl", sql: "user_lvl", kind: "s" },
  { t: "catatan", sql: "catatan", kind: "s" },
];

function col(f: FieldDef): string {
  if (f.kind === "d") return `to_char(${f.sql},'YYYY-MM-DD') AS "${f.t}"`;
  if (f.kind === "n") return `${f.sql}::int AS "${f.t}"`;
  return `${f.sql} AS "${f.t}"`;
}

const SELECT = `SELECT id::int AS id, ${FIELDS.map(col).join(", ")} FROM gf.s_pelang`;

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}

@Injectable()
export class PelangganService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<PelangganPage> {
    const params: unknown[] = [];
    let where = "WHERE hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (nama ILIKE $${params.length} OR kode ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_pelang ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `${SELECT} ${where} ORDER BY id LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as Pelanggan[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<Pelanggan | null> {
    const r = await this.pool.query(`${SELECT} WHERE id=$1 AND hapus_oleh IS NULL`, [id]);
    return (r.rows[0] as Pelanggan) ?? null;
  }

  async create(input: PelangganInput, userId = 1): Promise<Pelanggan> {
    const cols = ["id", ...FIELDS.map((f) => f.sql), "input_oleh", "tgl_input", "jam_input"].join(", ");
    const placeholders: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    for (const f of FIELDS) {
      const v = (input as Record<string, unknown>)[f.t];
      vals.push(f.kind === "s" ? nn(v) : v ?? null);
      placeholders.push(`$${i++}`);
    }
    vals.push(userId);
    const sql = `
      INSERT INTO gf.s_pelang (${cols})
      VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_pelang), ${placeholders.join(",")},
              $${i++}, now()::date, to_char(now(),'HH24:MI:SS'))
      RETURNING id`;
    const r = await this.pool.query(sql, vals);
    return (await this.byId(r.rows[0].id as number))!;
  }

  async update(id: number, input: PelangganInput, userId = 1): Promise<Pelanggan | null> {
    const sets: string[] = [];
    const vals: unknown[] = [id];
    let i = 2;
    for (const f of FIELDS) {
      const v = (input as Record<string, unknown>)[f.t];
      sets.push(`${f.sql}=$${i++}`);
      vals.push(f.kind === "s" ? nn(v) : v ?? null);
    }
    vals.push(userId);
    const sql = `
      UPDATE gf.s_pelang SET ${sets.join(", ")},
        ubah_oleh=$${i++}, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
      WHERE id=$1 AND hapus_oleh IS NULL`;
    await this.pool.query(sql, vals);
    return this.byId(id);
  }

  async softDelete(id: number, userId = 1): Promise<boolean> {
    const r = await this.pool.query(
      `UPDATE gf.s_pelang SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
