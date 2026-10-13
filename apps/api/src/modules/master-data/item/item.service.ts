import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { Item, ItemInput, ItemPage, SisaStockPage } from "./item.types";

const COLS = `
  id, nama, barcode, nama_2 AS "nama2", vendor AS "vendorId", group_stk AS "groupStkId", jenis,
  harga_beli::text AS "hargaBeli",
  harga_j_01::text AS "hargaJual1", harga_j_02::text AS "hargaJual2", harga_j_03::text AS "hargaJual3",
  harga_j_04::text AS "hargaJual4", harga_j_05::text AS "hargaJual5",
  min_stock::text AS "minStock", tipe_satu AS "tipeSatu", sat_def AS "satDef",
  non_pajak AS "nonPajak", expired, catatan,
  sat_ecr AS "satEcr", kurs_jual AS "kursJual", sat_beli AS "satBeli", sat_min AS "satMin",
  min_jual::text AS "minJual", min_jl_st AS "minJlSt",
  sat_j_01 AS "satJ01", sat_j_02 AS "satJ02", sat_j_03 AS "satJ03", sat_j_04 AS "satJ04", sat_j_05 AS "satJ05",
  kode_c AS kode`;

function nn(v: unknown): unknown {
  return v === undefined || v === "" ? null : v;
}

