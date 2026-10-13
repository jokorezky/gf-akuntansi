import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { KonfigDivisi, KonfigurasiProfil, KonfigurasiProfilInput, KonfigurasiRingkas, KontNoRow, PcFlagRow } from "./konfigurasi.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}

@Injectable()
export class KonfigurasiService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async ringkas(): Promise<KonfigurasiRingkas> {
    const profil = await this.pool.query(
      `SELECT sys_id::int AS "sysId", versi, nama, alamat, negara, npwp, npwp_nama AS "npwpNama",
              pkp_no AS "pkpNo", fakpjk_no AS "fakpjkNo", telepon, fax, email, website,
              rekening_1 AS "rekening1", rekening_2 AS "rekening2", rekening_3 AS "rekening3",
              rekening_4 AS "rekening4", rekening_5 AS "rekening5", qris,
              menu_hotel AS "menuHotel", menu_ktv AS "menuKtv", menu_bill AS "menuBill"
       FROM gf.s_kontro ORDER BY sys_id LIMIT 1`,
    );
    const divisi = await this.pool.query(`SELECT id::int AS id, divisi FROM gf.s_divisi ORDER BY id`);
    const kontNo = await this.pool.query(
      `SELECT sys_id::int AS "sysId", untuk, divisi_id AS "divisiId", tahun, last_01 AS "last01", last_02 AS "last02", last_03 AS "last03"
       FROM gf.s_kontno ORDER BY sys_id DESC LIMIT 60`,
    );
    const pcFlags = await this.pool.query(
      `SELECT sys_id::int AS "sysId", hotel, ktv, billiard, rental, spa FROM gf.s_konhjn ORDER BY sys_id LIMIT 60`,
    );
    const ownr = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_ownrid`);
    const kolom = await this.pool.query(
      `SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='gf' AND table_name='s_kontro'`,
    );
    const koncab = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_koncab`);
    return {
      profil: (profil.rows[0] as KonfigurasiProfil) ?? undefined,
      divisi: divisi.rows as KonfigDivisi[],
      kontNo: kontNo.rows as KontNoRow[],
      pcFlags: pcFlags.rows as PcFlagRow[],
      ownrCount: ownr.rows[0].n as number,
      kolomKontro: kolom.rows[0].n as number,
      koncabCount: koncab.rows[0].n as number,
    };
  }

  async simpanProfil(input: KonfigurasiProfilInput, userId = 1): Promise<KonfigurasiProfil | null> {
    const cur = await this.pool.query(`SELECT sys_id FROM gf.s_kontro ORDER BY sys_id LIMIT 1`);
    if (!cur.rows[0]) return null;
    const sid = cur.rows[0].sys_id as number;
    await this.pool.query(
      `UPDATE gf.s_kontro SET
         nama=CASE WHEN $2::text='' THEN NULL ELSE COALESCE($2::text,nama) END,
         alamat=CASE WHEN $3::text='' THEN NULL ELSE COALESCE($3::text,alamat) END,
         negara=COALESCE($4,negara),
         npwp=CASE WHEN $5::text='' THEN NULL ELSE COALESCE($5::text,npwp) END,
         npwp_nama=CASE WHEN $6::text='' THEN NULL ELSE COALESCE($6::text,npwp_nama) END,
         pkp_no=CASE WHEN $7::text='' THEN NULL ELSE COALESCE($7::text,pkp_no) END,
         fakpjk_no=CASE WHEN $8::text='' THEN NULL ELSE COALESCE($8::text,fakpjk_no) END,
         telepon=CASE WHEN $9::text='' THEN NULL ELSE COALESCE($9::text,telepon) END,
         fax=CASE WHEN $10::text='' THEN NULL ELSE COALESCE($10::text,fax) END,
         email=CASE WHEN $11::text='' THEN NULL ELSE COALESCE($11::text,email) END,
         website=CASE WHEN $12::text='' THEN NULL ELSE COALESCE($12::text,website) END,
         rekening_1=CASE WHEN $13::text='' THEN NULL ELSE COALESCE($13::text,rekening_1) END,
         rekening_2=CASE WHEN $14::text='' THEN NULL ELSE COALESCE($14::text,rekening_2) END,
         rekening_3=CASE WHEN $15::text='' THEN NULL ELSE COALESCE($15::text,rekening_3) END,
         rekening_4=CASE WHEN $16::text='' THEN NULL ELSE COALESCE($16::text,rekening_4) END,
         rekening_5=CASE WHEN $17::text='' THEN NULL ELSE COALESCE($17::text,rekening_5) END,
         qris=CASE WHEN $18::text='' THEN NULL ELSE COALESCE($18::text,qris) END,
         menu_hotel=COALESCE($19,menu_hotel), menu_ktv=COALESCE($20,menu_ktv), menu_bill=COALESCE($21,menu_bill),
         ubah_oleh=$22, tgl_ubah=now()::date
       WHERE sys_id=$1`,
      [sid, input.nama ?? null, input.alamat ?? null, nn(input.negara), input.npwp ?? null, input.npwpNama ?? null, input.pkpNo ?? null,
       input.fakpjkNo ?? null, input.telepon ?? null, input.fax ?? null, input.email ?? null, input.website ?? null,
       input.rekening1 ?? null, input.rekening2 ?? null, input.rekening3 ?? null, input.rekening4 ?? null, input.rekening5 ?? null, input.qris ?? null,
       input.menuHotel ?? null, input.menuKtv ?? null, input.menuBill ?? null, userId],
    );
    const r = await this.ringkas();
    return r.profil ?? null;
  }
}
