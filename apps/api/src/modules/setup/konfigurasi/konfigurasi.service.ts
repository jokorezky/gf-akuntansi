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
      `UPDATE gf.s_kontro SET nama=$2, alamat=$3, negara=$4, npwp=$5, npwp_nama=$6, pkp_no=$7, fakpjk_no=$8,
         telepon=$9, fax=$10, email=$11, website=$12,
         rekening_1=$13, rekening_2=$14, rekening_3=$15, rekening_4=$16, rekening_5=$17, qris=$18,
         menu_hotel=COALESCE($19,false), menu_ktv=COALESCE($20,false), menu_bill=COALESCE($21,false),
         ubah_oleh=$22, tgl_ubah=now()::date
       WHERE sys_id=$1`,
      [sid, nn(input.nama), nn(input.alamat), nn(input.negara), nn(input.npwp), nn(input.npwpNama), nn(input.pkpNo),
       nn(input.fakpjkNo), nn(input.telepon), nn(input.fax), nn(input.email), nn(input.website),
       nn(input.rekening1), nn(input.rekening2), nn(input.rekening3), nn(input.rekening4), nn(input.rekening5), nn(input.qris),
       input.menuHotel ?? false, input.menuKtv ?? false, input.menuBill ?? false, userId],
    );
    const r = await this.ringkas();
    return r.profil ?? null;
  }
}
