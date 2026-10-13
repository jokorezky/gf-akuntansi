import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { Vendor, VendorInput, VendorPage } from "./vendor.types";

const COLS = `
  id, nama, npwp, alamat, kode_pos AS "kodePos", daerah AS "daerahId",
  telepon, telepon_2 AS "telepon2", telepon_3 AS "telepon3", fax,
  rekening_1 AS "rekening1", rekening_2 AS "rekening2", rekening_3 AS "rekening3",
  email, website, hubungi, hub_telp_1 AS "hubTelp1",
  term_crd AS "termCrd", max_crd::text AS "maxCrd", ppn_tipe AS "ppnTipe", ppn_pers::text AS "ppnPers",
  group_ven AS "groupVenId", divisi_id AS "divisiId", catatan`;

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
      where += ` AND nama ILIKE $${params.length}`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_vendor ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${COLS} FROM gf.s_vendor ${where} ORDER BY id LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as Vendor[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<Vendor | null> {
    const r = await this.pool.query(`SELECT ${COLS} FROM gf.s_vendor WHERE id=$1 AND hapus_oleh IS NULL`, [id]);
    return (r.rows[0] as Vendor) ?? null;
  }

  async create(input: VendorInput, userId = 1): Promise<Vendor> {
    const sql = `
      INSERT INTO gf.s_vendor
        (id, nama, npwp, alamat, kode_pos, daerah, telepon, telepon_2, telepon_3, fax,
         rekening_1, rekening_2, rekening_3, email, website, hubungi, hub_telp_1,
         term_crd, max_crd, ppn_tipe, ppn_pers, group_ven, divisi_id, catatan,
         input_oleh, tgl_input, jam_input)
      VALUES
        ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_vendor), $1,$2,$3,$4,$5,$6,$7,$8,$9,
         $10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,
         $24, now()::date, to_char(now(),'HH24:MI:SS'))
      RETURNING id`;
    const v = [
      input.nama, nn(input.npwp), nn(input.alamat), nn(input.kodePos), nn(input.daerahId),
      nn(input.telepon), nn(input.telepon2), nn(input.telepon3), nn(input.fax),
      nn(input.rekening1), nn(input.rekening2), nn(input.rekening3), nn(input.email), nn(input.website),
      nn(input.hubungi), nn(input.hubTelp1), nn(input.termCrd), nn(input.maxCrd), nn(input.ppnTipe),
      nn(input.ppnPers), nn(input.groupVenId), nn(input.divisiId), nn(input.catatan), userId,
    ];
    const r = await this.pool.query(sql, v);
    return (await this.byId(r.rows[0].id as number))!;
  }

  async update(id: number, input: VendorInput, userId = 1): Promise<Vendor | null> {
    const sql = `
      UPDATE gf.s_vendor SET
        nama=$2, npwp=$3, alamat=$4, kode_pos=$5, daerah=$6, telepon=$7, telepon_2=$8, telepon_3=$9, fax=$10,
        rekening_1=$11, rekening_2=$12, rekening_3=$13, email=$14, website=$15, hubungi=$16, hub_telp_1=$17,
        term_crd=$18, max_crd=$19, ppn_tipe=$20, ppn_pers=$21, group_ven=$22, divisi_id=$23, catatan=$24,
        ubah_oleh=$25, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
      WHERE id=$1 AND hapus_oleh IS NULL`;
    const v = [
      id, input.nama, nn(input.npwp), nn(input.alamat), nn(input.kodePos), nn(input.daerahId),
      nn(input.telepon), nn(input.telepon2), nn(input.telepon3), nn(input.fax),
      nn(input.rekening1), nn(input.rekening2), nn(input.rekening3), nn(input.email), nn(input.website),
      nn(input.hubungi), nn(input.hubTelp1), nn(input.termCrd), nn(input.maxCrd), nn(input.ppnTipe),
      nn(input.ppnPers), nn(input.groupVenId), nn(input.divisiId), nn(input.catatan), userId,
    ];
    await this.pool.query(sql, v);
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
