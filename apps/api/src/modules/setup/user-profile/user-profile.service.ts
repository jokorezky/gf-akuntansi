import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { SecGrup, SecGrupInput, SecGrupPage, SecUser, SecUserInput, SecUserPage } from "./user-profile.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}

@Injectable()
export class UserProfileService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  // ---------- GROUP (s_securi) ----------
  async grupList(limit = 100, offset = 0, q?: string): Promise<SecGrupPage> {
    const params: unknown[] = [];
    let where = "WHERE COALESCE(g.hapus_oleh,0)=0";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (COALESCE(g.user,'') ILIKE $${params.length} OR COALESCE(g.pemilik,'') ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_securi g ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT g.id::int AS id, g.user AS nama, g.pemilik,
              CASE WHEN g.security IS NOT NULL THEN 'bitmap '||length(g.security)||' B' ELSE NULL END AS "securityInfo",
              (SELECT count(*)::int FROM gf.s_secusr u WHERE u.securi_id=g.id AND COALESCE(u.hapus_oleh,0)=0) AS "jumlahUser"
       FROM gf.s_securi g ${where} ORDER BY g.id LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as SecGrup[], total: total.rows[0].n as number };
  }

  async grupById(id: number): Promise<SecGrup | null> {
    const r = await this.pool.query(
      `SELECT g.id::int AS id, g.user AS nama, g.pemilik,
              CASE WHEN g.security IS NOT NULL THEN 'bitmap '||length(g.security)||' B' ELSE NULL END AS "securityInfo",
              (SELECT count(*)::int FROM gf.s_secusr u WHERE u.securi_id=g.id AND COALESCE(u.hapus_oleh,0)=0) AS "jumlahUser"
       FROM gf.s_securi g WHERE g.id=$1 AND COALESCE(g.hapus_oleh,0)=0`,
      [id],
    );
    return (r.rows[0] as SecGrup) ?? null;
  }

  async grupCreate(input: SecGrupInput, userId = 1): Promise<SecGrup> {
    const r = await this.pool.query(
      `INSERT INTO gf.s_securi (id, "user", pemilik, input_oleh, tgl_input, jam_input)
       VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_securi), $1, $2, $3, now()::date, to_char(now(),'HH24:MI:SS'))
       RETURNING id`,
      [nn(input.nama), nn(input.pemilik), userId],
    );
    return (await this.grupById(r.rows[0].id as number))!;
  }

  async grupUpdate(id: number, input: SecGrupInput, userId = 1): Promise<SecGrup | null> {
    await this.pool.query(
      `UPDATE gf.s_securi SET "user"=$2, pemilik=$3, ubah_oleh=$4, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND COALESCE(hapus_oleh,0)=0`,
      [id, nn(input.nama), nn(input.pemilik), userId],
    );
    return this.grupById(id);
  }

  async grupSoftDelete(id: number, userId = 1): Promise<boolean> {
    const r = await this.pool.query(
      `UPDATE gf.s_securi SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND COALESCE(hapus_oleh,0)=0`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  // ---------- USER (s_secusr) ----------
  async userList(limit = 200, offset = 0, q?: string): Promise<SecUserPage> {
    const params: unknown[] = [];
    let where = "WHERE COALESCE(u.hapus_oleh,0)=0";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (COALESCE(u.user,'') ILIKE $${params.length} OR COALESCE(u.pemilik,'') ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_secusr u ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT u.id::int AS id, u.user, u.securi_id AS "securiId", g.user AS "grupNama", u.pemilik, u.sales,
              u.userpusat, u.workstat, u.ip, to_char(u.login_tgl,'YYYY-MM-DD') AS "loginTgl", u.login_jam AS "loginJam",
              (u.passwrd IS NOT NULL AND u.passwrd <> '') AS "hasPassword"
       FROM gf.s_secusr u LEFT JOIN gf.s_securi g ON g.id=u.securi_id ${where} ORDER BY u.id LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as SecUser[], total: total.rows[0].n as number };
  }

  async userById(id: number): Promise<SecUser | null> {
    const r = await this.pool.query(
      `SELECT u.id::int AS id, u.user, u.securi_id AS "securiId", g.user AS "grupNama", u.pemilik, u.sales,
              u.userpusat, u.workstat, u.ip, to_char(u.login_tgl,'YYYY-MM-DD') AS "loginTgl", u.login_jam AS "loginJam",
              (u.passwrd IS NOT NULL AND u.passwrd <> '') AS "hasPassword"
       FROM gf.s_secusr u LEFT JOIN gf.s_securi g ON g.id=u.securi_id WHERE u.id=$1 AND COALESCE(u.hapus_oleh,0)=0`,
      [id],
    );
    return (r.rows[0] as SecUser) ?? null;
  }

  async userCreate(input: SecUserInput, userId = 1): Promise<SecUser> {
    const r = await this.pool.query(
      `INSERT INTO gf.s_secusr (id, "user", securi_id, pemilik, sales, userpusat, workstat, ip, passwrd,
         input_oleh, tgl_input, jam_input)
       VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_secusr), $1, $2, $3, $4, COALESCE($5,false), $6, $7, $8,
         $9, now()::date, to_char(now(),'HH24:MI:SS'))
       RETURNING id`,
      [nn(input.user), nn(input.securiId), nn(input.pemilik), nn(input.sales), input.userpusat ?? false,
       nn(input.workstat), nn(input.ip), nn(input.password), userId],
    );
    return (await this.userById(r.rows[0].id as number))!;
  }

  async userUpdate(id: number, input: SecUserInput, userId = 1): Promise<SecUser | null> {
    await this.pool.query(
      `UPDATE gf.s_secusr SET "user"=$2, securi_id=$3, pemilik=$4, sales=$5, userpusat=COALESCE($6,false),
         workstat=$7, ip=$8, passwrd=COALESCE($9, passwrd),
         ubah_oleh=$10, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND COALESCE(hapus_oleh,0)=0`,
      [id, nn(input.user), nn(input.securiId), nn(input.pemilik), nn(input.sales), input.userpusat ?? false,
       nn(input.workstat), nn(input.ip), nn(input.password), userId],
    );
    return this.userById(id);
  }

  /** Duplicate (tombol khas GF): salin user (tanpa password). */
  async userDuplicate(id: number, userId = 1): Promise<SecUser | null> {
    const src = await this.pool.query(
      `SELECT "user", securi_id, pemilik, sales, userpusat, workstat, ip, khusus, pelang, harga_jual, stkpin_gdg,
              ecrlst_grp, ecrlst_id, ecrgrp_lmt, mu_credit
       FROM gf.s_secusr WHERE id=$1 AND COALESCE(hapus_oleh,0)=0`,
      [id],
    );
    if (!src.rows[0]) return null;
    const s = src.rows[0] as Record<string, unknown>;
    const r = await this.pool.query(
      `INSERT INTO gf.s_secusr (id, "user", securi_id, pemilik, sales, userpusat, workstat, ip,
         khusus, pelang, harga_jual, stkpin_gdg, ecrlst_grp, ecrlst_id, ecrgrp_lmt, mu_credit,
         input_oleh, tgl_input, jam_input)
       VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_secusr), $1, $2, $3, $4, COALESCE($5,false), $6, $7,
         $8, $9, $10, $11, $12, $13, $14, $15, $16, now()::date, to_char(now(),'HH24:MI:SS'))
       RETURNING id`,
      [`${String(s.user ?? "USER").slice(0, 5)} COPY`, s.securi_id, s.pemilik, s.sales, s.userpusat, s.workstat, s.ip,
       s.khusus, s.pelang, s.harga_jual, s.stkpin_gdg, s.ecrlst_grp, s.ecrlst_id, s.ecrgrp_lmt, s.mu_credit, userId],
    );
    return this.userById(r.rows[0].id as number);
  }

  async userSoftDelete(id: number, userId = 1): Promise<boolean> {
    const r = await this.pool.query(
      `UPDATE gf.s_secusr SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND COALESCE(hapus_oleh,0)=0`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
