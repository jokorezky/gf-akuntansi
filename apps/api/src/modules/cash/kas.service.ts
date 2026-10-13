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

type KasCfg = { m: string; d: string; fk: string; side: string; invert: boolean };

const MASUK: KasCfg = { m: "gf.s_kasmsk", d: "gf.s_kasmex", fk: "kasmsk_id", side: "kredit", invert: false };
const KELUAR: KasCfg = { m: "gf.s_kasklr", d: "gf.s_kaskex", fk: "kasklr_id", side: "debet", invert: true };

type LineIn = { perkirId?: number; nilai?: string; kredit?: boolean };
type DocIn = { no?: string; tanggal?: string; divisiId?: number; catatan?: string; lines: LineIn[] };

@Injectable()
export class KasService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private async listOf(t: KasCfg, limit: number, offset: number, q?: string) {
    const params: unknown[] = [];
    let where = "WHERE k.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (COALESCE(k.no_c, k.no::text) ILIKE $${params.length} OR k.catatan ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM ${t.m} k ${where}`, params);
    params.push(limit, offset);
    const hdr = `k.id::int AS id, COALESCE(k.no_c, k.no::text) AS no, to_char(k.tanggal,'YYYY-MM-DD') AS tanggal,
      k.divisi_id AS "divisiId", k.catatan,
      (SELECT round(COALESCE(SUM(d.nilai),0),2)::text FROM ${t.d} d WHERE d.${t.fk}=k.id) AS total`;
    const rows = await this.pool.query(
      `SELECT ${hdr} FROM ${t.m} k ${where} ORDER BY k.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows, total: total.rows[0].n as number };
  }

  private async byIdOf(t: KasCfg, id: number) {
    const hdr = `k.id::int AS id, COALESCE(k.no_c, k.no::text) AS no, to_char(k.tanggal,'YYYY-MM-DD') AS tanggal,
      k.divisi_id AS "divisiId", k.catatan,
      (SELECT round(COALESCE(SUM(d.nilai),0),2)::text FROM ${t.d} d WHERE d.${t.fk}=k.id) AS total`;
    const h = await this.pool.query(`SELECT ${hdr} FROM ${t.m} k WHERE k.id=$1 AND k.hapus_oleh IS NULL`, [id]);
    if (!h.rows[0]) return null;
    const d = await this.pool.query(
      `SELECT d.perkir_id::int AS "perkirId", p.nama AS "perkirNama", d.nilai::text AS nilai, d.${t.side} AS side
       FROM ${t.d} d LEFT JOIN gf.s_perkir p ON p.id=d.perkir_id WHERE d.${t.fk}=$1 ORDER BY d.sys_id`,
      [id],
    );
    const lines: KasLine[] = d.rows.map((r: { perkirId: number; perkirNama: string; nilai: string; side: boolean }) => ({
      perkirId: r.perkirId, perkirNama: r.perkirNama, nilai: r.nilai, kredit: t.invert ? !r.side : r.side,
    }));
    return { ...h.rows[0], lines };
  }

  private async createOf(t: KasCfg, input: DocIn, userId: number) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO ${t.m} (id, no, no_c, tanggal, divisi_id, catatan, input_oleh, tgl_input, jam_input)
         VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM ${t.m}), (SELECT COALESCE(MAX(no),0)+1 FROM ${t.m}),
          $1, COALESCE($2, now()::date), $3, $4, $5, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.no), nn(input.tanggal), nn(input.divisiId), nn(input.catatan), userId],
      );
      const pid = h.rows[0].id as number;
      for (const l of input.lines) {
        const side = t.invert ? !l.kredit : !!l.kredit;
        await client.query(
          `INSERT INTO ${t.d} (${t.fk}, perkir_id, nilai, ${t.side}, tanggal) VALUES ($1,$2,$3,$4, COALESCE($5, now()::date))`,
          [pid, nn(l.perkirId), num(l.nilai), side, nn(input.tanggal)],
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
      await client.query(
        `UPDATE ${t.m} SET no_c=$2, tanggal=COALESCE($3, tanggal), divisi_id=$4, catatan=$5,
           ubah_oleh=$6, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.no), nn(input.tanggal), nn(input.divisiId), nn(input.catatan), userId],
      );
      await client.query(`DELETE FROM ${t.d} WHERE ${t.fk}=$1`, [id]);
      for (const l of input.lines) {
        const side = t.invert ? !l.kredit : !!l.kredit;
        await client.query(
          `INSERT INTO ${t.d} (${t.fk}, perkir_id, nilai, ${t.side}, tanggal) VALUES ($1,$2,$3,$4, COALESCE($5, now()::date))`,
          [id, nn(l.perkirId), num(l.nilai), side, nn(input.tanggal)],
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
