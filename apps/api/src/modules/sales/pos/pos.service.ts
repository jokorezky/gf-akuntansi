import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { PosDivisiRef, Pos, PosInput, PosKatalogItem, PosLine, PosPage } from "./pos.types";

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}
function r2(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}
function lineNilai(l: { jumlah?: unknown; harga?: unknown; discPers?: unknown; discPers2?: unknown; discPers3?: unknown; discNilai?: unknown }): number {
  const g = num(l.jumlah) * num(l.harga);
  const net = g * (1 - num(l.discPers) / 100) * (1 - num(l.discPers2) / 100) * (1 - num(l.discPers3) / 100);
  return Math.round((net - num(l.discNilai)) * 100) / 100;
}

const HDR = `
  e.id::int AS id, e.list AS no, to_char(e.tanggal,'YYYY-MM-DD') AS tanggal, e.pukul_c AS "pukulC",
  e.pelang AS "pelangId", COALESCE(e.pel_nama, p.nama) AS "pelNama", e.gudang, e.mauang,
  e.sales AS "salesId", e.disc_pers::text AS "discPers", e.disc_nilai::text AS "discNilai",
  e.adj1_pers::text AS "adj1Pers", e.adj2_pers::text AS "adj2Pers", e.adj3_pers::text AS "adj3Pers",
  e.adj4_pers::text AS "adj4Pers", e.adj5_pers::text AS "adj5Pers",
  e.adj1_nilai::text AS "adj1Nilai", e.adj2_nilai::text AS "adj2Nilai", e.adj3_nilai::text AS "adj3Nilai",
  e.adj4_nilai::text AS "adj4Nilai", e.adj5_nilai::text AS "adj5Nilai",
  e.sts_ecr AS "stsEcr", e.catatan, e.catatan_2 AS "catatan2", e.catatan_3 AS "catatan3",
  st.sub AS "subTotal", st.gross, st.ppn, st.qty`;

const SUBS = `LEFT JOIN LATERAL (
    SELECT COALESCE(sum(round(d.jumlah*d.harga*(1-COALESCE(d.disc_pers,0)/100)*(1-COALESCE(d.disc_pers2,0)/100)*(1-COALESCE(d.disc_pers3,0)/100)-COALESCE(d.disc_nilai,0),2)),0) AS sub,
           COALESCE(sum(d.jumlah*d.harga),0) AS gross,
           COALESCE(sum(CASE WHEN COALESCE(d.ppn_pers,0)<>0 THEN round(d.jumlah*d.harga*(1-COALESCE(d.disc_pers,0)/100)*(1-COALESCE(d.disc_pers2,0)/100)*(1-COALESCE(d.disc_pers3,0)/100)*d.ppn_pers/100,2) ELSE COALESCE(d.ppn_nilai,0) END),0) AS ppn,
           COALESCE(sum(d.jumlah),0) AS qty
    FROM gf.s_penecr d WHERE d.ecrlst_id=e.id) st ON true`;

function mapHdr(r: Record<string, unknown>): Pos {
  const sub = num(r.subTotal);
  const gross = num(r.gross);
  const ppn = num(r.ppn);
  const discPersAmt = Math.round(sub * num(r.discPers)) / 100;
  const discNilai = num(r.discNilai);
  let after = sub - discPersAmt - discNilai;
  for (let i = 1; i <= 5; i++) {
    after = after - Math.round(after * num(r[`adj${i}Pers`])) / 100 - num(r[`adj${i}Nilai`]);
  }
  const totDisc = gross - sub + discPersAmt + discNilai;
  const { gross: _g, ppn: _p, sub: _s, qty, ...hdr } = r;
  return {
    ...(hdr as unknown as Pos),
    subTotal: r2(sub),
    totDisc: r2(totDisc),
    totalQty: String(num(qty)),
    total: r2(after + ppn),
  };
}

