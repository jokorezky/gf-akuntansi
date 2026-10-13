import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { ReturJualLine, ReturPenjualan, ReturPenjualanInput, ReturPenjualanPage } from "./retur-penjualan.types";

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
function headerMath(sub: number, pers: unknown, nilai: unknown, adjs: unknown[], ppnPers: unknown) {
  const headerDiscPersAmt = Math.round(sub * num(pers)) / 100;
  const headerDiscNilai = num(nilai);
  let after = sub - headerDiscPersAmt - headerDiscNilai;
  for (const a of adjs) after -= num(a);
  after = Math.round(after * 100) / 100;
  const ppn = num(ppnPers) > 0 ? Math.round(after * num(ppnPers)) / 100 : 0;
  return { after, ppn, headerDiscPersAmt, headerDiscNilai };
}

const HDR = `
  r.id::int AS id, COALESCE(r.no_c, 'RJ'||r.no::text) AS no, r.no AS "noInt", r.no_c AS "noC",
  r.no_pjk AS "noPjk", to_char(r.tgl_pajak,'YYYY-MM-DD') AS "tglPajak",
  r.pelang::int AS "pelangId", COALESCE(r.pel_nama, p.nama) AS "pelangNama", r.pel_alamat AS "pelAlamat",
  r.sales AS "salesId", r.gudang, r.divisi_id AS "divisiId", r.jenpen_id AS "jenpenId", r.cash,
  to_char(r.tanggal,'YYYY-MM-DD') AS tanggal, r.mauang, r.kurs::text AS kurs, r.kurs_pajak::text AS "kursPajak",
  r.penjua_id::int AS "penjuaId", pj.no AS "penjuaNo", r.penjua_id2::int AS "penjuaId2", pj2.no AS "penjuaNo2",
  r.tot_harga::text AS "totHarga", r.tot_harex1::text AS "totHarex1", r.tot_harex2::text AS "totHarex2",
  r.tot_disc::text AS "totDisc", r.disc_nilai::text AS "discNilai", r.disc_perst::text AS "discPerst",
  r.ppn_tipe AS "ppnTipe", r.ppn_pers::text AS "ppnPers", r.ppn_nilai::text AS "ppnNilai",
  r.adj_01::text AS "adj1", r.adj_02::text AS "adj2", r.adj_03::text AS "adj3", r.adj_04::text AS "adj4", r.adj_05::text AS "adj5",
  r.term_crd AS "termCrd", r.catatan, r.catatan_2 AS "catatan2", r.catatan_3 AS "catatan3", r.als_batal AS "alsBatal",
  st.sub, st.gross`;

const JOINS = `LEFT JOIN gf.s_pelang p ON p.id=r.pelang
  LEFT JOIN gf.s_penjua pj ON pj.id=r.penjua_id
  LEFT JOIN gf.s_penjua pj2 ON pj2.id=r.penjua_id2
  LEFT JOIN LATERAL (
    SELECT COALESCE(sum(round(d.jumlah*d.harga*(1-COALESCE(d.disc_pers,0)/100)*(1-COALESCE(d.disc_pers2,0)/100)*(1-COALESCE(d.disc_pers3,0)/100)-COALESCE(d.disc_nilai,0),2)),0) AS sub,
           COALESCE(sum(d.jumlah*d.harga),0) AS gross
    FROM gf.s_retpjd d WHERE d.retpen_id=r.id) st ON true`;

function mapHdr(r: Record<string, unknown>): ReturPenjualan {
  const gross = num(r.gross);
  const m = headerMath(num(r.sub), r.discPerst, r.discNilai, [r.adj1, r.adj2, r.adj3, r.adj4, r.adj5], r.ppnPers);
  const { sub: _s, gross: _g, ...hdr } = r;
  return {
    ...(hdr as unknown as ReturPenjualan),
    totHarga: r2(gross),
    totDisc: r2(gross - num(r.sub) + m.headerDiscPersAmt + m.headerDiscNilai),
    totalNilai: r2(m.after),
    totalRetur: r2(m.after + m.ppn),
  };
}