@Injectable()
export class ItemService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(limit = 50, offset = 0, q?: string): Promise<ItemPage> {
    const params: unknown[] = [];
    let where = "WHERE hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (nama ILIKE $${params.length} OR barcode ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_stock ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT ${COLS} FROM gf.s_stock ${where} ORDER BY id LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as Item[], total: total.rows[0].n as number };
  }

  async byId(id: number): Promise<Item | null> {
    const r = await this.pool.query(`SELECT ${COLS} FROM gf.s_stock WHERE id=$1 AND hapus_oleh IS NULL`, [id]);
    return (r.rows[0] as Item) ?? null;
  }

  async create(input: ItemInput, userId = 1): Promise<Item> {
    const sql = `
      INSERT INTO gf.s_stock
        (id, nama, barcode, nama_2, vendor, group_stk, jenis,
         harga_beli, harga_j_01, harga_j_02, harga_j_03, harga_j_04, harga_j_05,
         min_stock, tipe_satu, sat_def, non_pajak, expired, catatan,
         input_oleh, tgl_input, jam_input)
      VALUES
        ((SELECT COALESCE(MAX(id),0)+1 FROM gf.s_stock), $1,$2,$3,$4,$5,$6,
         $7,$8,$9,$10,$11,$12,
         $13,$14,$15,$16,$17,$18,
         $19, now()::date, to_char(now(),'HH24:MI:SS'))
      RETURNING id`;
    const v = [
      input.nama, nn(input.barcode), nn(input.nama2), nn(input.vendorId), nn(input.groupStkId), nn(input.jenis),
      nn(input.hargaBeli), nn(input.hargaJual1), nn(input.hargaJual2), nn(input.hargaJual3), nn(input.hargaJual4), nn(input.hargaJual5),
      nn(input.minStock), nn(input.tipeSatu), nn(input.satDef), input.nonPajak ?? false, input.expired ?? false, nn(input.catatan),
      userId,
    ];
    const r = await this.pool.query(sql, v);
    await this.pool.query(
      `UPDATE gf.s_stock SET sat_ecr=$2, kurs_jual=$3, sat_beli=$4, sat_min=$5, min_jual=$6, min_jl_st=$7,
         sat_j_01=$8, sat_j_02=$9, sat_j_03=$10, sat_j_04=$11, sat_j_05=$12 WHERE id=$1`,
      [r.rows[0].id, nn(input.satEcr), nn(input.kursJual), nn(input.satBeli), nn(input.satMin), nn(input.minJual),
       nn(input.minJlSt), nn(input.satJ01), nn(input.satJ02), nn(input.satJ03), nn(input.satJ04), nn(input.satJ05)],
    );
    return (await this.byId(r.rows[0].id as number))!;
  }

  async update(id: number, input: ItemInput, userId = 1): Promise<Item | null> {
    const sql = `
      UPDATE gf.s_stock SET
        nama=$2, barcode=$3, nama_2=$4, vendor=$5, group_stk=$6, jenis=$7,
        harga_beli=$8, harga_j_01=$9, harga_j_02=$10, harga_j_03=$11, harga_j_04=$12, harga_j_05=$13,
        min_stock=$14, tipe_satu=$15, sat_def=$16, non_pajak=$17, expired=$18, catatan=$19,
        ubah_oleh=$20, tgl_ubah=now()::date, jam_ubah=to_char(now(),'HH24:MI:SS')
      WHERE id=$1 AND hapus_oleh IS NULL`;
    const v = [
      id, input.nama, nn(input.barcode), nn(input.nama2), nn(input.vendorId), nn(input.groupStkId), nn(input.jenis),
      nn(input.hargaBeli), nn(input.hargaJual1), nn(input.hargaJual2), nn(input.hargaJual3), nn(input.hargaJual4), nn(input.hargaJual5),
      nn(input.minStock), nn(input.tipeSatu), nn(input.satDef), input.nonPajak ?? false, input.expired ?? false, nn(input.catatan),
      userId,
    ];
    await this.pool.query(sql, v);
    await this.pool.query(
      `UPDATE gf.s_stock SET sat_ecr=$2, kurs_jual=$3, sat_beli=$4, sat_min=$5, min_jual=$6, min_jl_st=$7,
         sat_j_01=$8, sat_j_02=$9, sat_j_03=$10, sat_j_04=$11, sat_j_05=$12 WHERE id=$1`,
      [id, nn(input.satEcr), nn(input.kursJual), nn(input.satBeli), nn(input.satMin), nn(input.minJual),
       nn(input.minJlSt), nn(input.satJ01), nn(input.satJ02), nn(input.satJ03), nn(input.satJ04), nn(input.satJ05)],
    );
    return this.byId(id);
  }

  async softDelete(id: number, userId = 1): Promise<boolean> {
    const r = await this.pool.query(
      `UPDATE gf.s_stock SET hapus_oleh=$2, tgl_hapus=now()::date, jam_hapus=to_char(now(),'HH24:MI:SS')
       WHERE id=$1 AND hapus_oleh IS NULL`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  /** Sisa Stock (read-only): item + saldo stok per gudang + harga jual. */
  async sisaStockList(limit = 50, offset = 0, q?: string): Promise<SisaStockPage> {
    const params: unknown[] = [];
    let where = "WHERE s.hapus_oleh IS NULL";
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (s.nama ILIKE $${params.length} OR s.barcode ILIKE $${params.length})`;
    }
    const total = await this.pool.query(`SELECT count(*)::int AS n FROM gf.s_stock s ${where}`, params);
    params.push(limit, offset);
    const rows = await this.pool.query(
      `SELECT s.id, s.nama, g.nama AS "groupNama", s.kode_c AS kode, s.tipe_satu AS "tipeSatu", s.jenis,
              s.min_stock::text AS "minStock", s.catatan,
              s.input_oleh AS "inputOleh", to_char(s.tgl_input,'YYYY-MM-DD') AS "tglInput", s.jam_input AS "jamInput",
              s.ubah_oleh AS "ubahOleh", to_char(s.tgl_ubah,'YYYY-MM-DD') AS "tglUbah", s.jam_ubah AS "jamUbah",
              (COALESCE(s.sisa_stk01,0)+COALESCE(s.sisa_stk02,0)+COALESCE(s.sisa_stk03,0)+COALESCE(s.sisa_stk04,0)+COALESCE(s.sisa_stk05,0))::text AS sisa,
              COALESCE(s.sisa_stk01,0)::text AS "sisaAc",
              s.harga_j_01::text AS "hargaJual1", s.harga_j_02::text AS "hargaJual2", s.harga_j_03::text AS "hargaJual3",
              s.harga_j_04::text AS "hargaJual4", s.harga_j_05::text AS "hargaJual5"
       FROM gf.s_stock s LEFT JOIN gf.s_grpstk g ON g.id = s.group_stk
       ${where} ORDER BY s.id LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows as never, total: total.rows[0].n as number };
  }
}
