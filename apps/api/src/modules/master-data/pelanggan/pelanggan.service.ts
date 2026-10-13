import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { Pelanggan, PelangganInput, PelangganPage } from "./pelanggan.types";

const COLS = `
  id::int AS id, nama, kode, title, alamat, kode_pos AS "kodePos", daerah AS "daerahId", negara AS "negaraId",
  npwp, telepon, telepon_2 AS "telepon2", telepon_3 AS "telepon3", fax, email, website,
  hubungi, hub_telp_1 AS "hubTelp1", tipe, group_pel AS "groupPelId", jenpen_id AS "jenpenId",
  term_crd AS "termCrd", max_crd::text AS "maxCrd", catatan`;

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
      where += ` AND nama ILIKE $${params.length}`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_pelang ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${COLS} FROM gf.s_pelang ${where} ORDER BY id LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as Pelanggan[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<Pelanggan | null> {
    const r = await this.pool.query(`SELECT ${COLS} FROM gf.s_pelang WHERE id=$1 AND hapus_oleh IS NULL`, [id]);
    return (r.rows[0] as Pelanggan) ?? null;
  }

  async create(input: PelangganInput, userId = 1): Promise<Pelanggan> {
    const sql = `
      INSERT INTO gf.s_pelang
        (id, nama, kode, title, alamat, kode_pos, daerah, negara, npwp, telepon, telepon_2, telepon_3, fax,
         email, website, hubungi, hub_telp_1, tipe, group_pel, jenpen_id, term_crd, max_crd, catatan,
         input_oleh, tgl_input, jam_input)
      VALUES
        ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_pelang), $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
         $13,$14,$15,$16,$17,$18,$19,$20,$21,$22,
         $23, now()::date, to_char(now(),'HH24:MI:SS'))
      RETURNING id`;
    const v = [
      input.nama, nn(input.kode), nn(input.title), nn(input.alamat), nn(input.kodePos), nn(input.daerahId),
      nn(input.negaraId), nn(input.npwp), nn(input.telepon), nn(input.telepon2), nn(input.telepon3), nn(input.fax),
      nn(input.email), nn(input.website), nn(input.hubungi), nn(input.hubTelp1), nn(input.tipe),
      nn(input.groupPelId), nn(input.jenpenId), nn(input.termCrd), nn(input.maxCrd), nn(input.catatan), userId,
    ];
    const r = await this.pool.query(sql, v);
    return (await this.byId(Number(r.rows[0].id)))!;
  }

  async update(id: number, input: PelangganInput, userId = 1): Promise<Pelanggan | null> {
    const sql = `
      UPDATE gf.s_pelang SET
        nama=$2, kode=$3, title=$4, alamat=$5, kode_pos=$6, daerah=$7, negara=$8, npwp=$9, telepon=$10,
        telepon_2=$11, telepon_3=$12, fax=$13, email=$14, website=$15, hubungi=$16, hub_telp_1=$17,
        tipe=$18, group_pel=$19, jenpen_id=$20, term_crd=$21, max_crd=$22, catatan=$23,
        ubah_oleh=$24, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
      WHERE id=$1 AND hapus_oleh IS NULL`;
    const v = [
      id, input.nama, nn(input.kode), nn(input.title), nn(input.alamat), nn(input.kodePos), nn(input.daerahId),
      nn(input.negaraId), nn(input.npwp), nn(input.telepon), nn(input.telepon2), nn(input.telepon3), nn(input.fax),
      nn(input.email), nn(input.website), nn(input.hubungi), nn(input.hubTelp1), nn(input.tipe),
      nn(input.groupPelId), nn(input.jenpenId), nn(input.termCrd), nn(input.maxCrd), nn(input.catatan), userId,
    ];
    await this.pool.query(sql, v);
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