@Injectable()
export class ReturPenjualanService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<ReturPenjualanPage> {
    const params: unknown[] = [];
    let where = "WHERE r.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (COALESCE(r.no_c, 'RJ'||r.no::text) ILIKE $${params.length} OR p.nama ILIKE $${params.length})`;
    }
    const total = await this.pool.query(
      `SELECT count(*)::int AS n FROM gf.s_retpen r LEFT JOIN gf.s_pelang p ON p.id=r.pelang ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_retpen r ${JOINS} ${where} ORDER BY r.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: (rows.rows as Record<string, unknown>[]).map(mapHdr), total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<ReturPenjualan | null> {
    const h = await this.pool.query(
      `SELECT ${HDR} FROM gf.s_retpen r ${JOINS} WHERE r.id=$1 AND r.hapus_oleh IS NULL`,
      [id],
    );
    if (!h.rows[0]) return null;
    const d = await this.pool.query(
      `SELECT d.stock_id::int AS "stockId", s.nama AS "stockNama", d.perkir_id AS "perkirId", d.stock_gdg AS "stockGdg",
              d.stock_non AS "stockNon", d.satuan, d.satuan_c AS "satuanC", d.sat_rusak AS "satRusak",
              d.jumlah::text AS jumlah, d.jml_rusak::text AS "jmlRusak", d.bon_satuan AS "bonSatuan", d.bon_jumlah::text AS "bonJumlah",
              d.harga::text AS harga, d.harga_ex1::text AS "hargaEx1", d.harga_ex2::text AS "hargaEx2",
              d.disc_pers::text AS "discPers", d.disc_pers2::text AS "discPers2", d.disc_pers3::text AS "discPers3",
              d.disc_nilai::text AS "discNilai", d.mast_disc::text AS "mastDisc", d.mast_ppn::text AS "mastPpn",
              d.mast_adj_1::text AS "mastAdj1", d.mast_adj_2::text AS "mastAdj2", d.mast_adj_3::text AS "mastAdj3",
              d.mast_adj_4::text AS "mastAdj4", d.mast_adj_5::text AS "mastAdj5",
              d.hpp::text AS hpp, d.hpp_rusak::text AS "hppRusak", d.dari_mast AS "dariMast", d.catatan,
              round(d.jumlah*d.harga*(1-COALESCE(d.disc_pers,0)/100)*(1-COALESCE(d.disc_pers2,0)/100)*(1-COALESCE(d.disc_pers3,0)/100)-COALESCE(d.disc_nilai,0),2)::text AS nilai
       FROM gf.s_retpjd d LEFT JOIN gf.s_stock s ON s.id=d.stock_id WHERE d.retpen_id=$1 ORDER BY d.sys_id`,
      [id],
    );
    return { ...mapHdr(h.rows[0] as Record<string, unknown>), lines: d.rows as ReturJualLine[] };
  }

  private totalsOf(input: ReturPenjualanInput) {
    let sub = 0, gross = 0;
    for (const l of input.lines) {
      sub += lineNilai(l);
      gross += num(l.jumlah) * num(l.harga);
    }
    sub = Math.round(sub * 100) / 100;
    const m = headerMath(sub, input.discPerst, input.discNilai,
      [input.adj1, input.adj2, input.adj3, input.adj4, input.adj5], input.ppnPers);
    return { sub, gross, totDisc: gross - sub + m.headerDiscPersAmt + m.headerDiscNilai, after: m.after, ppn: m.ppn };
  }

  private async writeLines(client: { query: (q: string, p?: unknown[]) => Promise<unknown> }, pid: number, pelangId: number | null | undefined, tanggal: string | null | undefined, lines: ReturPenjualanInput["lines"]) {
    for (const l of lines) {
      await client.query(
        `INSERT INTO gf.s_retpjd (retpen_id, perkir_id, stock_id, stock_gdg, stock_non, pelang, tanggal,
           satuan, satuan_c, sat_rusak, jumlah, jml_rusak, bon_satuan, bon_jumlah, harga, harga_ex1, harga_ex2,
           disc_pers, disc_pers2, disc_pers3, disc_nilai, hpp, hpp_rusak, dari_mast, catatan)
         VALUES ($1,$2,$3,$4,$5,$6, COALESCE($7, now()::date),
           $8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
        [pid, nn(l.perkirId), l.stockId, nn(l.stockGdg), nn(l.stockNon), nn(pelangId), nn(tanggal),
         nn(l.satuan), nn(l.satuanC), nn(l.satRusak), num(l.jumlah), num(l.jmlRusak), nn(l.bonSatuan), num(l.bonJumlah),
         num(l.harga), num(l.hargaEx1), num(l.hargaEx2),
         num(l.discPers), num(l.discPers2), num(l.discPers3), num(l.discNilai), num(l.hpp), num(l.hppRusak),
         l.dariMast ?? false, nn(l.catatan)],
      );
    }
  }

  async create(input: ReturPenjualanInput, userId = 1): Promise<ReturPenjualan> {
    const t = this.totalsOf(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const h = await client.query(
        `INSERT INTO gf.s_retpen (id, no, no_c, no_pjk, tgl_pajak, pelang, pel_nama, pel_alamat, sales, gudang,
           divisi_id, jenpen_id, cash, tanggal, mauang, kurs, kurs_pajak, penjua_id, penjua_id2,
           tot_harga, tot_disc, disc_nilai, disc_perst, ppn_tipe, ppn_pers, ppn_nilai,
           adj_01, adj_02, adj_03, adj_04, adj_05, term_crd, catatan, catatan_2, catatan_3, als_batal,
           input_oleh, tgl_input, jam_input)
         VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_retpen), (SELECT COALESCE(MAX(no),0)+1 FROM gf.s_retpen), $1, $2, $3, $4, $5, $6, $7, COALESCE($8,1),
           $9, $10, COALESCE($11,false), COALESCE($12, now()::date), COALESCE($13,1), COALESCE($14::numeric,1), COALESCE($15::numeric,1), $16, $17,
           $18::numeric, $19::numeric, COALESCE($20::numeric,0), COALESCE($21::numeric,0), COALESCE($22,0), COALESCE($23::numeric,0), COALESCE($24::numeric,0),
           COALESCE($25::numeric,0), COALESCE($26::numeric,0), COALESCE($27::numeric,0), COALESCE($28::numeric,0), COALESCE($29::numeric,0), $30, $31, $32, $33, $34,
           $35, now()::date, to_char(now(),'HH24:MI:SS'))
         RETURNING id`,
        [nn(input.no), null, nn(input.tglPajak), nn(input.pelangId), null, nn(input.pelAlamat), nn(input.salesId), nn(input.gudang),
         nn(input.divisiId), nn(input.jenpenId), input.cash ?? false, nn(input.tanggal), nn(input.mauang),
         num(input.kurs), num(input.kursPajak), nn(input.penjuaId), nn(input.penjuaId2),
         t.gross, t.totDisc, num(input.discNilai), num(input.discPerst), input.ppnTipe ?? 0, num(input.ppnPers), t.ppn,
         num(input.adj1), num(input.adj2), num(input.adj3), num(input.adj4), num(input.adj5),
         nn(input.termCrd), nn(input.catatan), nn(input.catatan2), nn(input.catatan3), nn(input.alsBatal), userId],
      );
      const pid = h.rows[0].id as number;
      await this.writeLines(client, pid, input.pelangId, input.tanggal, input.lines);
      await client.query("COMMIT");
      return (await this.byId(pid))!;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async update(id: number, input: ReturPenjualanInput, userId = 1): Promise<ReturPenjualan | null> {
    const t = this.totalsOf(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE gf.s_retpen SET no_c=COALESCE($2, no_c), tgl_pajak=$3, pelang=$4, pel_alamat=$5,
           sales=$6, gudang=$7, divisi_id=$8, jenpen_id=$9, cash=COALESCE($10, cash), tanggal=COALESCE($11, tanggal),
           mauang=COALESCE($12, mauang), kurs=COALESCE($13::numeric, kurs), kurs_pajak=COALESCE($14::numeric, kurs_pajak),
           penjua_id=$15, penjua_id2=$16,
           tot_harga=$17::numeric, tot_disc=$18::numeric, disc_nilai=COALESCE($19::numeric,0), disc_perst=COALESCE($20::numeric,0),
           ppn_tipe=COALESCE($21,0), ppn_pers=COALESCE($22::numeric,0), ppn_nilai=COALESCE($23::numeric,0),
           adj_01=COALESCE($24::numeric,0), adj_02=COALESCE($25::numeric,0), adj_03=COALESCE($26::numeric,0),
           adj_04=COALESCE($27::numeric,0), adj_05=COALESCE($28::numeric,0),
           term_crd=$29, catatan=$30, catatan_2=$31, catatan_3=$32, als_batal=$33,
           ubah_oleh=$34, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
         WHERE id=$1 AND hapus_oleh IS NULL`,
        [id, nn(input.no), nn(input.tglPajak), nn(input.pelangId), nn(input.pelAlamat),
         nn(input.salesId), nn(input.gudang), nn(input.divisiId), nn(input.jenpenId), input.cash ?? null, nn(input.tanggal),
         nn(input.mauang), input.kurs ? num(input.kurs) : null, input.kursPajak ? num(input.kursPajak) : null,
         nn(input.penjuaId), nn(input.penjuaId2),
         t.gross, t.totDisc, num(input.discNilai), num(input.discPerst), input.ppnTipe ?? 0, num(input.ppnPers), t.ppn,
         num(input.adj1), num(input.adj2), num(input.adj3), num(input.adj4), num(input.adj5),
         nn(input.termCrd), nn(input.catatan), nn(input.catatan2), nn(input.catatan3), nn(input.alsBatal), userId],
      );
      await client.query(`DELETE FROM gf.s_retpjd WHERE retpen_id=$1`, [id]);
      await this.writeLines(client, id, input.pelangId, input.tanggal, input.lines);
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
      `UPDATE gf.s_retpen SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
