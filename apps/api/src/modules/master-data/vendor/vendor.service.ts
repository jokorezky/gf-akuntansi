import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { Vendor, VendorInput, VendorPage } from "./vendor.types";

type Kind = "s" | "n" | "b";
type FieldDef = { t: string; sql: string; kind: Kind };

/** Satu sumber kebenaran field vendor (ts name, kolom SQL, jenis). */
const FIELDS: FieldDef[] = [
  { t: "nama", sql: "nama", kind: "s" },
  { t: "npwp", sql: "npwp", kind: "s" },
  { t: "alamat", sql: "alamat", kind: "s" },
  { t: "kodePos", sql: "kode_pos", kind: "s" },
  { t: "daerahId", sql: "daerah", kind: "n" },
  { t: "negara", sql: "negara", kind: "s" },
  { t: "telepon", sql: "telepon", kind: "s" },
  { t: "telepon2", sql: "telepon_2", kind: "s" },
  { t: "telepon3", sql: "telepon_3", kind: "s" },
  { t: "fax", sql: "fax", kind: "s" },
  { t: "hubungi", sql: "hubungi", kind: "s" },
  { t: "hubTelp1", sql: "hub_telp_1", kind: "s" },
  { t: "hubungi2", sql: "hubungi_2", kind: "s" },
  { t: "hubTelp2", sql: "hub_telp_2", kind: "s" },
  { t: "hubungi3", sql: "hubungi_3", kind: "s" },
  { t: "hubTelp3", sql: "hub_telp_3", kind: "s" },
  { t: "email", sql: "email", kind: "s" },
  { t: "website", sql: "website", kind: "s" },
  { t: "rekening1", sql: "rekening_1", kind: "s" },
  { t: "rekening2", sql: "rekening_2", kind: "s" },
  { t: "rekening3", sql: "rekening_3", kind: "s" },
  { t: "termCrd", sql: "term_crd", kind: "n" },
  { t: "muBeli", sql: "mu_beli", kind: "n" },
  { t: "muCredit", sql: "mu_credit", kind: "n" },
  { t: "maxCrd", sql: "max_crd", kind: "s" },
  { t: "maxCrd2", sql: "max_crd2", kind: "s" },
  { t: "max2Crd", sql: "max2_crd", kind: "s" },
  { t: "max2Crd2", sql: "max2_crd2", kind: "s" },
  { t: "max3Crd", sql: "max3_crd", kind: "s" },
  { t: "ppnTipe", sql: "ppn_tipe", kind: "n" },
  { t: "ppnPers", sql: "ppn_pers", kind: "s" },
  { t: "ppnPersex", sql: "ppn_persex", kind: "s" },
  { t: "divisiId", sql: "divisi_id", kind: "n" },
  { t: "userLvl", sql: "user_lvl", kind: "s" },
  { t: "updateMf", sql: "update_mf", kind: "n" },
  { t: "catShow", sql: "cat_show", kind: "b" },
  { t: "catatan", sql: "catatan", kind: "s" },
  { t: "catatan2", sql: "catatan2", kind: "s" },
  { t: "catatan3", sql: "catatan3", kind: "s" },
  { t: "groupVenId", sql: "group_ven", kind: "n" },
  { t: "purreqFrm", sql: "purreq_frm", kind: "s" },
  { t: "purcorFrm", sql: "purcor_frm", kind: "s" },
  { t: "trmstkFrm", sql: "trmstk_frm", kind: "s" },
  { t: "pembelFrm", sql: "pembel_frm", kind: "s" },
  { t: "retpemFrm", sql: "retpem_frm", kind: "s" },
  { t: "dbnpemFrm", sql: "dbnpem_frm", kind: "s" },
  { t: "crnpemFrm", sql: "crnpem_frm", kind: "s" },
  { t: "deppemFrm", sql: "deppem_frm", kind: "s" },
  { t: "lpemmaFrm", sql: "lpemma_frm", kind: "s" },
  { t: "pbPurreq", sql: "pb_purreq", kind: "b" },
  { t: "pbPurcor", sql: "pb_purcor", kind: "b" },
  { t: "pbTrmstk", sql: "pb_trmstk", kind: "b" },
  { t: "pbCash", sql: "pb_cash", kind: "b" },
  { t: "pbCredit", sql: "pb_credit", kind: "b" },
  { t: "pbCabang", sql: "pb_cabang", kind: "b" },
  { t: "pbRetcash", sql: "pb_retcash", kind: "b" },
  { t: "pbRetcrd", sql: "pb_retcrd", kind: "b" },
  { t: "pbDn", sql: "pb_dn", kind: "b" },
  { t: "pbCn", sql: "pb_cn", kind: "b" },
  { t: "pbDeposit", sql: "pb_deposit", kind: "b" },
  { t: "pbHarLst", sql: "pb_har_lst", kind: "b" },
];

const SELECT = `SELECT id::int AS id, ${FIELDS.map((f) => `${f.sql} AS "${f.t}"`).join(", ")} FROM gf.s_vendor`;

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}

@Injectable()
export class VendorService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<VendorPage> {
    const params: unknown[] = [];
    let where = "WHERE hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (nama ILIKE $${params.length} OR alamat ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_vendor ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `${SELECT} ${where} ORDER BY id LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as Vendor[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<Vendor | null> {
    const r = await this.pool.query(`${SELECT} WHERE id=$1 AND hapus_oleh IS NULL`, [id]);
    return (r.rows[0] as Vendor) ?? null;
  }

  async create(input: VendorInput, userId = 1): Promise<Vendor> {
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
      INSERT INTO gf.s_vendor (${cols})
      VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_vendor), ${placeholders.join(",")},
              $${i++}, now()::date, to_char(now(),'HH24:MI:SS'))
      RETURNING id`;
    const r = await this.pool.query(sql, vals);
    return (await this.byId(r.rows[0].id as number))!;
  }

  async update(id: number, input: VendorInput, userId = 1): Promise<Vendor | null> {
    const defs = FIELDS.slice();
    const sets: string[] = [];
    const vals: unknown[] = [id];
    let i = 2;
    for (const f of defs) {
      const v = (input as Record<string, unknown>)[f.t];
      sets.push(`${f.sql}=$${i++}`);
      vals.push(f.kind === "s" ? nn(v) : v ?? null);
    }
    vals.push(userId);
    const sql = `
      UPDATE gf.s_vendor SET ${sets.join(", ")},
        ubah_oleh=$${i++}, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
      WHERE id=$1 AND hapus_oleh IS NULL`;
    await this.pool.query(sql, vals);
    return this.byId(id);
  }

  async softDelete(id: number, userId = 1): Promise<boolean> {
    const r = await this.pool.query(
      `UPDATE gf.s_vendor SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
