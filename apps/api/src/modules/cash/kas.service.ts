import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../db/pg.provider";
import { KasKeluarInput, KasLine, KasMasukInput } from "./kas.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

type KasCfg = { m: string; d: string; fk: string; side: string; invert: boolean; hasPerkir2: boolean };

const MASUK: KasCfg = { m: "gf.s_kasmsk", d: "gf.s_kasmex", fk: "kasmsk_id", side: "kredit", invert: false, hasPerkir2: true };
const KELUAR: KasCfg = { m: "gf.s_kasklr", d: "gf.s_kaskex", fk: "kasklr_id", side: "debet", invert: true, hasPerkir2: false };

type LineIn = { perkirId?: number; nilai?: string; kredit?: boolean; mauang?: number; note?: string; date?: string; cairchbg?: boolean };
type DocIn = {
  no?: string; tanggal?: string; divisiId?: number; vendorId?: number; pelangId?: number; terimaDari?: string;
  perkir1?: number; perkir2?: number; penjEcr?: boolean; catatan?: string; lines: LineIn[];
};

@Injectable()
export class KasService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private hdr(t: KasCfg) {
    return `k.id::int AS id, COALESCE(k.no_c, k.no::text) AS no, to_char(k.tanggal,'YYYY-MM-DD') AS tanggal,
      k.divisi_id AS "divisiId", k.vendor AS "vendorId", v.nama AS "vendorNama", k.pelang::int AS "pelangId", pl.nama AS "pelangNama",
      k.trmbyr AS "terimaDari", k.perkir_1 AS "perkir1", ${t.hasPerkir2 ? "k.perkir_2" : "NULL::int"} AS "perkir2",
      k.penj_ecr AS "penjEcr", k.catatan,
      (SELECT round(COALESCE(SUM(d.nilai),0),2)::text FROM ${t.d} d WHERE d.${t.fk}=k.id) AS total,
      (SELECT round(COALESCE(SUM(d.nilai_3),0),2)::text FROM ${t.d} d WHERE d.${t.fk}=k.id) AS "total3"`;
  }

  private async listOf(t: KasCfg, limit: number, offset: number, q?: string) {
    const params: unknown[] = [];
    let where = "WHERE k.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (COALESCE(k.no_c, k.no::text) ILIKE $${params.length} OR COALESCE(k.catatan,'') ILIKE $${params.length} OR COALESCE(k.trmbyr,'') ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM ${t.m} k ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${this.hdr(t)} FROM ${t.m} k
       LEFT JOIN gf.s_vendor v ON v.id=k.vendor
       LEFT JOIN gf.s_pelang pl ON pl.id=k.pelang
       ${where} ORDER BY k.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows, total: total.rows[0].n as number };
  }

  private async byIdOf(t: KasCfg, id: number) {
    const h = await this.pool.query(
      `SELECT ${this.hdr(t)} FROM ${t.m} k
       LEFT JOIN gf.s_vendor v ON v.id=k.vendor
       LEFT JOIN gf.s_pelang pl ON pl.id=k.pelang
       WHERE k.id=$1 AND k.hapus_oleh IS NULL`,
      [id],
    );
    if (!h.rows[0]) return null;
    const d = await this.pool.query(
      `SELECT d.perkir_id::int AS "perkirId", p.nama AS "perkirNama", d.nilai::text AS nilai, d.${t.side} AS side,
              d.mauang, NULL::text AS kurs, d.lunas_doc AS note, to_char(d.lunas_dt,'YYYY-MM-DD') AS date, d.cairchbg
       FROM ${t.d} d LEFT JOIN gf.s_perkir p ON p.id=d.perkir_id WHERE d.${t.fk}=$1 ORDER BY d.sys_id`,
      [id],
    );
    const lines: KasLine[] = d.rows.map((r: Record<string, unknown>) => ({
      perkirId: r.perkirId as number, perkirNama: r.perkirNama as string, nilai: r.nilai as string,
      kredit: t.invert ? !(r.side as boolean) : (r.side as boolean),
      mauang: (r.mauang as number) ?? undefined, kurs: undefined, note: (r.note as string) ?? undefined, date: (r.date as string) ?? undefined, cairchbg: (r.cairchbg as boolean) ?? undefined,
    }));
    return { ...(h.rows[0] as Record<string, unknown>), lines };
  }

  private async createOf(t: KasCfg, input: DocIn, userId: number) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const cols = `(id, no, no_c, tanggal, divisi_id, vendor, pelang, trmbyr, perkir_1, ${t.hasPerkir2 ? "perkir_2, " : ""}penj_ecr, catatan, input_oleh, tgl_input, jam_input)`;
      const vals = `((SELECT COALESCE(MAX(id),0)+1 FROM ${t.m}), (SELECT COALESCE(MAX(no),0)+1 FROM ${t.m}),
         $1, COALESCE($2, now()::date), $3, $4, $5, $6, $7, ${t.hasPerkir2 ? "$8, " : ""}COALESCE($${t.hasPerkir2 ? 9 : 8},false), $${t.hasPerkir2 ? 10 : 9}, $${t.hasPerkir2 ? 11 : 10}, now()::date, to_char(now(),'HH24:MI:SS'))`;
      const params: unknown[] = [nn(input.no), nn(input.tanggal), nn(input.divisiId), nn(input.vendorId), nn(input.pelangId),
        nn(input.terimaDari), nn(input.perkir1)];
      if (t.hasPerkir2) params.push(nn(input.perkir2));
      params.push(input.penjEcr ?? false, nn(input.catatan), userId);
      const h = await client.query(`INSERT INTO ${t.m} ${cols} VALUES ${vals} RETURNING id`, params);
      const pid = h.rows[0].id as number;
      for (const l of input.lines) {
        const side = t.invert ? !l.kredit : !!l.kredit;
        await client.query(
          `INSERT INTO ${t.d} (${t.fk}, perkir_id, nilai, ${t.side}, tanggal, mauang, lunas_doc, lunas_dt, cairchbg)
           VALUES ($1,$2,$3,$4, COALESCE($5, now()::date), COALESCE($6,1), $7, $8, COALESCE($9,false))`,
          [pid, nn(l.perkirId), num(l.nilai), side, nn(input.tanggal), nn(l.mauang), nn(l.note), nn(l.date), l.cairchbg ?? false],
        );
      }
      await client.query("COMMIT");
      return (await this.byIdOf(t, pid))!;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  private async updateOf(t: KasCfg, id: number, input: DocIn, userId: number) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const sets = `no_c=$2, tanggal=COALESCE($3, tanggal), divisi_id=$4, vendor=$5, pelang=$6, trmbyr=$7, perkir_1=$8,
        ${t.hasPerkir2 ? "perkir_2=$9, " : ""}penj_ecr=COALESCE($${t.hasPerkir2 ? 10 : 9},false), catatan=$${t.hasPerkir2 ? 11 : 10}`;
      const params: unknown[] = [id, nn(input.no), nn(input.tanggal), nn(input.divisiId), nn(input.vendorId), nn(input.pelangId),
        nn(input.terimaDari), nn(input.perkir1)];
      if (t.hasPerkir2) params.push(nn(input.perkir2));
      params.push(input.penjEcr ?? false, nn(input.catatan), userId);
      await client.query(
        `UPDATE ${t.m} SET ${sets}, ubah_oleh=$${t.hasPerkir2 ? 12 : 11}, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        params,
      );
      await client.query(`DELETE FROM ${t.d} WHERE ${t.fk}=$1`, [id]);
      for (const l of input.lines) {
        const side = t.invert ? !l.kredit : !!l.kredit;
        await client.query(
          `INSERT INTO ${t.d} (${t.fk}, perkir_id, nilai, ${t.side}, tanggal, mauang, lunas_doc, lunas_dt, cairchbg)
           VALUES ($1,$2,$3,$4, COALESCE($5, now()::date), COALESCE($6,1), $7, $8, COALESCE($9,false))`,
          [id, nn(l.perkirId), num(l.nilai), side, nn(input.tanggal), nn(l.mauang), nn(l.note), nn(l.date), l.cairchbg ?? false],
        );
      }
      await client.query("COMMIT");
      return this.byIdOf(t, id);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  private async softDel(t: KasCfg, id: number, userId: number) {
    const r = await this.pool.query(
      `UPDATE ${t.m} SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  listMasuk(limit = 50, offset = 0, q?: string) { return this.listOf(MASUK, limit, offset, q); }
  byIdMasuk(id: number) { return this.byIdOf(MASUK, id); }
  createMasuk(input: KasMasukInput) { return this.createOf(MASUK, input, 1); }
  updateMasuk(id: number, input: KasMasukInput) { return this.updateOf(MASUK, id, input, 1); }
  deleteMasuk(id: number) { return this.softDel(MASUK, id, 1); }

  listKeluar(limit = 50, offset = 0, q?: string) { return this.listOf(KELUAR, limit, offset, q); }
  byIdKeluar(id: number) { return this.byIdOf(KELUAR, id); }
  createKeluar(input: KasKeluarInput) { return this.createOf(KELUAR, input, 1); }
  updateKeluar(id: number, input: KasKeluarInput) { return this.updateOf(KELUAR, id, input, 1); }
  deleteKeluar(id: number) { return this.softDel(KELUAR, id, 1); }

  async perkiraanRefList() {
    const r = await this.pool.query(`SELECT id::int AS id, nama FROM gf.s_perkir WHERE hapus_oleh IS NULL ORDER BY id`);
    return r.rows;
  }
}
