import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { MauangRef, Perkiraan, PerkiraanInput, PerkiraanPage } from "./perkiraan.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const GOL: Record<number, string> = { 0: "---", 1: "AKTIVA", 2: "KEWAJIBAN", 3: "MODAL", 4: "PENDAPATAN", 5: "BIAYA" };

const COLS = `
  p.id::int AS id, p.kode, p.nama, p.header, p.golongan, p.debet, p.multi_cur AS "multiCur",
  p.tarik_kurs AS "tarikKurs", p.non_rev AS "nonRev", p.sal_awal::text AS "salAwal", p.mauang,
  m.kode AS "mauangKode", p.cairchbg, p.catatan,
  CASE WHEN p.security IS NOT NULL THEN 'bitmap '||length(p.security)||' B' ELSE NULL END AS "securityInfo"`;

@Injectable()
export class PerkiraanService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private map(r: Record<string, unknown>): Perkiraan {
    return { ...(r as unknown as Perkiraan), golonganNama: GOL[num(r.golongan)] ?? String(r.golongan) };
  }

  async list(limit = 500, offset = 0, q?: string, golongan?: number): Promise<PerkiraanPage> {
    const params: unknown[] = [];
    let where = "WHERE p.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (p.kode ILIKE $${params.length} OR p.nama ILIKE $${params.length})`;
    }
    if (golongan && golongan > 0) {
      params.push(golongan);
      where += ` AND p.golongan = $${params.length}`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_perkir p ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${COLS} FROM gf.s_perkir p LEFT JOIN gf.s_mauang m ON m.id=p.mauang ${where} ORDER BY p.kode LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: (rows.rows as Record<string, unknown>[]).map((r) => this.map(r)), total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<Perkiraan | null> {
    const r = await this.pool.query(
      `SELECT ${COLS} FROM gf.s_perkir p LEFT JOIN gf.s_mauang m ON m.id=p.mauang WHERE p.id=$1 AND p.hapus_oleh IS NULL`,
      [id],
    );
    return r.rows[0] ? this.map(r.rows[0] as Record<string, unknown>) : null;
  }

  async create(input: PerkiraanInput, userId = 1): Promise<Perkiraan> {
    const r = await this.pool.query(
      `INSERT INTO gf.s_perkir (id, kode, nama, header, golongan, debet, multi_cur, tarik_kurs, non_rev,
         sal_awal, mauang, cairchbg, catatan, input_oleh, tgl_input, jam_input)
       VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_perkir), $1, $2, COALESCE($3,false), COALESCE($4,0),
         COALESCE($5,true), COALESCE($6,false), COALESCE($7,false), COALESCE($8,false),
         COALESCE($9::numeric,0), COALESCE($10,1), $11, $12, $13, now()::date, to_char(now(),'HH24:MI:SS'))
       RETURNING id`,
      [nn(input.kode), nn(input.nama), input.header ?? false, input.golongan ?? 0,
       input.debet ?? true, input.multiCur ?? false, input.tarikKurs ?? false, input.nonRev ?? false,
       num(input.salAwal), input.mauang ?? 1, nn(input.cairchbg), nn(input.catatan), userId],
    );
    return (await this.byId(r.rows[0].id as number))!;
  }

  async update(id: number, input: PerkiraanInput, userId = 1): Promise<Perkiraan | null> {
    await this.pool.query(
      `UPDATE gf.s_perkir SET kode=$2, nama=$3, header=COALESCE($4,false), golongan=COALESCE($5,0),
         debet=COALESCE($6,true), multi_cur=COALESCE($7,false), tarik_kurs=COALESCE($8,false), non_rev=COALESCE($9,false),
         sal_awal=COALESCE($10::numeric,0), mauang=COALESCE($11,1), cairchbg=$12, catatan=$13,
         ubah_oleh=$14, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, nn(input.kode), nn(input.nama), input.header ?? false, input.golongan ?? 0,
       input.debet ?? true, input.multiCur ?? false, input.tarikKurs ?? false, input.nonRev ?? false,
       num(input.salAwal), input.mauang ?? 1, nn(input.cairchbg), nn(input.catatan), userId],
    );
    return this.byId(id);
  }

  async softDelete(id: number, userId = 1): Promise<boolean> {
    const r = await this.pool.query(
      `UPDATE gf.s_perkir SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  async mauangList(): Promise<MauangRef[]> {
    const r = await this.pool.query(`SELECT id::int AS id, kode, mata_uang AS "mataUang" FROM gf.s_mauang ORDER BY id`);
    return r.rows as MauangRef[];
  }
}
