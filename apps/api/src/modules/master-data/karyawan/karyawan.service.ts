import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { Karyawan, KaryawanInput, KaryawanPage } from "./karyawan.types";

const SELECT = `
  SELECT id, nama, alamat, telepon, komisi::text AS komisi, catatan,
         to_char(non_aktif,'YYYY-MM-DD') AS "nonAktif",
         sales, supir, helper, collector, admin,
         jenpen_id AS "jenpenId", divisi_id AS "divisiId",
         grpstk, grpst2, grpst3
  FROM gf.s_karyaw
`;

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}

@Injectable()
export class KaryawanService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<KaryawanPage> {
    const params: unknown[] = [];
    let where = "WHERE hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND nama ILIKE $${params.length}`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_karyaw ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `${SELECT} ${where} ORDER BY id LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as Karyawan[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<Karyawan | null> {
    const r = await this.pool.query(`${SELECT} WHERE id = $1 AND hapus_oleh IS NULL`, [id]);
    return (r.rows[0] as Karyawan) ?? null;
  }

  async create(input: KaryawanInput, userId = 1): Promise<Karyawan> {
    const sql = `
      INSERT INTO gf.s_karyaw
        (id, nama, alamat, telepon, komisi, catatan, non_aktif,
         sales, supir, helper, collector, admin, jenpen_id, divisi_id,
         grpstk, grpst2, grpst3,
         input_oleh, tgl_input, jam_input)
      VALUES
        ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_karyaw), $1,$2,$3,$4,$5,$6,
         $7,$8,$9,$10,$11,$12,$13,
         $14,$15,$16,
         $17, now()::date, to_char(now(),'HH24:MI:SS'))
      RETURNING id`;
    const vals = [
      input.nama, nn(input.alamat), nn(input.telepon), nn(input.komisi), nn(input.catatan),
      nn(input.nonAktif), input.sales ?? false, input.supir ?? false, input.helper ?? false,
      input.collector ?? false, input.admin ?? false, nn(input.jenpenId), nn(input.divisiId),
      nn(input.grpstk), nn(input.grpst2), nn(input.grpst3), userId,
    ];
    const r = await this.pool.query(sql, vals);
    return (await this.byId(r.rows[0].id as number))!;
  }

  async update(id: number, input: KaryawanInput, userId = 1): Promise<Karyawan | null> {
    const sql = `
      UPDATE gf.s_karyaw SET
        nama=$2, alamat=$3, telepon=$4, komisi=$5, catatan=$6, non_aktif=$7,
        sales=$8, supir=$9, helper=$10, collector=$11, admin=$12, jenpen_id=$13, divisi_id=$14,
        grpstk=$15, grpst2=$16, grpst3=$17,
        ubah_oleh=$18, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
      WHERE id=$1 AND hapus_oleh IS NULL`;
    const vals = [
      id, input.nama, nn(input.alamat), nn(input.telepon), nn(input.komisi), nn(input.catatan),
      nn(input.nonAktif), input.sales ?? false, input.supir ?? false, input.helper ?? false,
      input.collector ?? false, input.admin ?? false, nn(input.jenpenId), nn(input.divisiId),
      nn(input.grpstk), nn(input.grpst2), nn(input.grpst3), userId,
    ];
    await this.pool.query(sql, vals);
    return this.byId(id);
  }

  async softDelete(id: number, userId = 1): Promise<boolean> {
    const r = await this.pool.query(
      `UPDATE gf.s_karyaw SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