@Injectable()
export class PosService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<PosPage> {
    const params: unknown[] = [];
    let where = "WHERE e.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (e.list ILIKE $${params.length} OR COALESCE(e.pel_nama, p.nama) ILIKE $${params.length})`;
    }
    const total = await this.pool.query(
      `SELECT count(*)::int AS n FROM gf.s_ecrlst e LEFT JOIN gf.s_pelang p ON p.id=e.pelang ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_ecrlst e LEFT JOIN gf.s_pelang p ON p.id=e.pelang ${SUBS} ${where} ORDER BY e.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      rows: (rows.rows as Record<string, unknown>[]).map(mapHdr),
      total: total.rows[0].n as number,
    };
  }

  async byId(id: number): Promise<Pos | null> {
    const h = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_ecrlst e LEFT JOIN gf.s_pelang p ON p.id=e.pelang ${SUBS} WHERE e.id=$1 AND e.hapus_oleh IS NULL`,
      [id],
    );
    if (!h.rows[0]) return null;
    const d = await this.pool.query(
      `SELECT d.stock_id::int AS "stockId", s.nama AS "stockNama", d.satuan, d.satuan_c AS "satuanC",
              d.jumlah::text AS jumlah, d.harga::text AS harga, d.harga_ex1::text AS "hargaEx1", d.harga_ex2::text AS "hargaEx2",
              d.disc_pers::text AS "discPers", d.disc_pers2::text AS "discPers2", d.disc_pers3::text AS "discPers3",
              d.disc_nilai::text AS "discNilai", d.ppn_pers::text AS "ppnPers", d.ppn_nilai::text AS "ppnNilai",
              round(d.jumlah*d.harga*(1-COALESCE(d.disc_pers,0)/100)*(1-COALESCE(d.disc_pers2,0)/100)*(1-COALESCE(d.disc_pers3,0)/100)-COALESCE(d.disc_nilai,0),2)::text AS nilai,
              d.catatan, d.als_batal AS "alsBatal"
       FROM gf.s_penecr d LEFT JOIN gf.s_stock s ON s.id=d.stock_id WHERE d.ecrlst_id=$1 ORDER BY d.sys_id`,
      [id],
    );
    return { ...mapHdr(h.rows[0] as Record<string, unknown>), lines: d.rows as PosLine[] };
  }

  async katalog(q?: string, limit = 300): Promise<PosKatalogItem[]> {
    const params: unknown[] = [];
    let where = "WHERE COALESCE(s.hide,false)=false";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (s.nama ILIKE $${params.length} OR s.kode_c ILIKE $${params.length} OR s.kode_n::text ILIKE $${params.length})`;
    }
    params.push(limit);
    const r = await this.pool.query(
      `SELECT s.id::int AS id, s.nama, s.group_stk AS grup,
              s.harga_j_01::text AS "hargaJ1", s.harga_j_02::text AS "hargaJ2", s.harga_j_03::text AS "hargaJ3",
              s.harga_j_04::text AS "hargaJ4", s.harga_j_05::text AS "hargaJ5",
              s.disc1_j_01::text AS "disc1J1", s.disc2_j_01::text AS "disc2J1", s.disc3_j_01::text AS "disc3J1",
              s.disc1_j_02::text AS "disc1J2", s.disc2_j_02::text AS "disc2J2", s.disc3_j_02::text AS "disc3J2",
              s.disc1_j_03::text AS "disc1J3", s.disc2_j_03::text AS "disc2J3", s.disc3_j_03::text AS "disc3J3",
              s.disc1_j_04::text AS "disc1J4", s.disc2_j_04::text AS "disc2J4", s.disc3_j_04::text AS "disc3J4",
              s.disc1_j_05::text AS "disc1J5", s.disc2_j_05::text AS "disc2J5", s.disc3_j_05::text AS "disc3J5"
       FROM gf.s_stock s ${where} ORDER BY s.nama LIMIT $${params.length}`,
      params,
    );
    return r.rows as PosKatalogItem[];
  }

  async divisiList(): Promise<PosDivisiRef[]> {
    const r = await this.pool.query(
      `SELECT id::int AS id, divisi AS nama FROM gf.s_divisi WHERE COALESCE(non_aktif,false)=false ORDER BY divisi`,
    );
    return r.rows as PosDivisiRef[];
  }

  private async writeLines(client: { query: (q: string, p?: unknown[]) => Promise<unknown> }, pid: number, lines: PosInput["lines"]) {
    for (const l of lines) {
      const nilai = lineNilai(l);
      const ppnPers = num(l.ppnPers);
      const ppnNilai = ppnPers > 0 ? Math.round(nilai * ppnPers) / 100 : num(l.ppnNilai);
      await client.query(
        `INSERT INTO gf.s_penecr (ecrlst_id, stock_id, satuan, satuan_c, jumlah, harga, harga_ex1, harga_ex2,
           disc_pers, disc_pers2, disc_pers3, disc_nilai, ppn_pers, ppn_nilai, catatan, als_batal)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [pid, l.stockId, nn(l.satuan), nn(l.satuanC), num(l.jumlah), num(l.harga), num(l.hargaEx1), num(l.hargaEx2),
         num(l.discPers), num(l.discPers2), num(l.discPers3), num(l.discNilai), ppnPers, ppnNilai, nn(l.catatan), nn(l.alsBatal)],
      );
    }
  }

  async create(input: PosInput, userId = 1): Promise<Pos> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_ecrlst (id, list, tanggal, pukul_c, pelang, pel_nama, gudang, mauang, sales,
           disc_pers, disc_nilai, adj1_pers, adj2_pers, adj3_pers, adj4_pers, adj5_pers,
           adj1_nilai, adj2_nilai, adj3_nilai, adj4_nilai, adj5_nilai, sts_ecr, catatan, catatan_2, catatan_3,
           input_oleh, tgl_input, jam_input)
         VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_ecrlst),
           COALESCE($1, 'EC'||LPAD(((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_ecrlst))::text, 3, '0')),
           COALESCE($2, now()::date), to_char(now(),'HH24:MI:SS'), $3, $4, COALESCE($5,1), COALESCE($6,1), $7,
           COALESCE($8::numeric,0), COALESCE($9::numeric,0),
           COALESCE($10::numeric,0), COALESCE($11::numeric,0), COALESCE($12::numeric,0), COALESCE($13::numeric,0), COALESCE($14::numeric,0),
           COALESCE($15::numeric,0), COALESCE($16::numeric,0), COALESCE($17::numeric,0), COALESCE($18::numeric,0), COALESCE($19::numeric,0),
           0, $20, $21, $22, $23, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.no), nn(input.tanggal), nn(input.pelangId), nn(input.pelNama), nn(input.gudang), nn(input.mauang), nn(input.salesId),
         num(input.discPers), num(input.discNilai),
         num(input.adj1Pers), num(input.adj2Pers), num(input.adj3Pers), num(input.adj4Pers), num(input.adj5Pers),
         num(input.adj1Nilai), num(input.adj2Nilai), num(input.adj3Nilai), num(input.adj4Nilai), num(input.adj5Nilai),
         nn(input.catatan), nn(input.catatan2), nn(input.catatan3), userId],
      );
      const pid = h.rows[0].id as number;
      await this.writeLines(client, pid, input.lines);
      await client.query("COMMIT");
      return (await this.byId(pid))!;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async update(id: number, input: PosInput, userId = 1): Promise<Pos | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE gf.s_ecrlst SET list=COALESCE($2, list), tanggal=COALESCE($3, tanggal), pelang=$4, pel_nama=$5,
           gudang=$6, mauang=COALESCE($7, mauang), sales=$8,
           disc_pers=COALESCE($9::numeric,0), disc_nilai=COALESCE($10::numeric,0),
           adj1_pers=COALESCE($11::numeric,0), adj2_pers=COALESCE($12::numeric,0), adj3_pers=COALESCE($13::numeric,0),
           adj4_pers=COALESCE($14::numeric,0), adj5_pers=COALESCE($15::numeric,0),
           adj1_nilai=COALESCE($16::numeric,0), adj2_nilai=COALESCE($17::numeric,0), adj3_nilai=COALESCE($18::numeric,0),
           adj4_nilai=COALESCE($19::numeric,0), adj5_nilai=COALESCE($20::numeric,0),
           catatan=$21, catatan_2=$22, catatan_3=$23,
           ubah_oleh=$24, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.no), nn(input.tanggal), nn(input.pelangId), nn(input.pelNama), nn(input.gudang), nn(input.mauang), nn(input.salesId),
         num(input.discPers), num(input.discNilai),
         num(input.adj1Pers), num(input.adj2Pers), num(input.adj3Pers), num(input.adj4Pers), num(input.adj5Pers),
         num(input.adj1Nilai), num(input.adj2Nilai), num(input.adj3Nilai), num(input.adj4Nilai), num(input.adj5Nilai),
         nn(input.catatan), nn(input.catatan2), nn(input.catatan3), userId],
      );
      await client.query(`DELETE FROM gf.s_penecr WHERE ecrlst_id=$1`, [id]);
      await this.writeLines(client, id, input.lines);
      await client.query("COMMIT");
      return this.byId(id);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async softDelete(id: number, userId = 1): Promise<boolean> {
    const r = await this.pool.query(
      `UPDATE gf.s_ecrlst SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
