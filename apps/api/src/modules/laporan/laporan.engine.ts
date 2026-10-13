/** Report Engine v1 — registry aturan 1:1 per file .rpt (A4).
 *  Setiap rule mengembalikan LapSpec { base FROM.., cols[c0..cn], where, groupBy, orderBy }.
 *  Runner di laporan.service menjalankan SQL generik + mapping kolom c0..cn.
 */

export type LapCol = { sql: string; label: string; align?: "r" };
export type LapSpec = {
  base: string;
  cols: LapCol[];
  where?: string;
  groupBy?: string;
  orderBy?: string;
  catatan?: string;
};
export type RuleCtx = { file: string; nama: string; lower: string };
export type EngineRule = { id: string; test: (c: RuleCtx) => boolean; build: (c: RuleCtx) => LapSpec | null };

const V = "LEFT JOIN gf.s_vendor v ON v.id=h.vendor";
const PL = "LEFT JOIN gf.s_pelang pl ON pl.id=h.pelang";
const DIV = "LEFT JOIN gf.s_divisi dv ON dv.id=h.divisi_id";
const GUD = "";

const pick = (c: RuleCtx, ...words: string[]): boolean => words.every((w) => c.lower.includes(w));
const any = (c: RuleCtx, ...words: string[]): boolean => words.some((w) => c.lower.includes(w));

const tgl = (col = "h.tanggal") => `to_char(${col},'YYYY-MM-DD')`;
const num = (col: string) => `COALESCE(round(${col},2),0)::text`;
const alasan = `CASE WHEN COALESCE(h.als_batal,'')='' THEN '' ELSE h.als_batal END`;

// ---------- kolom umum ----------
function hdrCols(kode: string): LapCol[] {
  const no = kode === "purcor" ? "h.po::text" : "h.no::text";
  switch (kode) {
    case "purreq":
      return [
        { sql: no, label: "No" }, { sql: tgl(), label: "Tanggal" },
        { sql: "COALESCE(h.diminta,'')", label: "Diminta" },
        { sql: tgl("h.tgl_tutup"), label: "Tutup" },
        { sql: "COALESCE(dv.divisi,'')", label: "Divisi" },
        { sql: num("h.tot_harga"), label: "Nilai", align: "r" },
        { sql: "COALESCE(h.catatan,'')", label: "Catatan" },
        { sql: alasan, label: "Alasan Batal" },
      ];
    case "dn":
      return [
        { sql: no, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
        { sql: num("h.tot_harga"), label: "Harga", align: "r" }, { sql: num("h.tot_disc"), label: "Discount", align: "r" },
        { sql: num("h.disc_nilai"), label: "Disc Nilai", align: "r" }, { sql: num("h.tot_harga - h.tot_disc"), label: "Total", align: "r" },
        { sql: "COALESCE(h.catatan,'')", label: "Catatan" }, { sql: alasan, label: "Alasan Batal" },
      ];
    case "deppem":
      return [
        { sql: no, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
        { sql: "COALESCE(h.purcor_id::text,'')", label: "PO" },
        { sql: num("h.deposit"), label: "Deposit", align: "r" }, { sql: "COALESCE(dv.divisi,'')", label: "Divisi" },
        { sql: "COALESCE(h.catatan,'')", label: "Catatan" }, { sql: alasan, label: "Alasan Batal" },
      ];
    default: // pembel / purcor / retpem / lpemma
      return [
        { sql: no, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
        { sql: "COALESCE(dv.divisi,'')", label: "Divisi" },
        { sql: num("h.tot_harga"), label: "Harga", align: "r" }, { sql: num("h.tot_disc"), label: "Discount", align: "r" },
        { sql: num("COALESCE(h.ppn_nilai,0)"), label: "PPN", align: "r" },
        { sql: "COALESCE(h.catatan,'')", label: "Catatan" }, { sql: alasan, label: "Alasan Batal" },
      ];
  }
}

const whereBatal = (ctx: RuleCtx): string =>
  any(ctx, "batal", "(alasan)") ? "COALESCE(h.als_batal,'') <> ''" : "COALESCE(h.als_batal,'') = ''";

// ---------- builder per keluarga ----------
function withLines(ctx: RuleCtx, doc: string, lineJoin: string, kode: string): LapSpec {
  const noVend = doc === "gf.s_purreq";
  const cols: LapCol[] = [
    { sql: doc === "gf.s_purcor" ? "h.po::text" : "h.no::text", label: "No" }, { sql: tgl(), label: "Tanggal" },
    { sql: noVend ? "COALESCE(h.diminta,'')" : "COALESCE(v.nama,'')", label: noVend ? "Diminta" : "Vendor" },
    { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" },
    { sql: "COALESCE(s.nama,'')", label: "Nama" },
    { sql: "COALESCE(d.jumlah,0)::text", label: "Jumlah", align: "r" },
    { sql: "COALESCE(d.harga,0)::text", label: "Harga", align: "r" },
    { sql: "COALESCE(d.disc_pers,0)::text", label: "Disc%", align: "r" },
    { sql: "COALESCE(d.disc_pers2,0)::text", label: "Disc%2", align: "r" },
    { sql: "COALESCE(d.disc_pers3,0)::text", label: "Disc%3", align: "r" },
    { sql: `round(COALESCE(d.jumlah,0)*COALESCE(d.harga,0)*(1-COALESCE(d.disc_pers,0)/100)*(1-COALESCE(d.disc_pers2,0)/100)*(1-COALESCE(d.disc_pers3,0)/100)-COALESCE(d.disc_nilai,0),2)::text`, label: "Nilai", align: "r" },
    { sql: "COALESCE(d.catatan,'')", label: "Catatan" },
  ];
  return {
    base: `FROM ${doc} h ${noVend ? "" : V} JOIN ${lineJoin} d ON d.${kode}_id=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id`,
    cols, where: `${whereBatal(ctx)} AND d.tgl_hapus IS NULL`,
    orderBy: "h.id DESC, d.sys_id",
    catatan: `Sumber: ${doc} + ${lineJoin} (relasi ${kode}_id)`,
  };
}

function perBarang(ctx: RuleCtx, doc: string, lineJoin: string, kode: string, byGroup: boolean): LapSpec {
  const gExp = byGroup ? "COALESCE(gs.nama,'(tanpa kelompok)')" : "COALESCE(s.nama,'')";
  const kodeExp = "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)";
  const gJoin = byGroup ? "LEFT JOIN gf.s_grpstk gs ON gs.id=s.group_stk" : "";
  const cols: LapCol[] = [
    { sql: byGroup ? gExp : kodeExp, label: byGroup ? "Kelompok Barang" : "Kode" },
    ...(byGroup ? [] : [{ sql: gExp, label: "Nama" }]),
    { sql: "COALESCE(SUM(d.jumlah),0)::text", label: "Jumlah", align: "r" },
    { sql: "round(COALESCE(SUM(d.jumlah*d.harga*(1-COALESCE(d.disc_pers,0)/100)),0),2)::text", label: "Nilai", align: "r" },
  ];
  return {
    base: `FROM ${doc} h ${doc === "gf.s_purreq" ? "" : V} JOIN ${lineJoin} d ON d.${kode}_id=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id ${gJoin}`,
    cols, where: `${whereBatal(ctx)} AND d.tgl_hapus IS NULL`,
    groupBy: `GROUP BY ${byGroup ? gExp : `${kodeExp}, ${gExp}`}`,
    orderBy: "1",
    catatan: `Sumber: ${doc} + ${lineJoin} — agregasi ${byGroup ? "kelompok barang" : "per barang"}`,
  };
}

function bocorRealisasi(ctx: RuleCtx): LapSpec {
  const belum = pick(ctx, "belum");
  return {
    base: `FROM gf.s_purcor h ${V}
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(pe.jumlah),0) AS qty, COALESCE(SUM(pe.jumlah*pe.harga),0) AS nilai
        FROM gf.s_pembel pb JOIN gf.s_pembed pe ON pe.pembel_id=pb.id
        WHERE pb.purcor_id=h.id AND COALESCE(pb.hapus_oleh,0)=0) r ON true
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(po.jumlah),0) AS qty_po, COALESCE(SUM(po.jumlah*po.harga),0) AS nilai_po
        FROM gf.s_purcod po WHERE po.purcor_id=h.id) p ON true`,
    cols: [
      { sql: "h.po::text", label: "PO No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
      { sql: tgl("h.tgl_kirim"), label: "Tgl Kirim" }, { sql: "p.qty_po::text", label: "Qty PO", align: "r" }, { sql: "r.qty::text", label: "Qty Terima", align: "r" },
      { sql: "round(p.nilai_po,2)::text", label: "Nilai PO", align: "r" }, { sql: "round(r.nilai,2)::text", label: "Nilai Terima", align: "r" },
    ],
    where: `${whereBatal(ctx)} AND (${belum ? "r.qty < p.qty_po" : "p.qty_po > 0 AND r.qty >= p.qty_po"})`,
    orderBy: "h.id DESC",
    catatan: belum ? "PO belum terealisasi penuh (Qty Terima < Qty PO) — relasi purcor_id" : "PO realisasi penuh (Qty Terima >= Qty PO)",
  };
}

// ---------- SALES (Penjualan) helpers ----------
const NAC = "COALESCE(h.no_c, h.no::text)";
const PEL = "COALESCE(h.pel_nama,'')";
const NILAI_JUAL = `round(COALESCE(d.jumlah,0)*COALESCE(d.harga,0)*(1-COALESCE(d.disc_pers,0)/100)*(1-COALESCE(d.disc_pers2,0)/100)*(1-COALESCE(d.disc_pers3,0)/100)-COALESCE(d.disc_nilai,0),2)::text`;

function salesHdr(noExpr: string, ppn: boolean): LapCol[] {
  const cols: LapCol[] = [
    { sql: noExpr, label: "No" }, { sql: tgl(), label: "Tanggal" },
    { sql: PEL, label: "Pelanggan" }, { sql: "COALESCE(dv.divisi,'')", label: "Divisi" },
    { sql: num("h.tot_harga"), label: "Harga", align: "r" }, { sql: num("h.tot_disc"), label: "Discount", align: "r" },
  ];
  if (ppn) cols.push({ sql: num("h.ppn_nilai"), label: "PPN", align: "r" });
  cols.push({ sql: "COALESCE(h.catatan,'')", label: "Catatan" }, { sql: alasan, label: "Alasan Batal" });
  return cols;
}

function salesWithLines(ctx: RuleCtx, doc: string, lineJoin: string, fk: string, noExpr: string): LapSpec {
  return {
    base: `FROM ${doc} h ${DIV} JOIN ${lineJoin} d ON d.${fk}=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id`,
    cols: [
      { sql: noExpr, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
      { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
      { sql: "COALESCE(d.jumlah,0)::text", label: "Jumlah", align: "r" },
      { sql: "COALESCE(d.harga,0)::text", label: "Harga", align: "r" },
      { sql: "COALESCE(d.disc_pers,0)::text", label: "Disc%", align: "r" },
      { sql: "COALESCE(d.disc_pers2,0)::text", label: "Disc%2", align: "r" },
      { sql: "COALESCE(d.disc_pers3,0)::text", label: "Disc%3", align: "r" },
      { sql: NILAI_JUAL, label: "Nilai", align: "r" },
      { sql: "COALESCE(d.catatan,'')", label: "Catatan" },
    ],
    where: `${whereBatal(ctx)} AND d.tgl_hapus IS NULL`,
    orderBy: "h.id DESC, d.sys_id",
    catatan: `Sumber: ${doc} + ${lineJoin} (relasi ${fk})`,
  };
}

function salesPerBarang(ctx: RuleCtx, doc: string, lineJoin: string, fk: string, byGroup: boolean): LapSpec {
  const gExp = byGroup ? "COALESCE(gs.nama,'(tanpa kelompok)')" : "COALESCE(s.nama,'')";
  const kodeExp = "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)";
  const gJoin = byGroup ? "LEFT JOIN gf.s_grpstk gs ON gs.id=s.group_stk" : "";
  const cols: LapCol[] = byGroup
    ? [
        { sql: gExp, label: "Kelompok Barang" },
        { sql: "COALESCE(SUM(d.jumlah),0)::text", label: "Jumlah", align: "r" },
        { sql: "round(COALESCE(SUM(d.jumlah*d.harga*(1-COALESCE(d.disc_pers,0)/100)),0),2)::text", label: "Nilai", align: "r" },
      ]
    : [
        { sql: kodeExp, label: "Kode" }, { sql: gExp, label: "Nama" },
        { sql: "COALESCE(SUM(d.jumlah),0)::text", label: "Jumlah", align: "r" },
        { sql: "round(COALESCE(SUM(d.jumlah*d.harga*(1-COALESCE(d.disc_pers,0)/100)),0),2)::text", label: "Nilai", align: "r" },
      ];
  return {
    base: `FROM ${doc} h ${DIV} JOIN ${lineJoin} d ON d.${fk}=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id ${gJoin}`,
    cols, where: `${whereBatal(ctx)} AND d.tgl_hapus IS NULL`,
    groupBy: `GROUP BY ${byGroup ? gExp : `${kodeExp}, ${gExp}`}`,
    orderBy: "1",
    catatan: `Agregasi ${byGroup ? "kelompok barang" : "per barang"} — ${doc} + ${lineJoin}`,
  };
}

// ---------- MODUL (Lainnya/881) helpers ----------
const KODE = "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)";

function modWithLines(doc: string, lineJoin: string, fk: string, noExpr: string): LapSpec {
  return {
    base: `FROM ${doc} h ${DIV} JOIN ${lineJoin} d ON d.${fk}=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id`,
    cols: [
      { sql: noExpr, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(dv.divisi,'')", label: "Divisi" },
      { sql: KODE, label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
      { sql: "COALESCE(d.jumlah,0)::text", label: "Jumlah", align: "r" },
      { sql: "COALESCE(d.hpp,0)::text", label: "HPP", align: "r" },
      { sql: "round(COALESCE(d.jumlah,0)*COALESCE(d.hpp,0),2)::text", label: "Nilai HPP", align: "r" },
      { sql: "COALESCE(d.catatan,'')", label: "Catatan" },
    ],
    where: `COALESCE(h.als_batal,'')='' AND d.tgl_hapus IS NULL`,
    orderBy: "h.id DESC, d.sys_id",
    catatan: `Sumber: ${doc} + ${lineJoin} (relasi ${fk})`,
  };
}

function modPerBarang(ctx: RuleCtx, doc: string, lineJoin: string, fk: string, byGroup: boolean): LapSpec {
  const gExp = byGroup ? "COALESCE(gs.nama,'(tanpa kelompok)')" : "COALESCE(s.nama,'')";
  const kodeExp = "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)";
  const gJoin = byGroup ? "LEFT JOIN gf.s_grpstk gs ON gs.id=s.group_stk" : "";
  const cols: LapCol[] = byGroup
    ? [
        { sql: gExp, label: "Kelompok Barang" },
        { sql: "COALESCE(SUM(d.jumlah),0)::text", label: "Jumlah", align: "r" },
        { sql: "round(COALESCE(SUM(d.jumlah*COALESCE(d.hpp,0)),0),2)::text", label: "Nilai HPP", align: "r" },
      ]
    : [
        { sql: kodeExp, label: "Kode" }, { sql: gExp, label: "Nama" },
        { sql: "COALESCE(SUM(d.jumlah),0)::text", label: "Jumlah", align: "r" },
        { sql: "round(COALESCE(SUM(d.jumlah*COALESCE(d.hpp,0)),0),2)::text", label: "Nilai HPP", align: "r" },
      ];
  return {
    base: `FROM ${doc} h ${DIV} JOIN ${lineJoin} d ON d.${fk}=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id ${gJoin}`,
    cols, where: `COALESCE(h.als_batal,'')='' AND d.tgl_hapus IS NULL`,
    groupBy: `GROUP BY ${byGroup ? gExp : `${kodeExp}, ${gExp}`}`,
    orderBy: "1",
    catatan: `Agregasi ${byGroup ? "kelompok barang" : "per barang"} — ${doc} + ${lineJoin} (nilai = jumlah × hpp)`,
  };
}

function modList(doc: string, noExpr: string, where: string, extra?: LapCol[]): LapSpec {
  return {
    base: `FROM ${doc} h ${DIV}`,
    cols: [
      { sql: noExpr, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(dv.divisi,'')", label: "Divisi" },
      ...(extra ?? []),
      { sql: "COALESCE(h.catatan,'')", label: "Catatan" }, { sql: alasan, label: "Alasan Batal" },
    ],
    where,
    orderBy: "h.id DESC",
    catatan: `Sumber: ${doc}`,
  };
}

// ---------- REGISTRY ----------
export const ENGINE_RULES: EngineRule[] = [
  {
    id: "pembelian-101-pr",
    test: (c) => c.file.startsWith("101 "),
    build: (c) => {
      if (pick(c, "detail")) return withLines(c, "gf.s_purreq", "gf.s_purrex", "purreq");
      if (pick(c, "kelompok")) return perBarang(c, "gf.s_purreq", "gf.s_purrex", "purreq", true);
      if (any(c, "per barang", "total")) return perBarang(c, "gf.s_purreq", "gf.s_purrex", "purreq", false);
      return {
        base: `FROM gf.s_purreq h ${DIV}`,
        cols: hdrCols("purreq"), where: whereBatal(c), orderBy: "h.id DESC",
        catatan: "Sumber: gf.s_purreq",
      };
    },
  },
  {
    id: "pembelian-111-po",
    test: (c) => c.file.startsWith("111 "),
    build: (c) => {
      if (pick(c, "detail")) return withLines(c, "gf.s_purcor", "gf.s_purcod", "purcor");
      if (pick(c, "kelompok")) return perBarang(c, "gf.s_purcor", "gf.s_purcod", "purcor", true);
      if (any(c, "per barang", "total")) return perBarang(c, "gf.s_purcor", "gf.s_purcod", "purcor", false);
      return { base: `FROM gf.s_purcor h ${V} ${DIV}`, cols: hdrCols("purcor"), where: whereBatal(c), orderBy: "h.id DESC", catatan: "Sumber: gf.s_purcor" };
    },
  },
  {
    id: "pembelian-112-realisasi",
    test: (c) => c.file.startsWith("112 "),
    build: (c) => {
      const spec = bocorRealisasi(c);
      if (pick(c, "per barang")) {
        return {
          base: `FROM gf.s_purcor h JOIN gf.s_purcod d ON d.purcor_id=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id
                 LEFT JOIN LATERAL (SELECT COALESCE(SUM(pe.jumlah),0) q FROM gf.s_pembel pb JOIN gf.s_pembed pe ON pe.pembel_id=pb.id WHERE pb.purcor_id=h.id AND pe.stock_id=d.stock_id AND COALESCE(pb.hapus_oleh,0)=0) r ON true`,
          cols: [
            { sql: "COALESCE(s.nama,'')", label: "Nama" },
            { sql: "COALESCE(d.jumlah,0)::text", label: "Qty PO", align: "r" },
            { sql: "r.q::text", label: "Qty Terima", align: "r" },
          ],
          where: `${whereBatal(c)} AND (${pick(c, "belum") ? "r.q < d.jumlah" : "d.jumlah > 0 AND r.q >= d.jumlah"})`,
          orderBy: "h.id DESC",
          catatan: "PO realisasi per barang (relasi purcor_id pada detail)",
        };
      }
      return spec;
    },
  },
  {
    id: "pembelian-113-estimasi",
    test: (c) => c.file.startsWith("113 "),
    build: (c) => {
      if (pick(c, "detail")) return withLines(c, "gf.s_purcor", "gf.s_purcod", "purcor");
      if (pick(c, "kelompok")) return perBarang(c, "gf.s_purcor", "gf.s_purcod", "purcor", true);
      if (any(c, "per barang", "total")) return perBarang(c, "gf.s_purcor", "gf.s_purcod", "purcor", false);
      return {
        base: `FROM gf.s_purcor h ${V} LEFT JOIN LATERAL (SELECT COALESCE(SUM(po.jumlah),0) q, COALESCE(SUM(po.jumlah*po.harga),0) n FROM gf.s_purcod po WHERE po.purcor_id=h.id) p ON true`,
        cols: [
          { sql: "h.po::text", label: "PO No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
          { sql: tgl("h.tgl_kirim"), label: "Estimasi Kirim" }, { sql: "p.q::text", label: "Qty Estimasi", align: "r" }, { sql: "round(p.n,2)::text", label: "Nilai Estimasi", align: "r" },
        ],
        where: whereBatal(c), orderBy: "h.id DESC",
        catatan: "Estimasi penerimaan = Tgl Kirim + total PO (relasi purcor_id/purcod_id)",
      };
    },
  },
  {
    id: "pembelian-121-penerimaan",
    test: (c) => c.file.startsWith("121 "),
    build: (c) => {
      if (pick(c, "detail")) return withLines(c, "gf.s_pembel", "gf.s_pembed", "pembel");
      if (pick(c, "kelompok")) return perBarang(c, "gf.s_pembel", "gf.s_pembed", "pembel", true);
      if (any(c, "per barang", "total")) return perBarang(c, "gf.s_pembel", "gf.s_pembed", "pembel", false);
      return { base: `FROM gf.s_pembel h ${V} ${DIV}`, cols: hdrCols("pembel"), where: whereBatal(c), orderBy: "h.id DESC", catatan: "Sumber: gf.s_pembel (Penerimaan Barang)" };
    },
  },
  {
    id: "pembelian-131",
    test: (c) => c.file.startsWith("131 "),
    build: (c) => {
      if (pick(c, "pajak", "1108b")) {
        return {
          base: `FROM gf.s_pembel h ${V}`,
          cols: [
            { sql: "COALESCE(h.no_fakpjk,'')", label: "No Faktur Pajak" }, { sql: tgl("h.tgl_fakpjk"), label: "Tgl Faktur" },
            { sql: "h.no::text", label: "No Pembelian" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
            { sql: num("h.tot_harga"), label: "DPP", align: "r" }, { sql: num("h.ppn_nilai"), label: "PPN", align: "r" },
          ],
          where: "COALESCE(h.hapus_oleh,0)=0 AND COALESCE(h.no_fakpjk,'')<>''", orderBy: "h.id DESC",
          catatan: "Pajak 1108B: DPP & PPN per faktur pajak",
        };
      }
      if (pick(c, "deposit")) {
        return {
          base: `FROM gf.s_pembel h ${V}`,
          cols: [
            { sql: "h.no::text", label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
            { sql: num("h.tot_harga"), label: "Harga", align: "r" }, { sql: num("h.deposit"), label: "Deposit", align: "r" },
          ],
          where: "COALESCE(h.hapus_oleh,0)=0 AND COALESCE(h.deposit,0)<>0", orderBy: "h.id DESC",
          catatan: "Pembelian dengan Deposit",
        };
      }
      if (pick(c, "adjust")) {
        return {
          base: `FROM gf.s_pembel h ${V}`,
          cols: [
            { sql: "h.no::text", label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
            { sql: num("COALESCE(h.adj_01,0)+COALESCE(h.adj_02,0)+COALESCE(h.adj_03,0)+COALESCE(h.adj_04,0)+COALESCE(h.adj_05,0)"), label: "Adjustment", align: "r" },
            { sql: num("h.tot_harga"), label: "Harga", align: "r" },
          ],
          where: "COALESCE(h.hapus_oleh,0)=0 AND COALESCE(h.adj_01,0)+COALESCE(h.adj_02,0)+COALESCE(h.adj_03,0)+COALESCE(h.adj_04,0)+COALESCE(h.adj_05,0)<>0",
          orderBy: "h.id DESC", catatan: "Pembelian dengan Adjustment",
        };
      }
      if (pick(c, "detail")) return withLines(c, "gf.s_pembel", "gf.s_pembed", "pembel");
      if (pick(c, "kelompok")) return perBarang(c, "gf.s_pembel", "gf.s_pembed", "pembel", true);
      if (any(c, "per barang", "total")) return perBarang(c, "gf.s_pembel", "gf.s_pembed", "pembel", false);
      return { base: `FROM gf.s_pembel h ${V} ${DIV}`, cols: hdrCols("pembel"), where: whereBatal(c), orderBy: "h.id DESC", catatan: "Sumber: gf.s_pembel" };
    },
  },
  {
    id: "pembelian-132-tanpa-item",
    test: (c) => c.file.startsWith("132 "),
    build: (c) => ({
      base: `FROM gf.s_dcnhut h ${V}`,
      cols: hdrCols("dn"),
      where: "COALESCE(h.hapus_oleh,0)=0 AND COALESCE(h.tanpa_item,false)=true",
      orderBy: "h.id DESC",
      catatan: "Pembelian Tanpa Item (s_dcnhut.tanpa_item)",
    }),
  },
  {
    id: "pembelian-133-retur",
    test: (c) => c.file.startsWith("133 "),
    build: (c) => {
      if (pick(c, "detail")) return withLines(c, "gf.s_retpem", "gf.s_retpbd", "retpem");
      if (pick(c, "kelompok")) return perBarang(c, "gf.s_retpem", "gf.s_retpbd", "retpem", true);
      if (any(c, "per barang", "total")) return perBarang(c, "gf.s_retpem", "gf.s_retpbd", "retpem", false);
      return { base: `FROM gf.s_retpem h ${V} ${DIV}`, cols: hdrCols("retpem"), where: whereBatal(c), orderBy: "h.id DESC", catatan: "Sumber: gf.s_retpem" };
    },
  },
  {
    id: "pembelian-141-142-dn-cn",
    test: (c) => c.file.startsWith("141 ") || c.file.startsWith("142 "),
    build: (c) => {
      const credit = c.file.startsWith("142 ");
      const jenis = credit ? "COALESCE(h.credit,false)=true" : "COALESCE(h.credit,false)=false";
      if (pick(c, "detail")) return withLines(c, "gf.s_dcnhut", "gf.s_dcnhex", "dcnhut");
      if (pick(c, "kelompok")) return perBarang(c, "gf.s_dcnhut", "gf.s_dcnhex", "dcnhut", true);
      if (any(c, "per barang", "total")) return perBarang(c, "gf.s_dcnhut", "gf.s_dcnhex", "dcnhut", false);
      return {
        base: `FROM gf.s_dcnhut h ${V}`,
        cols: hdrCols("dn"),
        where: `${jenis} AND ${whereBatal(c)}`,
        orderBy: "h.id DESC",
        catatan: `Sumber: gf.s_dcnhut (${credit ? "Credit Note" : "Debit Note"} via flag credit)`,
      };
    },
  },
  {
    id: "pembelian-151-deposit",
    test: (c) => c.file.startsWith("151 "),
    build: (c) => ({
      base: `FROM gf.s_deppem h ${V} ${DIV}`,
      cols: hdrCols("deppem"),
      where: whereBatal(c),
      orderBy: "h.id DESC",
      catatan: "Sumber: gf.s_deppem",
    }),
  },
  {
    id: "pembelian-161-bayar",
    test: (c) => c.file.startsWith("161 "),
    build: (c) => {
      const byNota = pick(c, "tgl nota");
      return {
        base: `FROM gf.s_lpemma h ${V} ${DIV} LEFT JOIN LATERAL (
            SELECT COALESCE(SUM(l.lunas - COALESCE(l.discount,0) + COALESCE(l.denda,0)),0) n FROM gf.s_lunpem l WHERE l.lpemma_id=h.id) t ON true`,
        cols: [
          { sql: "h.no::text", label: "No" }, { sql: tgl(), label: "Tanggal Bayar" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
          { sql: "COALESCE(dv.divisi,'')", label: "Divisi" }, { sql: "round(t.n,2)::text", label: "Nilai Bayar", align: "r" },
          { sql: "COALESCE(h.catatan,'')", label: "Catatan" }, { sql: alasan, label: "Alasan Batal" },
        ],
        where: whereBatal(c),
        orderBy: byNota ? "h.id DESC" : "h.tanggal DESC",
        catatan: `Pembayaran Hutang (${byNota ? "based tgl nota" : "based tgl bayar"}) — s_lpemma + s_lunpem`,
      };
    },
  },
  {
    id: "pembelian-162-hutang",
    test: (c) => c.file.startsWith("162 "),
    build: (c) => {
      const aging = pick(c, "aging");
      const cols: LapCol[] = [
        { sql: "COALESCE(v.nama,'')", label: "Vendor" },
        { sql: "p.no::text", label: "Nota" }, { sql: tgl("p.tanggal"), label: "Tanggal" },
        { sql: "round(p.tot_harga + COALESCE(p.ppn_nilai,0),2)::text", label: "Total", align: "r" },
        { sql: "round(COALESCE(b.bayar,0),2)::text", label: "Telah Lunas", align: "r" },
        { sql: "round(COALESCE(r.retur,0),2)::text", label: "Retur", align: "r" },
        { sql: "round(p.tot_harga + COALESCE(p.ppn_nilai,0) - COALESCE(b.bayar,0) - COALESCE(r.retur,0),2)::text", label: "Sisa", align: "r" },
        { sql: "(CURRENT_DATE - p.tanggal)::text", label: "Umur (hari)", align: "r" },
        { sql: "CASE WHEN (CURRENT_DATE - p.tanggal) <= 30 THEN '0-30' WHEN (CURRENT_DATE - p.tanggal) <= 60 THEN '31-60' WHEN (CURRENT_DATE - p.tanggal) <= 90 THEN '61-90' ELSE '>90' END", label: "Aging", },
      ];
      const sisa = "round(p.tot_harga + COALESCE(p.ppn_nilai,0) - COALESCE(b.bayar,0) - COALESCE(r.retur,0),2)";
      let where = "COALESCE(p.hapus_oleh,0)=0";
      if (pick(c, "lunas dan")) where += ` AND ${sisa} <= 0`;
      else if (pick(c, "lunas") && !pick(c, "sisa")) where += ` AND ${sisa} <= 0`;
      else if (pick(c, "sisa")) where += ` AND ${sisa} > 0`;
      if (pick(c, "statement")) where += ` AND ${sisa} <> 0`;
      return {
        base: `FROM gf.s_pembel p LEFT JOIN gf.s_vendor v ON v.id=p.vendor
          LEFT JOIN LATERAL (SELECT SUM(l.lunas - COALESCE(l.discount,0) + COALESCE(l.denda,0)) bayar FROM gf.s_lunpem l JOIN gf.s_lpemma m ON m.id=l.lpemma_id AND COALESCE(m.hapus_oleh,0)=0 WHERE l.pembel_id=p.id) b ON true
          LEFT JOIN LATERAL (SELECT SUM(rp.tot_harga) retur FROM gf.s_retpem rp WHERE rp.pembel_id=p.id AND COALESCE(rp.hapus_oleh,0)=0) r ON true`,
        cols: aging ? cols : cols.slice(0, 7),
        where,
        orderBy: "v.nama, p.tanggal",
      catatan: `Sisa Hutang = (Harga+PPN) − Bayar − Retur${aging ? " + umur & bucket aging" : ""} — s_pembel/s_lunpem/s_retpem`,
      };
    },
  },
  // ===== PENJUALAN (201/221/222/231/241/242/243/248/251/252/261/271/281/282/291) =====
  {
    id: "penjualan-201-quotation",
    test: (c) => c.file.startsWith("201 "),
    build: (c) => {
      if (pick(c, "detail")) return salesWithLines(c, "gf.s_quotat", "gf.s_quotex", "quotat_id", "h.no::text");
      if (pick(c, "kelompok")) return salesPerBarang(c, "gf.s_quotat", "gf.s_quotex", "quotat_id", true);
      if (any(c, "per barang", "total")) return salesPerBarang(c, "gf.s_quotat", "gf.s_quotex", "quotat_id", false);
      return {
        base: `FROM gf.s_quotat h ${DIV}`, cols: salesHdr("h.no::text", false), where: whereBatal(c),
        orderBy: "h.id DESC", catatan: "Sumber: gf.s_quotat (Quotation)",
      };
    },
  },
  {
    id: "penjualan-221-so",
    test: (c) => c.file.startsWith("221 "),
    build: (c) => {
      if (pick(c, "detail")) return salesWithLines(c, "gf.s_salord", "gf.s_saloex", "salord_id", NAC);
      if (pick(c, "kelompok")) return salesPerBarang(c, "gf.s_salord", "gf.s_saloex", "salord_id", true);
      if (any(c, "per barang", "total")) return salesPerBarang(c, "gf.s_salord", "gf.s_saloex", "salord_id", false);
      return {
        base: `FROM gf.s_salord h ${DIV}`, cols: salesHdr(NAC, true), where: whereBatal(c),
        orderBy: "h.id DESC", catatan: "Sumber: gf.s_salord (Sales Order)",
      };
    },
  },
  {
    id: "penjualan-222-so-realisasi",
    test: (c) => c.file.startsWith("222 "),
    build: (c) => {
      const belum = pick(c, "belum");
      if (pick(c, "per barang")) return {
        base: "FROM gf.s_salord h JOIN gf.s_saloex d ON d.salord_id=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(d.jumlah,0)::text", label: "Qty SO", align: "r" },
          { sql: "CASE WHEN d.toex_rec IS NULL OR d.toex_rec='' THEN '0' ELSE COALESCE(d.jumlah,0)::text END", label: "Qty Realisasi", align: "r" },
        ],
        where: `${whereBatal(c)} AND d.tgl_hapus IS NULL AND (d.toex_rec IS ${belum ? "NULL OR d.toex_rec=''" : "NOT NULL AND d.toex_rec<>''"})`,
        orderBy: "h.id DESC",
        catatan: `SO ${belum ? "belum" : "sudah"} terealisasi per barang (flag s_saloex.toex_rec)`,
      };
      return {
        base: `FROM gf.s_salord h ${DIV}`,
        cols: salesHdr(NAC, true),
        where: `${whereBatal(c)} AND ${belum ? "" : "NOT "}EXISTS (SELECT 1 FROM gf.s_saloex x WHERE x.salord_id=h.id AND (x.toex_rec IS NULL OR x.toex_rec=''))`,
        orderBy: "h.id DESC",
        catatan: `SO ${belum ? "belum" : "sudah"} terealisasi penuh (flag toex_rec pada s_saloex)`,
      };
    },
  },
  {
    id: "penjualan-231-pengeluaran",
    test: (c) => c.file.startsWith("231 "),
    build: (c) => {
      if (pick(c, "detail")) return salesWithLines(c, "gf.s_klrstk", "gf.s_klrsex", "klrstk_id", NAC);
      if (pick(c, "kelompok")) return salesPerBarang(c, "gf.s_klrstk", "gf.s_klrsex", "klrstk_id", true);
      if (any(c, "per barang", "total")) return salesPerBarang(c, "gf.s_klrstk", "gf.s_klrsex", "klrstk_id", false);
      return {
        base: `FROM gf.s_klrstk h ${DIV}`, cols: salesHdr(NAC, false), where: whereBatal(c),
        orderBy: "h.id DESC", catatan: "Sumber: gf.s_klrstk (Pengeluaran Barang)",
      };
    },
  },
  {
    id: "penjualan-241",
    test: (c) => c.file.startsWith("241 "),
    build: (c) => {
      const aktif = "COALESCE(h.als_batal,'')=''";
      if (pick(c, "grafik")) {
        const byKel = pick(c, "kelompok");
        return {
          base: byKel
            ? "FROM gf.s_penjua h JOIN gf.s_penjud d ON d.penjua_id=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id LEFT JOIN gf.s_grpstk gs ON gs.id=s.group_stk"
            : "FROM gf.s_penjua h",
          cols: byKel
            ? [
                { sql: "COALESCE(gs.nama,'(tanpa kelompok)')", label: "Kelompok Barang" },
                { sql: "round(COALESCE(SUM(d.jumlah*d.harga*(1-COALESCE(d.disc_pers,0)/100)),0),2)::text", label: "Nilai", align: "r" },
              ]
            : [
                { sql: tgl(), label: "Tanggal" },
                { sql: "round(COALESCE(SUM(h.tot_harga - h.tot_disc),0),2)::text", label: "Nilai", align: "r" },
              ],
          where: byKel ? `d.tgl_hapus IS NULL AND ${aktif}` : aktif,
          groupBy: byKel ? "GROUP BY COALESCE(gs.nama,'(tanpa kelompok)')" : `GROUP BY ${tgl()}`,
          orderBy: "1 DESC",
          catatan: "Data grafik (Batang/Garis/Pie) disajikan sebagai tabel",
        };
      }
      if (pick(c, "pajak")) return {
        base: `FROM gf.s_penjua h ${DIV}`,
        cols: [
          { sql: NAC, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
          { sql: num("h.tot_harga - h.tot_disc"), label: "DPP", align: "r" }, { sql: num("h.ppn_nilai"), label: "PPN", align: "r" },
          { sql: num("h.tot_pajak"), label: "Total Pajak", align: "r" },
        ],
        where: `${aktif} AND COALESCE(h.ppn_nilai,0)<>0`, orderBy: "h.id DESC",
        catatan: "Pajak 1108A: PPN penjualan per nota (s_penjua.ppn_nilai)",
      };
      if (pick(c, "terpakai")) return {
        base: `FROM gf.s_penjua h ${DIV}`, cols: salesHdr(NAC, true), where: aktif, orderBy: "h.no",
        catatan: "Nomor penjualan yang sudah terpakai",
      };
      if (pick(c, "per jam")) return {
        base: `FROM gf.s_penjua h`,
        cols: [
          { sql: tgl(), label: "Tanggal" },
          { sql: "left(lpad(COALESCE(h.pukul::text,''),4,'0'),2)", label: "Jam" },
          { sql: "count(*)::text", label: "Jml Nota", align: "r" },
          { sql: "round(COALESCE(SUM(h.tot_harga - h.tot_disc),0),2)::text", label: "Nilai", align: "r" },
        ],
        where: aktif, groupBy: `GROUP BY ${tgl()}, left(lpad(COALESCE(h.pukul::text,''),4,'0'),2)`, orderBy: "1, 2",
        catatan: "Rekap penjualan per tanggal & jam",
      };
      if (pick(c, "komisi")) return {
        base: "FROM gf.s_penjua h LEFT JOIN gf.s_karyaw k ON k.id=h.sales",
        cols: [
          { sql: "COALESCE(k.nama, h.sales::text)", label: "Sales" },
          { sql: "count(*)::text", label: "Jml Nota", align: "r" },
          { sql: "round(COALESCE(SUM(h.sales_kom),0),2)::text", label: "Komisi", align: "r" },
        ],
        where: aktif, groupBy: "GROUP BY COALESCE(k.nama, h.sales::text)", orderBy: "3 DESC",
        catatan: "Komisi sales = Σ s_penjua.sales_kom",
      };
      if (pick(c, "effective")) {
        const byKel = pick(c, "kelompok");
        return {
          base: byKel
            ? "FROM gf.s_penjua h LEFT JOIN gf.s_karyaw k ON k.id=h.sales JOIN gf.s_penjud d ON d.penjua_id=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id LEFT JOIN gf.s_grpstk gs ON gs.id=s.group_stk"
            : "FROM gf.s_penjua h LEFT JOIN gf.s_karyaw k ON k.id=h.sales",
          cols: byKel
            ? [
                { sql: "COALESCE(k.nama, h.sales::text)", label: "Sales" }, { sql: tgl(), label: "Tanggal" },
                { sql: "COALESCE(gs.nama,'(tanpa kelompok)')", label: "Kelompok Barang" },
                { sql: "count(DISTINCT h.id)::text", label: "Jml Kunjungan", align: "r" },
              ]
            : [
                { sql: "COALESCE(k.nama, h.sales::text)", label: "Sales" }, { sql: tgl(), label: "Tanggal" },
                { sql: "count(DISTINCT h.id)::text", label: "Jml Kunjungan", align: "r" },
                { sql: "round(COALESCE(SUM(h.tot_harga - h.tot_disc),0),2)::text", label: "Nilai", align: "r" },
              ],
          where: byKel ? `d.tgl_hapus IS NULL AND ${aktif}` : aktif,
          groupBy: byKel
            ? "GROUP BY COALESCE(k.nama, h.sales::text), " + tgl() + ", COALESCE(gs.nama,'(tanpa kelompok)')"
            : "GROUP BY COALESCE(k.nama, h.sales::text), " + tgl(),
          orderBy: "1, 2",
          catatan: "Analisa effective call per sales (rekap nota per sales/tanggal)",
        };
      }
      if (pick(c, "bonus")) return {
        base: "FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(SUM(d.jumlah),0)::text", label: "Jumlah", align: "r" },
          { sql: "round(COALESCE(SUM(d.jumlah*d.harga),0),2)::text", label: "Nilai", align: "r" },
        ],
        where: `d.tgl_hapus IS NULL AND ${aktif}`,
        groupBy: "GROUP BY COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,'')",
        orderBy: "3 DESC", catatan: "Bonus penjualan per barang (mengikuti baris penjualan)",
      };
      if (pick(c, "discount")) return {
        base: "FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(SUM(d.jumlah),0)::text", label: "Jumlah", align: "r" },
          { sql: "round(COALESCE(SUM(d.jumlah*d.harga*(COALESCE(d.disc_pers,0)/100)),0),2)::text", label: "Discount", align: "r" },
        ],
        where: `d.tgl_hapus IS NULL AND ${aktif} AND COALESCE(d.disc_pers,0)+COALESCE(d.disc_pers2,0)+COALESCE(d.disc_pers3,0)<>0`,
        groupBy: "GROUP BY COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,'')",
        orderBy: "4 DESC", catatan: "Discount penjualan per barang (Σ disc% baris)",
      };
      if (pick(c, "min harga")) return {
        base: "FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: NAC, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
          { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(d.harga,0)::text", label: "Harga Jual", align: "r" },
          { sql: "COALESCE(s.harga_j_01,0)::text", label: "Harga Min", align: "r" },
        ],
        where: `d.tgl_hapus IS NULL AND ${aktif} AND COALESCE(s.harga_j_01,0)>0 AND COALESCE(d.harga,0)<COALESCE(s.harga_j_01,0)`,
        orderBy: "h.id DESC", catatan: "Penjualan di bawah harga min (bandingkan harga baris vs s_stock.harga_j_01)",
      };
      if (pick(c, "kuantiti saja")) return {
        base: "FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(SUM(d.jumlah),0)::text", label: "Jumlah", align: "r" },
        ],
        where: `d.tgl_hapus IS NULL AND ${aktif}`,
        groupBy: "GROUP BY COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,'')",
        orderBy: "3 DESC", catatan: "Total penjualan per barang (kuantiti saja)",
      };
      if (pick(c, "serial")) return {
        base: "FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(d.stkser_1,'')", label: "Serial ID" },
          { sql: "COALESCE(SUM(d.jumlah),0)::text", label: "Jumlah", align: "r" },
        ],
        where: `d.tgl_hapus IS NULL AND ${aktif} AND COALESCE(d.stkser_id,0)<>0`,
        groupBy: "GROUP BY COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,''), COALESCE(d.stkser_1,'')",
        orderBy: "1, 3", catatan: "Penjualan per barang dengan Serial ID (stkser)",
      };
      if (pick(c, "record")) return {
        base: "FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "count(*)::text", label: "Jml Record", align: "r" },
        ],
        where: `d.tgl_hapus IS NULL AND ${aktif}`,
        groupBy: "GROUP BY COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,'')",
        orderBy: "3 DESC", catatan: "Jumlah record/baris penjualan per barang",
      };
      if (pick(c, "rata2")) return {
        base: "FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(SUM(d.jumlah),0)::text", label: "Jumlah", align: "r" },
          { sql: "round(COALESCE(SUM(d.jumlah*d.harga)/NULLIF(SUM(d.jumlah),0),0),2)::text", label: "Rata2 Harga", align: "r" },
        ],
        where: `d.tgl_hapus IS NULL AND ${aktif}`,
        groupBy: "GROUP BY COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,'')",
        orderBy: "1", catatan: "Rata-rata harga jual per barang",
      };
      if (pick(c, "ranking")) return {
        base: "FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(SUM(d.jumlah),0)::text", label: "Jumlah", align: "r" },
          { sql: "round(COALESCE(SUM(d.jumlah*d.harga*(1-COALESCE(d.disc_pers,0)/100)),0),2)::text", label: "Nilai", align: "r" },
        ],
        where: `d.tgl_hapus IS NULL AND ${aktif}`,
        groupBy: "GROUP BY COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,'')",
        orderBy: "4 DESC", catatan: "Ranking penjualan per barang (nilai desc)",
      };
      if (pick(c, "jml hari")) return {
        base: "FROM gf.s_penjua h",
        cols: [
          { sql: tgl(), label: "Tanggal" }, { sql: "count(*)::text", label: "Jml Faktur", align: "r" },
          { sql: "round(COALESCE(SUM(h.tot_harga - h.tot_disc),0),2)::text", label: "Nilai", align: "r" },
        ],
        where: aktif, groupBy: `GROUP BY ${tgl()}`, orderBy: "1",
        catatan: "Total penjualan per tanggal (jml faktur & hari)",
      };
      if (pick(c, "jml item")) return {
        base: "FROM gf.s_penjua h LEFT JOIN LATERAL (SELECT count(DISTINCT d.stock_id) AS n FROM gf.s_penjud d WHERE d.penjua_id=h.id AND d.tgl_hapus IS NULL) it ON true",
        cols: [
          { sql: "count(*)::text", label: "Jml Faktur", align: "r" },
          { sql: "count(DISTINCT h.pelang)::text", label: "Jml Pelanggan", align: "r" },
          { sql: "COALESCE(SUM(it.n),0)::text", label: "Jml Item", align: "r" },
          { sql: "round(COALESCE(SUM(h.tot_harga - h.tot_disc),0),2)::text", label: "Nilai", align: "r" },
        ],
        where: aktif, orderBy: "1",
        catatan: "Total penjualan: jml faktur + jml pelanggan + jml item",
      };
      if (pick(c, "jml faktur") && pick(c, "kelompok")) return {
        base: "FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id LEFT JOIN gf.s_stock s ON s.id=d.stock_id LEFT JOIN gf.s_grpstk gs ON gs.id=s.group_stk",
        cols: [
          { sql: "COALESCE(gs.nama,'(tanpa kelompok)')", label: "Kelompok Barang" },
          { sql: "count(DISTINCT h.id)::text", label: "Jml Faktur", align: "r" },
          { sql: "count(DISTINCT h.pelang)::text", label: "Jml Pelanggan", align: "r" },
        ],
        where: `d.tgl_hapus IS NULL AND ${aktif}`,
        groupBy: "GROUP BY COALESCE(gs.nama,'(tanpa kelompok)')", orderBy: "1",
        catatan: "Per kelompok barang: jml faktur + jml pelanggan",
      };
      if (pick(c, "jml faktur") && pick(c, "per barang")) return {
        base: "FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "count(DISTINCT h.id)::text", label: "Jml Faktur", align: "r" },
          { sql: "count(DISTINCT h.pelang)::text", label: "Jml Pelanggan", align: "r" },
        ],
        where: `d.tgl_hapus IS NULL AND ${aktif}`,
        groupBy: "GROUP BY COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,'')", orderBy: "1",
        catatan: "Per barang: jml faktur + jml pelanggan",
      };
      if (pick(c, "jumlah item")) return {
        base: "FROM gf.s_penjua h",
        cols: [
          { sql: "count(*)::text", label: "Jml Faktur", align: "r" },
          { sql: "round(COALESCE(SUM(h.tot_harga - h.tot_disc),0),2)::text", label: "Nilai", align: "r" },
        ],
        where: aktif, orderBy: "1", catatan: "Jumlah item penjualan (rekap faktur)",
      };
      if (pick(c, "jumlah penjualan")) return {
        base: "FROM gf.s_penjua h",
        cols: [
          { sql: tgl(), label: "Tanggal" }, { sql: "count(*)::text", label: "Jml Nota", align: "r" },
          { sql: "round(COALESCE(SUM(h.tot_harga - h.tot_disc),0),2)::text", label: "Nilai", align: "r" },
        ],
        where: aktif, groupBy: `GROUP BY ${tgl()}`, orderBy: "1",
        catatan: "Jumlah penjualan per tanggal",
      };
      if (pick(c, "dan retur")) return {
        base: `FROM gf.s_stock s
          LEFT JOIN (SELECT d.stock_id sid, COALESCE(SUM(d.jumlah),0) j FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id AND COALESCE(h.als_batal,'')='' WHERE d.tgl_hapus IS NULL GROUP BY d.stock_id) j ON j.sid=s.id
          LEFT JOIN (SELECT d.stock_id sid, COALESCE(SUM(d.jumlah),0) j FROM gf.s_retpjd d JOIN gf.s_retpen h ON h.id=d.retpen_id AND COALESCE(h.als_batal,'')='' WHERE d.tgl_hapus IS NULL GROUP BY d.stock_id) r ON r.sid=s.id`,
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, s.id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "j.j::text", label: "Jumlah Jual", align: "r" },
          { sql: "r.j::text", label: "Jumlah Retur", align: "r" },
          { sql: "(j.j - r.j)::text", label: "Netto", align: "r" },
        ],
        where: "j.j > 0 OR r.j > 0", orderBy: "1",
        catatan: "Total penjualan dan retur per barang (netto = jual − retur)",
      };
      if (pick(c, "adjust")) return {
        base: `FROM gf.s_penjua h ${DIV}`,
        cols: [
          { sql: NAC, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
          { sql: num("COALESCE(h.adj_01,0)+COALESCE(h.adj_02,0)+COALESCE(h.adj_03,0)+COALESCE(h.adj_04,0)+COALESCE(h.adj_05,0)"), label: "Adjustment", align: "r" },
          { sql: num("h.tot_harga"), label: "Harga", align: "r" },
        ],
        where: `${aktif} AND COALESCE(h.adj_01,0)+COALESCE(h.adj_02,0)+COALESCE(h.adj_03,0)+COALESCE(h.adj_04,0)+COALESCE(h.adj_05,0)<>0`,
        orderBy: "h.id DESC", catatan: "Penjualan dengan Adjustment (adj_01..adj_05)",
      };
      if (pick(c, "deposit")) return {
        base: `FROM gf.s_penjua h ${DIV}`,
        cols: [
          { sql: NAC, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
          { sql: num("h.deposit"), label: "Deposit", align: "r" }, { sql: num("h.tot_harga - h.tot_disc"), label: "Nilai", align: "r" },
        ],
        where: `${aktif} AND COALESCE(h.deposit,0)<>0`, orderBy: "h.id DESC",
        catatan: "Penjualan dengan Deposit",
      };
      if (pick(c, "eceran")) return {
        base: "FROM gf.s_ecrlst h JOIN gf.s_penecr d ON d.ecrlst_id=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: tgl("h.tanggal"), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
          { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(d.jumlah,0)::text", label: "Jumlah", align: "r" },
          { sql: "round(COALESCE(d.jumlah*d.harga*(1-COALESCE(d.disc_pers,0)/100),0),2)::text", label: "Nilai", align: "r" },
        ],
        where: "h.sts_ecr IS NOT NULL AND d.tgl_hapus IS NULL", orderBy: "h.tanggal DESC",
        catatan: "Penerimaan penjualan eceran non-cash (nota eceran s_ecrlst + baris s_penecr)",
      };
      if (pick(c, "tax")) return {
        base: "FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(SUM(d.jumlah),0)::text", label: "Jumlah", align: "r" },
          { sql: "round(COALESCE(SUM(d.jumlah*d.harga*(1-COALESCE(d.disc_pers,0)/100)),0),2)::text", label: "Nilai", align: "r" },
          { sql: "round(COALESCE(SUM(d.ppn_nilai),0),2)::text", label: "PPN", align: "r" },
        ],
        where: `d.tgl_hapus IS NULL AND ${aktif}`,
        groupBy: "GROUP BY COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,'')",
        orderBy: "1", catatan: "Penjualan per barang + PPN (Tax)" + (pick(c, "global") ? " + Global Disc header" : ""),
      };
      if (pick(c, "kelompok")) return salesPerBarang(c, "gf.s_penjua", "gf.s_penjud", "penjua_id", true);
      if (pick(c, "per barang")) return salesPerBarang(c, "gf.s_penjua", "gf.s_penjud", "penjua_id", false);
      if (pick(c, "detail")) return salesWithLines(c, "gf.s_penjua", "gf.s_penjud", "penjua_id", NAC);
      return {
        base: `FROM gf.s_penjua h ${DIV}`, cols: salesHdr(NAC, true), where: whereBatal(c),
        orderBy: "h.id DESC", catatan: "Sumber: gf.s_penjua (Penjualan)",
      };
    },
  },
  {
    id: "penjualan-242-tanpa-item",
    test: (c) => c.file.startsWith("242 "),
    build: (c) => ({
      base: `FROM gf.s_penjua h ${DIV}`,
      cols: salesHdr(NAC, true),
      where: `${whereBatal(c)} AND NOT EXISTS (SELECT 1 FROM gf.s_penjud d WHERE d.penjua_id=h.id AND d.tgl_hapus IS NULL)`,
      orderBy: "h.id DESC",
      catatan: "Penjualan tanpa item (tidak punya baris s_penjud)",
    }),
  },
  {
    id: "penjualan-243-retur",
    test: (c) => c.file.startsWith("243 "),
    build: (c) => {
      if (pick(c, "rusak")) return {
        base: "FROM gf.s_retpen h JOIN gf.s_retpjd d ON d.retpen_id=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: NAC, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
          { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(d.jumlah,0)::text", label: "Jumlah", align: "r" },
          { sql: "COALESCE(d.jml_rusak,0)::text", label: "Jml Rusak", align: "r" },
        ],
        where: `${whereBatal(c)} AND d.tgl_hapus IS NULL AND COALESCE(d.jml_rusak,0)<>0`,
        orderBy: "h.id DESC", catatan: "Retur penjualan per barang rusak (s_retpjd.jml_rusak)",
      };
      if (pick(c, "detail")) return salesWithLines(c, "gf.s_retpen", "gf.s_retpjd", "retpen_id", NAC);
      if (pick(c, "kelompok")) return salesPerBarang(c, "gf.s_retpen", "gf.s_retpjd", "retpen_id", true);
      if (any(c, "per barang", "total", "pivot")) return salesPerBarang(c, "gf.s_retpen", "gf.s_retpjd", "retpen_id", false);
      return {
        base: `FROM gf.s_retpen h ${DIV}`, cols: salesHdr(NAC, true), where: whereBatal(c),
        orderBy: "h.id DESC", catatan: "Sumber: gf.s_retpen (Retur Penjualan)",
      };
    },
  },
  {
    id: "penjualan-248",
    test: (c) => c.file.startsWith("248 "),
    build: (c) => {
      const aktif = "COALESCE(h.als_batal,'')=''";
      if (pick(c, "terjual") && pick(c, "sisa")) return {
        base: `FROM gf.s_stock s
          LEFT JOIN (SELECT d.stock_id sid, COALESCE(SUM(d.jumlah),0) j FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id AND COALESCE(h.als_batal,'')='' WHERE d.tgl_hapus IS NULL GROUP BY d.stock_id) j ON j.sid=s.id`,
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, s.id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "j.j::text", label: "Jumlah Jual", align: "r" },
          { sql: "COALESCE(s.harga_j_01,0)::text", label: "Harga Jual 1", align: "r" },
        ],
        where: "j.j > 0", orderBy: "3 DESC",
        catatan: "Barang terjual + info harga (sisa stock real-time dihitung dari kartu stock GF)",
      };
      if (pick(c, "tidak terjual")) {
        const perPel = pick(c, "pelanggan");
        const perSales = pick(c, "sales");
        return {
          base: `FROM gf.s_stock s
            LEFT JOIN (SELECT d.stock_id sid, COALESCE(SUM(d.jumlah),0) j FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id AND COALESCE(h.als_batal,'')='' WHERE d.tgl_hapus IS NULL GROUP BY d.stock_id) j ON j.sid=s.id`,
          cols: [
            { sql: "COALESCE(s.kode_c, s.kode_c_2, s.id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
            { sql: "j.j::text", label: "Jumlah Jual", align: "r" },
          ],
          where: "j.j = 0", orderBy: "1",
          catatan: `Barang tidak terjual${perPel ? " (konteks pelanggan)" : perSales ? " (konteks sales)" : ""} — stock tanpa baris penjualan aktif`,
        };
      }
      const perPel = pick(c, "pelanggan");
      const perSales = pick(c, "sales");
      const joinKar = perSales ? "LEFT JOIN gf.s_karyaw k ON k.id=h.sales" : "";
      const pcol = perPel
        ? [{ sql: PEL, label: "Pelanggan" }]
        : perSales
          ? [{ sql: "COALESCE(k.nama, h.sales::text)", label: "Sales" }]
          : [];
      return {
        base: `FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id ${joinKar} LEFT JOIN gf.s_stock s ON s.id=d.stock_id`,
        cols: [
          ...pcol,
          { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(SUM(d.jumlah),0)::text", label: "Jumlah", align: "r" },
        ],
        where: `d.tgl_hapus IS NULL AND ${aktif}`,
        groupBy: "GROUP BY " + (perPel ? `${PEL}, ` : perSales ? "COALESCE(k.nama, h.sales::text), " : "") + "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,'')",
        orderBy: `${pcol.length ? "1, " : ""}${pcol.length + 3} DESC`,
        catatan: "Barang jual terbanyak" + (perPel ? " per pelanggan" : perSales ? " per sales" : ""),
      };
    },
  },
  {
    id: "penjualan-251-252-dn-cn",
    test: (c) => c.file.startsWith("251 ") || c.file.startsWith("252 "),
    build: (c) => {
      const credit = c.file.startsWith("252 ");
      const jenis = credit ? "COALESCE(h.credit,false)=true" : "COALESCE(h.credit,false)=false";
      if (pick(c, "detail")) return salesWithLines(c, "gf.s_dcnpiu", "gf.s_dcnpex", "dcnpiu_id", NAC);
      if (pick(c, "kelompok")) return salesPerBarang(c, "gf.s_dcnpiu", "gf.s_dcnpex", "dcnpiu_id", true);
      if (any(c, "per barang", "total")) return salesPerBarang(c, "gf.s_dcnpiu", "gf.s_dcnpex", "dcnpiu_id", false);
      return {
        base: `FROM gf.s_dcnpiu h ${DIV}`,
        cols: salesHdr(NAC, false),
        where: `${jenis} AND ${whereBatal(c)}`,
        orderBy: "h.id DESC",
        catatan: `Sumber: gf.s_dcnpiu (${credit ? "Credit Note" : "Debit Note"} penjualan via flag credit)`,
      };
    },
  },
  {
    id: "penjualan-261-statement",
    test: (c) => c.file.startsWith("261 "),
    build: (c) => ({
      base: `FROM gf.s_penjua h ${DIV}`,
      cols: [
        { sql: PEL, label: "Pelanggan" },
        { sql: "count(*)::text", label: "Jml Nota", align: "r" },
        { sql: "round(COALESCE(SUM(h.tot_harga - h.tot_disc + COALESCE(h.ppn_nilai,0)),0),2)::text", label: "Total", align: "r" },
      ],
      where: whereBatal(c),
      groupBy: `GROUP BY ${PEL}`,
      orderBy: "1",
      catatan: "Rekapitulasi invoice statement per pelanggan (s_penjua)",
    }),
  },
  {
    id: "penjualan-271-deposit",
    test: (c) => c.file.startsWith("271 "),
    build: (c) => ({
      base: `FROM gf.s_deppen h ${DIV}`,
      cols: [
        { sql: NAC, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
        { sql: "COALESCE(dv.divisi,'')", label: "Divisi" },
        { sql: num("h.deposit"), label: "Deposit", align: "r" },
        { sql: "COALESCE(h.catatan,'')", label: "Catatan" }, { sql: alasan, label: "Alasan Batal" },
      ],
      where: whereBatal(c), orderBy: "h.id DESC", catatan: "Sumber: gf.s_deppen (Deposit Penjualan)",
    }),
  },
  {
    id: "penjualan-281-bayar-piutang",
    test: (c) => c.file.startsWith("281 "),
    build: (c) => ({
      base: `FROM gf.s_lpenma h ${DIV} LEFT JOIN gf.s_pelang p ON p.id=h.pelang LEFT JOIN LATERAL (
          SELECT COALESCE(SUM(l.lunas - COALESCE(l.discount,0) + COALESCE(l.denda,0)),0) n FROM gf.s_lunpen l WHERE l.lpenma_id=h.id) t ON true`,
      cols: [
        { sql: NAC, label: "No" }, { sql: tgl(), label: "Tanggal Bayar" }, { sql: "COALESCE(p.nama, '')", label: "Pelanggan" },
        { sql: "COALESCE(dv.divisi,'')", label: "Divisi" }, { sql: "round(t.n,2)::text", label: "Nilai Bayar", align: "r" },
        { sql: "COALESCE(h.catatan,'')", label: "Catatan" }, { sql: alasan, label: "Alasan Batal" },
      ],
      where: whereBatal(c), orderBy: "h.id DESC",
      catatan: `Penerimaan Piutang${pick(c, "nota") ? " (based tgl nota)" : " (based tgl bayar)"} — bayar = lunas − disc + denda (s_lpenma + s_lunpen)`,
    }),
  },
  {
    id: "penjualan-282-piutang",
    test: (c) => c.file.startsWith("282 "),
    build: (c) => {
      const aging = pick(c, "aging");
      const cols: LapCol[] = [
        { sql: "COALESCE(p2.pel_nama,'')", label: "Pelanggan" },
        { sql: "COALESCE(p2.no_c, p2.no::text)", label: "Nota" }, { sql: tgl("p2.tanggal"), label: "Tanggal" },
        { sql: "round(COALESCE(p2.tot_harga,0) - COALESCE(p2.tot_disc,0) + COALESCE(p2.ppn_nilai,0),2)::text", label: "Total", align: "r" },
        { sql: "round(COALESCE(b.bayar,0),2)::text", label: "Telah Lunas", align: "r" },
        { sql: "round(COALESCE(r.retur,0),2)::text", label: "Retur", align: "r" },
        { sql: "round(COALESCE(p2.tot_harga,0) - COALESCE(p2.tot_disc,0) + COALESCE(p2.ppn_nilai,0) - COALESCE(b.bayar,0) - COALESCE(r.retur,0),2)::text", label: "Sisa", align: "r" },
        { sql: "(CURRENT_DATE - p2.tanggal)::text", label: "Umur (hari)", align: "r" },
        { sql: "CASE WHEN (CURRENT_DATE - p2.tanggal) <= 30 THEN '0-30' WHEN (CURRENT_DATE - p2.tanggal) <= 60 THEN '31-60' WHEN (CURRENT_DATE - p2.tanggal) <= 90 THEN '61-90' ELSE '>90' END", label: "Aging" },
      ];
      const sisa = "round(COALESCE(p2.tot_harga,0) - COALESCE(p2.tot_disc,0) + COALESCE(p2.ppn_nilai,0) - COALESCE(b.bayar,0) - COALESCE(r.retur,0),2)";
      let where = "COALESCE(p2.als_batal,'')=''";
      if (pick(c, "lunas")) where += ` AND ${sisa} <= 0`;
      else if (pick(c, "sisa")) where += ` AND ${sisa} > 0`;
      if (pick(c, "statement")) where += ` AND ${sisa} <> 0`;
      return {
        base: `FROM gf.s_penjua p2
          LEFT JOIN (SELECT l.penjua_id pid, SUM(l.lunas - COALESCE(l.discount,0) + COALESCE(l.denda,0)) bayar FROM gf.s_lunpen l JOIN gf.s_lpenma m ON m.id=l.lpenma_id AND COALESCE(m.hapus_oleh,0)=0 GROUP BY l.penjua_id) b ON b.pid=p2.id
          LEFT JOIN (SELECT rp.penjua_id pid, SUM(rp.tot_harga) retur FROM gf.s_retpen rp WHERE COALESCE(rp.hapus_oleh,0)=0 GROUP BY rp.penjua_id) r ON r.pid=p2.id`,
        cols: aging ? cols : cols.slice(0, 7),
        where,
        orderBy: "1, 3",
        catatan: `Sisa Piutang = (Harga−Disc+PPN) − Bayar − Retur${aging ? " + umur & bucket aging" : ""} — s_penjua/s_lunpen/s_retpen`,
      };
    },
  },
  {
    id: "penjualan-291-eceran",
    test: (c) => c.file.startsWith("291 "),
    build: (c) => {
      if (pick(c, "laba")) return {
        base: "FROM gf.s_ecrlst h JOIN gf.s_penecr d ON d.ecrlst_id=h.id",
        cols: [
          { sql: tgl("h.tanggal"), label: "Tanggal" },
          { sql: "round(COALESCE(SUM(d.jumlah*d.harga*(1-COALESCE(d.disc_pers,0)/100)),0),2)::text", label: "Nilai Jual", align: "r" },
          { sql: "COALESCE(SUM(d.jumlah),0)::text", label: "Jumlah", align: "r" },
        ],
        where: "h.sts_ecr IS NOT NULL AND d.tgl_hapus IS NULL",
        groupBy: `GROUP BY ${tgl("h.tanggal")}`, orderBy: "1",
        catatan: "Estimasi laba rugi eceran v1: rekap nilai jual per tanggal (HPP dihitung dari kartu stock GF)",
      };
      if (pick(c, "total")) return {
        base: "FROM gf.s_ecrlst h JOIN gf.s_penecr d ON d.ecrlst_id=h.id",
        cols: [
          { sql: tgl("h.tanggal"), label: "Tanggal" },
          { sql: "count(DISTINCT h.id)::text", label: "Jml Nota", align: "r" },
          { sql: "round(COALESCE(SUM(d.jumlah*d.harga*(1-COALESCE(d.disc_pers,0)/100)),0),2)::text", label: "Nilai", align: "r" },
        ],
        where: "h.sts_ecr IS NOT NULL AND d.tgl_hapus IS NULL",
        groupBy: `GROUP BY ${tgl("h.tanggal")}`, orderBy: "1",
        catatan: "Total penjualan eceran per tanggal",
      };
      return {
        base: "FROM gf.s_ecrlst h JOIN gf.s_penecr d ON d.ecrlst_id=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: "h.id::text", label: "Nota" }, { sql: tgl("h.tanggal"), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
          { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(d.jumlah,0)::text", label: "Jumlah", align: "r" },
          { sql: "COALESCE(d.harga,0)::text", label: "Harga", align: "r" },
          { sql: "round(COALESCE(d.jumlah*d.harga*(1-COALESCE(d.disc_pers,0)/100),0),2)::text", label: "Nilai", align: "r" },
        ],
        where: "h.sts_ecr IS NOT NULL AND d.tgl_hapus IS NULL",
        orderBy: "h.tanggal DESC, h.id DESC",
        catatan: "Penjualan eceran (nota s_ecrlst + baris s_penecr)",
      };
    },
  },
  // ===== ITEM & STOCK (013) =====
  {
    id: "itemstock-013",
    test: (c) => c.file.startsWith("013 "),
    build: (c): LapSpec | null => {
      if (pick(c, "terbanyak")) return {
        base: "FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id AND COALESCE(h.als_batal,'')='' LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: KODE, label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(SUM(d.jumlah),0)::text", label: "Jumlah", align: "r" },
        ],
        where: "d.tgl_hapus IS NULL", groupBy: `GROUP BY ${KODE}, COALESCE(s.nama,'')`, orderBy: "3 DESC",
        catatan: "Barang jual terbanyak (agregasi s_penjud)",
      };
      if (pick(c, "tidak terjual")) return {
        base: `FROM gf.s_stock s LEFT JOIN (SELECT d.stock_id sid, COALESCE(SUM(d.jumlah),0) j FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id AND COALESCE(h.als_batal,'')='' WHERE d.tgl_hapus IS NULL GROUP BY d.stock_id) j ON j.sid=s.id`,
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, s.id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(j.j,0)::text", label: "Jumlah Jual", align: "r" },
        ],
        where: "COALESCE(j.j,0)=0", orderBy: "1",
        catatan: "Barang tidak terjual (stock tanpa penjualan aktif)",
      };
      const nilai = pick(c, "nilai");
      const mut = pick(c, "mutasi");
      return {
        base: `FROM gf.s_stock s
          LEFT JOIN (SELECT stock_id sid, SUM(jumlah) j, SUM(jumlah*COALESCE(hpp,0)) n FROM gf.s_stkmex WHERE tgl_hapus IS NULL GROUP BY stock_id) m ON m.sid=s.id
          LEFT JOIN (SELECT stock_id sid, SUM(jumlah) j, SUM(jumlah*COALESCE(hpp,0)) n FROM gf.s_stkkex WHERE tgl_hapus IS NULL GROUP BY stock_id) k ON k.sid=s.id`,
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, s.id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(m.j,0)::text", label: "Masuk", align: "r" },
          { sql: "COALESCE(k.j,0)::text", label: "Keluar", align: "r" },
          { sql: "(COALESCE(m.j,0)-COALESCE(k.j,0))::text", label: "Saldo", align: "r" },
          ...(nilai
            ? ([
                { sql: "round(COALESCE(m.n,0)-COALESCE(k.n,0),2)::text", label: "Nilai Beli", align: "r" },
                { sql: "COALESCE(s.harga_j_01,0)::text", label: "Harga Jual", align: "r" },
              ] as LapCol[])
            : []),
        ],
        where: "(COALESCE(m.j,0)+COALESCE(k.j,0))<>0",
        orderBy: "1",
        catatan: mut
          ? "Mutasi stock dari s_stkmex/s_stkkex (masuk/keluar/saldo) — rekap total"
          : "Nilai/sisa stock dari s_stkmex/s_stkkex (saldo qty & nilai beli) — rekap total",
      };
    },
  },
  // ===== KEUANGAN / GL =====
  {
    id: "gl-001-kurs",
    test: (c) => c.file.startsWith("001 "),
    build: (c) => ({
      base: "FROM gf.s_kursma h LEFT JOIN gf.s_mauang m ON m.id=h.mauang_id",
      cols: pick(c, "chart")
        ? [
            { sql: tgl(), label: "Tanggal" },
            { sql: "round(COALESCE(AVG(h.kurs_beli),0),4)::text", label: "Kurs Beli (rata)", align: "r" },
          ]
        : [
            { sql: tgl(), label: "Tanggal" },
            { sql: "COALESCE(m.mata_uang, m.kode, '')", label: "Mata Uang" },
            { sql: "COALESCE(h.kurs_beli,0)::text", label: "Kurs Beli", align: "r" },
            { sql: "COALESCE(h.kurs_jual,0)::text", label: "Kurs Jual", align: "r" },
            { sql: "COALESCE(h.kurs_pajak,0)::text", label: "Kurs Pajak", align: "r" },
            { sql: "COALESCE(h.kurs_buku,0)::text", label: "Kurs Buku", align: "r" },
          ],
      where: "COALESCE(h.hapus_oleh,0)=0",
      groupBy: pick(c, "chart") ? `GROUP BY ${tgl()}` : undefined,
      orderBy: pick(c, "chart") ? "1" : "h.tanggal DESC",
      catatan: pick(c, "chart") ? "Perubahan kurs (chart disajikan tabel rata-rata per tanggal)" : "Riwayat kurs (s_kursma)",
    }),
  },
  {
    id: "gl-802-aktiva",
    test: (c) => c.file.startsWith("802 "),
    build: () => ({
      base: "FROM gf.s_aktttp h LEFT JOIN (SELECT aktttp_id aid, SUM(biaya) b FROM gf.s_akttex WHERE tgl_hapus IS NULL GROUP BY aktttp_id) t ON t.aid=h.id",
      cols: [
        { sql: "COALESCE(h.kode,'')", label: "Kode" }, { sql: "COALESCE(h.nama,'')", label: "Nama" },
        { sql: tgl("h.tgl_beli"), label: "Tgl Beli" },
        { sql: num("h.harga_beli"), label: "Harga Beli", align: "r" },
        { sql: "round(COALESCE(t.b,0),2)::text", label: "Total Biaya", align: "r" },
        { sql: "round(COALESCE(h.harga_beli,0)-COALESCE(t.b,0),2)::text", label: "Nilai Buku", align: "r" },
      ],
      where: "COALESCE(h.hapus_oleh,0)=0",
      orderBy: "1",
      catatan: "Aktiva tetap + akumulasi biaya (s_aktttp/s_akttex)",
    }),
  },
  {
    id: "gl-861-pendapatan-biaya",
    test: (c) => c.file.startsWith("861 "),
    build: () => ({
      base: "FROM gf.s_jurnex x JOIN gf.s_jurnal j ON j.id=x.jurnal_id LEFT JOIN gf.s_perkir p ON p.id=x.perkir_id",
      cols: [
        { sql: "COALESCE(p.nama,'(tanpa perkiraan)')", label: "Perkiraan" },
        { sql: "round(COALESCE(SUM(CASE WHEN COALESCE(x.debet,false) THEN x.nilai ELSE 0 END),0),2)::text", label: "Debet", align: "r" },
        { sql: "round(COALESCE(SUM(CASE WHEN NOT COALESCE(x.debet,false) THEN x.nilai ELSE 0 END),0),2)::text", label: "Kredit", align: "r" },
      ],
      where: "COALESCE(j.hapus_oleh,0)=0 AND x.tgl_hapus IS NULL",
      groupBy: "GROUP BY COALESCE(p.nama,'(tanpa perkiraan)')",
      orderBy: "1",
      catatan: "Pendapatan & Biaya per perkiraan (s_jurnex; debet=kredit balance)",
    }),
  },
  {
    id: "gl-881-hpp",
    test: (c) => c.file.startsWith("881 "),
    build: (c) => {
      const aktif = "COALESCE(h.als_batal,'')=''";
      const agg = (doc: string, lineJoin: string, fk: string, hppExpr: string, label: string): LapSpec => ({
        base: `FROM ${doc} h JOIN ${lineJoin} d ON d.${fk}=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id`,
        cols: [
          { sql: KODE, label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(SUM(d.jumlah),0)::text", label: "Jumlah", align: "r" },
          { sql: `round(COALESCE(SUM(${hppExpr}),0),2)::text`, label: "Nilai HPP", align: "r" },
        ],
        where: `${aktif} AND d.tgl_hapus IS NULL`,
        groupBy: `GROUP BY ${KODE}, COALESCE(s.nama,'')`,
        orderBy: "1",
        catatan: `HP ${label} per barang (${lineJoin})`,
      });
      if (pick(c, "masuk lainnya")) return agg("gf.s_stkmas", "gf.s_stkmex", "stkmas_id", "d.jumlah*COALESCE(d.hpp,0)", "Barang Masuk Lainnya");
      if (pick(c, "keluar lainnya")) return agg("gf.s_stkklr", "gf.s_stkkex", "stkklr_id", "d.jumlah*COALESCE(d.hpp,0)", "Barang Keluar Lainnya");
      if (pick(c, "pindah gudang")) return agg("gf.s_stkpin", "gf.s_stkpex", "stkpin_id", "d.jumlah*COALESCE(d.hpp,0)", "Barang Pindah Gudang");
      if (pick(c, "rusak")) return agg("gf.s_retpen", "gf.s_retpjd", "retpen_id", "COALESCE(d.jml_rusak,0)*COALESCE(d.hpp_rusak,0)", "Barang Rusak Retur Penjualan");
      if (pick(c, "untransfer")) return agg("gf.s_stktra", "gf.s_stktex", "stktra_id", "d.jumlah*COALESCE(d.hpp,0)", "Barang UnTransfer");
      if (pick(c, "transfer")) return agg("gf.s_stktra", "gf.s_stktex", "stktra_id", "d.jumlah*COALESCE(d.hpp,0)", "Barang Transfer");
      if (pick(c, "produksi")) return {
        base: "FROM gf.s_prodsi h LEFT JOIN gf.s_prditm p ON p.id=h.prditm_id LEFT JOIN gf.s_stock s ON s.id=p.stock_id",
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, p.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(SUM(h.jumlah),0)::text", label: "Jumlah", align: "r" },
          { sql: "round(COALESCE(SUM(COALESCE(h.per1_nil,0)+COALESCE(h.per2_nil,0)+COALESCE(h.per3_nil,0)),0),2)::text", label: "Nilai HPP", align: "r" },
        ],
        where: aktif,
        groupBy: "GROUP BY COALESCE(s.kode_c, s.kode_c_2, p.stock_id::text), COALESCE(s.nama,'')",
        orderBy: "1",
        catatan: "HP Barang Produksi (s_prodsi; nilai = per1+per2+per3)",
      };
      if (pick(c, "transaksi")) {
        const net = "round(COALESCE(SUM(h.tot_harga - COALESCE(h.tot_disc,0)),0),2)::text";
        if (pick(c, "divisi")) return {
          base: `FROM gf.s_penjua h ${DIV}`,
          cols: [
            { sql: "COALESCE(dv.divisi,'(tanpa divisi)')", label: "Divisi" },
            { sql: "count(*)::text", label: "Jml Nota", align: "r" }, { sql: net, label: "Nilai", align: "r" },
          ],
          where: aktif, groupBy: "GROUP BY COALESCE(dv.divisi,'(tanpa divisi)')", orderBy: "1",
          catatan: "Total transaksi per divisi (s_penjua)",
        };
        if (pick(c, "gudang")) return {
          base: "FROM gf.s_penjua h",
          cols: [
            { sql: "COALESCE(h.gudang::text,'')", label: "Gudang" },
            { sql: "count(*)::text", label: "Jml Nota", align: "r" }, { sql: net, label: "Nilai", align: "r" },
          ],
          where: aktif, groupBy: "GROUP BY COALESCE(h.gudang::text,'')", orderBy: "1",
          catatan: "Total transaksi per gudang (s_penjua.gudang)",
        };
        if (pick(c, "kelompok")) return {
          base: "FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id LEFT JOIN gf.s_stock s ON s.id=d.stock_id LEFT JOIN gf.s_grpstk gs ON gs.id=s.group_stk",
          cols: [
            { sql: "COALESCE(gs.nama,'(tanpa kelompok)')", label: "Kelompok Barang" },
            { sql: "count(DISTINCT h.id)::text", label: "Jml Nota", align: "r" },
            { sql: "round(COALESCE(SUM(d.jumlah*d.harga*(1-COALESCE(d.disc_pers,0)/100)),0),2)::text", label: "Nilai", align: "r" },
          ],
          where: `d.tgl_hapus IS NULL AND ${aktif}`, groupBy: "GROUP BY COALESCE(gs.nama,'(tanpa kelompok)')", orderBy: "1",
          catatan: "Total transaksi per kelompok barang (s_penjud)",
        };
        if (pick(c, "tunai")) return {
          base: "FROM gf.s_penjua h",
          cols: [
            { sql: tgl(), label: "Tanggal" }, { sql: "count(*)::text", label: "Jml Nota", align: "r" }, { sql: net, label: "Nilai", align: "r" },
          ],
          where: `${aktif} AND COALESCE(h.lun_tipe_1,0)=1`, groupBy: `GROUP BY ${tgl()}`, orderBy: "1",
          catatan: "Total transaksi tunai (lun_tipe_1=1) per tanggal",
        };
        return {
          base: "FROM gf.s_penjua h",
          cols: [
            { sql: tgl(), label: "Tanggal" }, { sql: "count(*)::text", label: "Jml Nota", align: "r" }, { sql: net, label: "Nilai", align: "r" },
          ],
          where: aktif, groupBy: `GROUP BY ${tgl()}`, orderBy: "1",
          catatan: "Total transaksi per tanggal (s_penjua)",
        };
      }
      const lunas = pick(c, "lunas");
      return {
        base: "FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: KODE, label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(SUM(d.jumlah),0)::text", label: "Jumlah", align: "r" },
          { sql: "round(COALESCE(SUM(d.jumlah*COALESCE(d.hpp,0)),0),2)::text", label: "Nilai HPP", align: "r" },
        ],
        where: `d.tgl_hapus IS NULL AND ${aktif}${lunas ? " AND h.clear_ar IS NOT NULL" : ""}`,
        groupBy: `GROUP BY ${KODE}, COALESCE(s.nama,'')`,
        orderBy: "1",
        catatan: `HPP penjualan per barang (s_penjud.hpp)${lunas ? " — hanya nota LUNAS (clear_ar)" : ""}`,
      };
    },
  },
  {
    id: "gl-882-penjualan-piutang",
    test: (c) => c.file.startsWith("882 "),
    build: () => ({
      base: `FROM gf.s_pelang p
        LEFT JOIN (SELECT j.pelang pid, SUM(j.tot_harga - COALESCE(j.tot_disc,0) + COALESCE(j.ppn_nilai,0)) jual FROM gf.s_penjua j WHERE COALESCE(j.als_batal,'')='' GROUP BY j.pelang) jj ON jj.pid=p.id
        LEFT JOIN (SELECT p2.pelang pid, SUM(COALESCE(p2.tot_harga,0)-COALESCE(p2.tot_disc,0)+COALESCE(p2.ppn_nilai,0)-COALESCE(b.bayar,0)-COALESCE(r.retur,0)) sisa
          FROM gf.s_penjua p2
          LEFT JOIN (SELECT l.penjua_id pid, SUM(l.lunas - COALESCE(l.discount,0) + COALESCE(l.denda,0)) bayar FROM gf.s_lunpen l JOIN gf.s_lpenma m ON m.id=l.lpenma_id AND COALESCE(m.hapus_oleh,0)=0 GROUP BY l.penjua_id) b ON b.pid=p2.id
          LEFT JOIN (SELECT rp.penjua_id pid, SUM(rp.tot_harga) retur FROM gf.s_retpen rp WHERE COALESCE(rp.hapus_oleh,0)=0 GROUP BY rp.penjua_id) r ON r.pid=p2.id
          WHERE COALESCE(p2.als_batal,'')='' GROUP BY p2.pelang) rr ON rr.pid=p.id`,
      cols: [
        { sql: "COALESCE(p.nama,'')", label: "Pelanggan" },
        { sql: "round(COALESCE(jj.jual,0),2)::text", label: "Penjualan", align: "r" },
        { sql: "round(GREATEST(COALESCE(rr.sisa,0),0),2)::text", label: "Sisa Piutang", align: "r" },
      ],
      where: "COALESCE(p.hapus_oleh,0)=0 AND (COALESCE(jj.jual,0)<>0 OR COALESCE(rr.sisa,0)<>0)",
      orderBy: "1",
      catatan: "Rekap Penjualan & Sisa Piutang per pelanggan (s_penjua/s_lunpen/s_retpen)",
    }),
  },
  {
    id: "gl-883-pembelian-hutang",
    test: (c) => c.file.startsWith("883 "),
    build: () => ({
      base: `FROM gf.s_vendor v
        LEFT JOIN (SELECT p.vendor vid, SUM(p.tot_harga - COALESCE(p.tot_disc,0) + COALESCE(p.ppn_nilai,0)) beli FROM gf.s_pembel p WHERE COALESCE(p.als_batal,'')='' GROUP BY p.vendor) bb ON bb.vid=v.id
        LEFT JOIN (SELECT p2.vendor vid, SUM(COALESCE(p2.tot_harga,0)-COALESCE(p2.tot_disc,0)+COALESCE(p2.ppn_nilai,0)-COALESCE(b.bayar,0)-COALESCE(r.retur,0)) sisa
          FROM gf.s_pembel p2
          LEFT JOIN (SELECT l.pembel_id pid, SUM(l.lunas - COALESCE(l.discount,0) + COALESCE(l.denda,0)) bayar FROM gf.s_lunpem l JOIN gf.s_lpemma m ON m.id=l.lpemma_id AND COALESCE(m.hapus_oleh,0)=0 GROUP BY l.pembel_id) b ON b.pid=p2.id
          LEFT JOIN (SELECT rp.pembel_id pid, SUM(rp.tot_harga) retur FROM gf.s_retpem rp WHERE COALESCE(rp.hapus_oleh,0)=0 GROUP BY rp.pembel_id) r ON r.pid=p2.id
          WHERE COALESCE(p2.als_batal,'')='' GROUP BY p2.vendor) rr ON rr.vid=v.id`,
      cols: [
        { sql: "COALESCE(v.nama,'')", label: "Vendor" },
        { sql: "round(COALESCE(bb.beli,0),2)::text", label: "Pembelian", align: "r" },
        { sql: "round(GREATEST(COALESCE(rr.sisa,0),0),2)::text", label: "Sisa Hutang", align: "r" },
      ],
      where: "COALESCE(v.hapus_oleh,0)=0 AND (COALESCE(bb.beli,0)<>0 OR COALESCE(rr.sisa,0)<>0)",
      orderBy: "1",
      catatan: "Rekap Pembelian & Sisa Hutang per vendor (s_pembel/s_lunpem/s_retpem)",
    }),
  },
  // ===== LAINNYA (701/711/721/731/741/751/761/781) =====
  {
    id: "lain-701-promosi",
    test: (c) => c.file.startsWith("701 "),
    build: () => ({
      base: "FROM gf.s_promos h",
      cols: [
        { sql: "h.id::text", label: "ID" },
        { sql: tgl("h.tanggal_1"), label: "Tgl Awal" }, { sql: tgl("h.tanggal_2"), label: "Tgl Akhir" },
        { sql: "COALESCE(h.hari,'')", label: "Hari" }, { sql: "COALESCE(h.catatan,'')", label: "Catatan" },
      ],
      where: "COALESCE(h.hapus_oleh,0)=0",
      orderBy: "h.id DESC",
      catatan: "Promosi (s_promos)",
    }),
  },
  {
    id: "lain-711-promo-detail",
    test: (c) => c.file.startsWith("711 "),
    build: () => ({
      base: "FROM gf.s_prome1 x JOIN gf.s_promos h ON h.id=x.promos_id",
      cols: [
        { sql: "h.id::text", label: "Promo" },
        { sql: tgl("h.tanggal_1"), label: "Tgl Awal" }, { sql: tgl("h.tanggal_2"), label: "Tgl Akhir" },
        { sql: num("x.harga_dari"), label: "Harga Dari", align: "r" }, { sql: num("x.harga_sd"), label: "Harga Sd", align: "r" },
        { sql: "COALESCE(x.disc_pers,0)::text", label: "Disc%", align: "r" }, { sql: num("x.disc_nilai"), label: "Disc Nilai", align: "r" },
      ],
      where: "x.tgl_hapus IS NULL",
      orderBy: "h.id DESC",
      catatan: "Barang promosi detail (s_prome1: rentang harga + disc)",
    }),
  },
  {
    id: "lain-721-transfer",
    test: (c) => c.file.startsWith("721 ") || c.file.startsWith("731 "),
    build: (c) => {
      const un = c.file.startsWith("731 ");
      if (pick(c, "detail")) return modWithLines("gf.s_stktra", "gf.s_stktex", "stktra_id", "h.id::text");
      if (pick(c, "kelompok")) return modPerBarang(c, "gf.s_stktra", "gf.s_stktex", "stktra_id", true);
      if (any(c, "per barang", "total")) return modPerBarang(c, "gf.s_stktra", "gf.s_stktex", "stktra_id", false);
      return modList("gf.s_stktra", "h.id::text", whereBatal(c));
    },
  },
  {
    id: "lain-741-pindah",
    test: (c) => c.file.startsWith("741 "),
    build: (c) => {
      if (pick(c, "detail")) return modWithLines("gf.s_stkpin", "gf.s_stkpex", "stkpin_id", "h.no::text");
      if (any(c, "per barang", "total")) return modPerBarang(c, "gf.s_stkpin", "gf.s_stkpex", "stkpin_id", false);
      return modList("gf.s_stkpin", "h.no::text", whereBatal(c));
    },
  },
  {
    id: "lain-751-masuk",
    test: (c) => c.file.startsWith("751 "),
    build: (c) => {
      if (pick(c, "detail")) return modWithLines("gf.s_stkmas", "gf.s_stkmex", "stkmas_id", "h.no::text");
      if (pick(c, "kelompok")) return modPerBarang(c, "gf.s_stkmas", "gf.s_stkmex", "stkmas_id", true);
      if (any(c, "per barang", "total")) return modPerBarang(c, "gf.s_stkmas", "gf.s_stkmex", "stkmas_id", false);
      return modList("gf.s_stkmas", "h.no::text", whereBatal(c));
    },
  },
  {
    id: "lain-761-keluar",
    test: (c) => c.file.startsWith("761 "),
    build: (c) => {
      if (pick(c, "detail")) return modWithLines("gf.s_stkklr", "gf.s_stkkex", "stkklr_id", "h.no::text");
      if (pick(c, "kelompok")) return modPerBarang(c, "gf.s_stkklr", "gf.s_stkkex", "stkklr_id", true);
      if (any(c, "per barang", "total")) return modPerBarang(c, "gf.s_stkklr", "gf.s_stkkex", "stkklr_id", false);
      return modList("gf.s_stkklr", "h.no::text", whereBatal(c));
    },
  },
  {
    id: "lain-781-repair",
    test: (c) => c.file.startsWith("781 "),
    build: (c) => {
      if (pick(c, "detail")) return {
        base: "FROM gf.s_stkrep h LEFT JOIN gf.s_stock s ON s.id=h.stock_id",
        cols: [
          { sql: "h.no::text", label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(h.pel_nama,'')", label: "Pelanggan" },
          { sql: "COALESCE(s.kode_c, s.kode_c_2, h.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: tgl("h.tgl_sls"), label: "Tgl SLS" }, { sql: tgl("h.tgl_kemb"), label: "Tgl Kembali" },
          { sql: "COALESCE(h.catatan,'')", label: "Catatan" }, { sql: alasan, label: "Alasan Batal" },
        ],
        where: whereBatal(c),
        orderBy: "h.id DESC",
        catatan: "Barang repair detail (s_stkrep)",
      };
      if (any(c, "per barang", "total", "kelompok")) return {
        base: "FROM gf.s_stkrep h LEFT JOIN gf.s_stock s ON s.id=h.stock_id",
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, h.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "count(*)::text", label: "Jml Repair", align: "r" },
        ],
        where: whereBatal(c),
        groupBy: "GROUP BY COALESCE(s.kode_c, s.kode_c_2, h.stock_id::text), COALESCE(s.nama,'')",
        orderBy: "3 DESC",
        catatan: "Barang repair per barang (count dari s_stkrep)",
      };
      return modList("gf.s_stkrep", "h.no::text", whereBatal(c));
    },
  },
  // ===== PELANGGAN (032) =====
  {
    id: "pelanggan-032-point",
    test: (c) => c.file.startsWith("032 "),
    build: () => ({
      base: `FROM gf.s_pelang p
        LEFT JOIN (SELECT j.pelang pid, SUM(j.tot_harga - COALESCE(j.tot_disc,0)) belanja FROM gf.s_penjua j WHERE COALESCE(j.als_batal,'')='' GROUP BY j.pelang) jj ON jj.pid=p.id`,
      cols: [
        { sql: "COALESCE(p.nama,'')", label: "Pelanggan" },
        { sql: "round(COALESCE(jj.belanja,0),2)::text", label: "Nilai Belanja", align: "r" },
      ],
      where: "COALESCE(p.hapus_oleh,0)=0 AND COALESCE(jj.belanja,0)<>0",
      orderBy: "2 DESC",
      catatan: "Point pelanggan: tabel poin tidak ada di subset DB minimarket — ditampilkan nilai belanja sebagai referensi",
    }),
  },
  // ===== FORM / TEMPLATE CETAK (77) — print preview minimal =====
  {
    id: "form-template",
    test: (c) => c.file.startsWith("Form "),
    build: (c): LapSpec | null => {
      const nota = (tbl: string, extra: LapCol[] = []): LapSpec => ({
        base: `FROM gf.${tbl} h ${DIV}`,
        cols: [
          { sql: "COALESCE(h.no_c, h.no::text)", label: "No" }, { sql: tgl(), label: "Tanggal" },
          ...extra,
          { sql: "COALESCE(h.catatan,'')", label: "Catatan" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0",
        orderBy: "h.id DESC",
        catatan: `Template cetak — preview data ${tbl} (print preview minimal)`,
      });
      const stockList = (doc: string, lineJoin: string, fk: string, noExpr: string, label: string): LapSpec => ({
        base: `FROM ${doc} h JOIN ${lineJoin} d ON d.${fk}=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id`,
        cols: [
          { sql: noExpr, label: "No" }, { sql: tgl(), label: "Tanggal" },
          { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(d.jumlah,0)::text", label: "Jumlah", align: "r" },
        ],
        where: `COALESCE(h.als_batal,'')='' AND d.tgl_hapus IS NULL`,
        orderBy: "h.id DESC, d.sys_id",
        catatan: `Template cetak — preview ${label} (print preview minimal)`,
      });
      if (pick(c, "barcode") || (pick(c, "label") && !pick(c, "harga") && !pick(c, "pembelian"))) return {
        base: "FROM gf.s_stock s",
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, s.id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(s.harga_j_01,0)::text", label: "Harga Jual", align: "r" },
        ],
        where: "COALESCE(s.hapus_oleh,0)=0", orderBy: "1",
        catatan: "Template cetak Barcode/Label — preview item (print preview minimal)",
      };
      if (pick(c, "amplop pelanggan")) return {
        base: "FROM gf.s_pelang h",
        cols: [{ sql: "COALESCE(h.nama,'')", label: "Pelanggan" }, { sql: "COALESCE(h.alamat,'')", label: "Alamat" }],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "1", catatan: "Template amplop pelanggan (print preview minimal)",
      };
      if (pick(c, "amplop vendor")) return {
        base: "FROM gf.s_vendor h",
        cols: [{ sql: "COALESCE(h.nama,'')", label: "Vendor" }, { sql: "COALESCE(h.alamat,'')", label: "Alamat" }],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "1", catatan: "Template amplop vendor (print preview minimal)",
      };
      if (pick(c, "user code")) return {
        base: 'FROM gf.s_secusr h',
        cols: [{ sql: 'COALESCE(h."user",\'\')', label: "User" }, { sql: "h.id::text", label: "ID" }],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "1", catatan: "Template user code (print preview minimal)",
      };
      if (pick(c, "bayar hutang")) return {
        base: "FROM gf.s_lpemma h",
        cols: [
          { sql: "h.no::text", label: "No" }, { sql: tgl(), label: "Tanggal" },
          { sql: "round(COALESCE((SELECT SUM(l.lunas - COALESCE(l.discount,0) + COALESCE(l.denda,0)) FROM gf.s_lunpem l WHERE l.lpemma_id=h.id),0),2)::text", label: "Nilai Bayar", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "h.id DESC", catatan: "Template Bayar Hutang (print preview minimal)",
      };
      if (pick(c, "bayar piutang") || pick(c, "daftar penerimaan piutang")) return {
        base: "FROM gf.s_lpenma h",
        cols: [
          { sql: "COALESCE(h.no_c, h.no::text)", label: "No" }, { sql: tgl(), label: "Tanggal" },
          { sql: "round(COALESCE((SELECT SUM(l.lunas - COALESCE(l.discount,0) + COALESCE(l.denda,0)) FROM gf.s_lunpen l WHERE l.lpenma_id=h.id),0),2)::text", label: "Nilai Terima", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "h.id DESC", catatan: "Template Bayar/Penerimaan Piutang (print preview minimal)",
      };
      if (pick(c, "tagihan hutang") || pick(c, "sisa hutang") || pick(c, "kartu hutang")) return {
        base: "FROM gf.s_pembel h LEFT JOIN gf.s_vendor v ON v.id=h.vendor",
        cols: [
          { sql: "COALESCE(h.no::text,'')", label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
          { sql: "round(COALESCE(h.tot_harga,0)+COALESCE(h.ppn_nilai,0),2)::text", label: "Total", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "h.id DESC", catatan: "Template Tagihan/Sisa Hutang (print preview minimal)",
      };
      if (pick(c, "tagihan piutang") || pick(c, "sisa piutang") || pick(c, "kartu piutang")) return {
        base: "FROM gf.s_penjua h",
        cols: [
          { sql: "COALESCE(h.no_c, h.no::text)", label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
          { sql: "round(COALESCE(h.tot_harga,0)-COALESCE(h.tot_disc,0)+COALESCE(h.ppn_nilai,0),2)::text", label: "Total", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "h.id DESC", catatan: "Template Tagihan/Sisa Piutang (print preview minimal)",
      };
      if (pick(c, "buku besar") || pick(c, "jurnal")) return {
        base: "FROM gf.s_jurnal h",
        cols: [
          { sql: "COALESCE(h.no::text,'')", label: "No" }, { sql: tgl(), label: "Tanggal" },
          { sql: "CASE h.jenis WHEN 1 THEN 'Umum' WHEN 2 THEN 'Penerimaan' WHEN 3 THEN 'Pengeluaran' WHEN 4 THEN 'Penutup' ELSE h.jenis::text END", label: "Jenis" },
          { sql: "COALESCE(h.catatan,'')", label: "Catatan" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "h.id DESC", catatan: "Template Buku Besar/Jurnal (print preview minimal)",
      };
      if (pick(c, "buku kas") || pick(c, "biaya keluar") || pick(c, "kas keluar")) return nota("s_kasklr");
      if (pick(c, "kas masuk")) return nota("s_kasmsk");
      if (pick(c, "kas transfer")) return nota("s_kasmsk");
      if (pick(c, "ch bg")) return {
        base: "FROM gf.s_kasmex h",
        cols: [
          { sql: "h.no::text", label: "No" }, { sql: tgl(), label: "Tanggal" },
          { sql: num("h.nilai"), label: "Nilai", align: "r" },
        ],
        where: "h.lunas_cair IS NULL", orderBy: "h.sys_id DESC",
        catatan: "Template CH/BG Gantung — CH/BG belum cair (print preview minimal)",
      };
      if (pick(c, "credit note pembelian")) return {
        base: "FROM gf.s_dcnhut h LEFT JOIN gf.s_vendor v ON v.id=h.vendor",
        cols: [
          { sql: "COALESCE(h.no::text,'')", label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
          { sql: num("h.tot_harga"), label: "Nilai", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0 AND COALESCE(h.credit,false)=true", orderBy: "h.id DESC",
        catatan: "Template Credit Note Pembelian (print preview minimal)",
      };
      if (pick(c, "debit note pembelian")) return {
        base: "FROM gf.s_dcnhut h LEFT JOIN gf.s_vendor v ON v.id=h.vendor",
        cols: [
          { sql: "COALESCE(h.no::text,'')", label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
          { sql: num("h.tot_harga"), label: "Nilai", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0 AND COALESCE(h.credit,false)=false", orderBy: "h.id DESC",
        catatan: "Template Debit Note Pembelian (print preview minimal)",
      };
      if (pick(c, "credit note penjualan")) return {
        base: "FROM gf.s_dcnpiu h",
        cols: [
          { sql: NAC, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
          { sql: num("h.tot_harga"), label: "Nilai", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0 AND COALESCE(h.credit,false)=true", orderBy: "h.id DESC",
        catatan: "Template Credit Note Penjualan (print preview minimal)",
      };
      if (pick(c, "debit note penjualan")) return {
        base: "FROM gf.s_dcnpiu h",
        cols: [
          { sql: NAC, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
          { sql: num("h.tot_harga"), label: "Nilai", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0 AND COALESCE(h.credit,false)=false", orderBy: "h.id DESC",
        catatan: "Template Debit Note Penjualan (print preview minimal)",
      };
      if (pick(c, "aktiva")) return {
        base: "FROM gf.s_aktttp h",
        cols: [
          { sql: "COALESCE(h.kode,'')", label: "Kode" }, { sql: "COALESCE(h.nama,'')", label: "Nama" },
          { sql: tgl("h.tgl_beli"), label: "Tgl Beli" }, { sql: num("h.harga_beli"), label: "Harga Beli", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "1", catatan: "Template Daftar Aktiva Tetap (print preview minimal)",
      };
      if (pick(c, "deposit pembelian")) return {
        base: "FROM gf.s_deppem h LEFT JOIN gf.s_vendor v ON v.id=h.vendor",
        cols: [
          { sql: "COALESCE(h.no::text,'')", label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
          { sql: num("h.deposit"), label: "Deposit", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "h.id DESC", catatan: "Template Deposit Pembelian (print preview minimal)",
      };
      if (pick(c, "deposit penjualan")) return {
        base: "FROM gf.s_deppen h",
        cols: [
          { sql: NAC, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
          { sql: num("h.deposit"), label: "Deposit", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "h.id DESC", catatan: "Template Deposit Penjualan (print preview minimal)",
      };
      if (pick(c, "faktur pajak retur pembelian")) return {
        base: "FROM gf.s_retpem h LEFT JOIN gf.s_vendor v ON v.id=h.vendor",
        cols: [
          { sql: "COALESCE(h.no::text,'')", label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
          { sql: num("h.ppn_nilai"), label: "PPN", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "h.id DESC", catatan: "Template Faktur Pajak Retur Pembelian (print preview minimal)",
      };
      if (pick(c, "faktur pajak retur penjualan")) return {
        base: "FROM gf.s_retpen h",
        cols: [
          { sql: NAC, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
          { sql: num("h.ppn_nilai"), label: "PPN", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "h.id DESC", catatan: "Template Faktur Pajak Retur Penjualan (print preview minimal)",
      };
      if (pick(c, "faktur pajak")) return {
        base: `FROM gf.s_pembel h ${V}`,
        cols: [
          { sql: "COALESCE(h.no_fakpjk,'')", label: "No Faktur Pajak" }, { sql: tgl("h.tgl_fakpjk"), label: "Tgl Faktur" },
          { sql: "COALESCE(h.no::text,'')", label: "No Pembelian" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
          { sql: num("h.tot_harga"), label: "DPP", align: "r" }, { sql: num("h.ppn_nilai"), label: "PPN", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0 AND COALESCE(h.no_fakpjk,'')<>''", orderBy: "h.id DESC",
        catatan: "Template Faktur Pajak Standard (print preview minimal)",
      };
      if (pick(c, "graphic show") || pick(c, "terima pesanan")) return {
        base: "FROM gf.s_penjua h",
        cols: [{ sql: "''", label: "Info" }],
        where: "1=0", orderBy: "1",
        catatan: `Template ${pick(c, "graphic show") ? "Graphic Show (modul hotel/KTV/billiard/rental)" : "Terima Pesanan (unbill)"} — modul tidak ada di data minimarket (N/A)`,
      };
      if (pick(c, "hpp error")) return {
        base: "FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: NAC, label: "No" }, { sql: tgl(), label: "Tanggal" },
          { sql: KODE, label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(d.jumlah,0)::text", label: "Jumlah", align: "r" },
        ],
        where: "d.tgl_hapus IS NULL AND COALESCE(h.als_batal,'')='' AND COALESCE(d.jumlah,0)>0 AND COALESCE(d.hpp,0)=0",
        orderBy: "h.id DESC", catatan: "Template HPP Error — baris jual tanpa HPP (print preview minimal)",
      };
      if (pick(c, "penjualan eceran")) return {
        base: "FROM gf.s_ecrlst h JOIN gf.s_penecr d ON d.ecrlst_id=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: "h.id::text", label: "Nota" }, { sql: tgl("h.tanggal"), label: "Tanggal" },
          { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(d.jumlah,0)::text", label: "Jumlah", align: "r" },
        ],
        where: "h.sts_ecr IS NOT NULL AND d.tgl_hapus IS NULL", orderBy: "h.tanggal DESC, h.id DESC",
        catatan: "Template Penjualan Eceran (print preview minimal)",
      };
      if (pick(c, "invoice penjualan") || pick(c, "penjualan")) return {
        base: `FROM gf.s_penjua h ${DIV}`,
        cols: [
          { sql: NAC, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
          { sql: "round(COALESCE(h.tot_harga,0)-COALESCE(h.tot_disc,0)+COALESCE(h.ppn_nilai,0),2)::text", label: "Total", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "h.id DESC", catatan: "Template Invoice/Penjualan (print preview minimal)",
      };
      if (pick(c, "item produksi")) return {
        base: "FROM gf.s_prditm h LEFT JOIN gf.s_stock s ON s.id=h.stock_id",
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, h.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(h.jumlah,0)::text", label: "Jumlah", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "1", catatan: "Template Item Produksi (print preview minimal)",
      };
      if (pick(c, "pembelian")) return {
        base: `FROM gf.s_pembel h ${V}`,
        cols: [
          { sql: "COALESCE(h.no::text,'')", label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
          { sql: "round(COALESCE(h.tot_harga,0)+COALESCE(h.ppn_nilai,0),2)::text", label: "Total", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "h.id DESC", catatan: "Template Pembelian (print preview minimal)",
      };
      if (pick(c, "purchase order")) return {
        base: "FROM gf.s_purcor h LEFT JOIN gf.s_vendor v ON v.id=h.vendor",
        cols: [
          { sql: "COALESCE(h.po::text,'')", label: "PO No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
          { sql: num("h.tot_harga"), label: "Total", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "h.id DESC", catatan: "Template Purchase Order (print preview minimal)",
      };
      if (pick(c, "purchase request")) return {
        base: "FROM gf.s_purreq h",
        cols: [
          { sql: "COALESCE(h.no::text,'')", label: "No" }, { sql: tgl(), label: "Tanggal" },
          { sql: "COALESCE(h.diminta,'')", label: "Diminta" }, { sql: num("h.tot_harga"), label: "Nilai", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "h.id DESC", catatan: "Template Purchase Request (print preview minimal)",
      };
      if (pick(c, "quotation")) return {
        base: "FROM gf.s_quotat h",
        cols: [
          { sql: "COALESCE(h.no::text,'')", label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
          { sql: num("h.tot_harga"), label: "Nilai", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "h.id DESC", catatan: "Template Quotation (print preview minimal)",
      };
      if (pick(c, "sales order")) return {
        base: "FROM gf.s_salord h",
        cols: [
          { sql: NAC, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
          { sql: num("h.tot_harga"), label: "Nilai", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "h.id DESC", catatan: "Template Sales Order (print preview minimal)",
      };
      if (pick(c, "retur pembelian")) return {
        base: "FROM gf.s_retpem h LEFT JOIN gf.s_vendor v ON v.id=h.vendor",
        cols: [
          { sql: "COALESCE(h.no::text,'')", label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: "COALESCE(v.nama,'')", label: "Vendor" },
          { sql: num("h.tot_harga"), label: "Nilai", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "h.id DESC", catatan: "Template Retur Pembelian (print preview minimal)",
      };
      if (pick(c, "retur penjualan")) return {
        base: "FROM gf.s_retpen h",
        cols: [
          { sql: NAC, label: "No" }, { sql: tgl(), label: "Tanggal" }, { sql: PEL, label: "Pelanggan" },
          { sql: num("h.tot_harga"), label: "Nilai", align: "r" },
        ],
        where: "COALESCE(h.hapus_oleh,0)=0", orderBy: "h.id DESC", catatan: "Template Retur Penjualan (print preview minimal)",
      };
            if (pick(c, "stock awal")) return stockList("gf.s_stkmas", "gf.s_stkmex", "stkmas_id", "h.no::text", "Stock Awal (masuk)");
      if (pick(c, "stock masuk")) return stockList("gf.s_stkmas", "gf.s_stkmex", "stkmas_id", "h.no::text", "Stock Masuk");
      if (pick(c, "stock keluar")) return stockList("gf.s_stkklr", "gf.s_stkkex", "stkklr_id", "h.no::text", "Stock Keluar");
      if (pick(c, "stock pindah")) return stockList("gf.s_stkpin", "gf.s_stkpex", "stkpin_id", "h.no::text", "Stock Pindah Gudang");
      if (pick(c, "stock produksi")) return {
        base: "FROM gf.s_prodsi h JOIN gf.s_prditm p ON p.id=h.prditm_id LEFT JOIN gf.s_stock s ON s.id=p.stock_id",
        cols: [
          { sql: "h.id::text", label: "No" }, { sql: tgl(), label: "Tanggal" },
          { sql: "COALESCE(s.kode_c, s.kode_c_2, p.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(h.jumlah,0)::text", label: "Jumlah", align: "r" },
        ],
        where: "COALESCE(h.als_batal,'')=''", orderBy: "h.id DESC",
        catatan: "Template Stock Produksi (print preview minimal)",
      };
      if (pick(c, "stock transfer")) return stockList("gf.s_stktra", "gf.s_stktex", "stktra_id", "h.id::text", "Stock Transfer");
      if (pick(c, "stock untransfer")) return stockList("gf.s_stktra", "gf.s_stktex", "stktra_id", "h.id::text", "Stock UnTransfer");
      if (pick(c, "opname") || pick(c, "expired") || pick(c, "belum opname")) return {
        base: "FROM gf.s_stock s",
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, s.id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "COALESCE(s.harga_j_01,0)::text", label: "Harga Jual", align: "r" },
        ],
        where: "COALESCE(s.hapus_oleh,0)=0", orderBy: "1",
        catatan: "Template Stock Opname/Expired — preview item (print preview minimal)",
      };
      if (pick(c, "kartu stock")) return stockList("gf.s_stkmas", "gf.s_stkmex", "stkmas_id", "h.no::text", "Kartu Stock (mutasi masuk)");
      return {
        base: "FROM gf.s_penjua h",
        cols: [{ sql: "''", label: "Info" }],
        where: "1=0",
        orderBy: "1",
        catatan: `${c.nama} — template cetak (print preview minimal). Gunakan tombol Cetak pada layar terkait.`,
      };
    },
  },
  // ===== KEUANGAN / GL 801 (file non-Buku-Besar) =====
  {
    id: "keuangan-801-extra",
    test: (c) => c.file.startsWith("801 "),
    build: (c): LapSpec | null => {
      if (pick(c, "cek masalah")) return {
        base: `FROM (
          SELECT 'Jurnal tanpa rincian' masalah, COUNT(*)::int n FROM gf.s_jurnal j WHERE COALESCE(j.hapus_oleh,0)=0 AND NOT EXISTS (SELECT 1 FROM gf.s_jurnex x WHERE x.jurnal_id=j.id AND x.tgl_hapus IS NULL)
          UNION ALL
          SELECT 'Jurnal tidak balance', COUNT(*)::int FROM (SELECT x.jurnal_id FROM gf.s_jurnex x WHERE x.tgl_hapus IS NULL GROUP BY x.jurnal_id HAVING SUM(CASE WHEN x.debet THEN x.nilai ELSE 0 END) <> SUM(CASE WHEN NOT x.debet THEN x.nilai ELSE 0 END)) z
          UNION ALL
          SELECT 'Penjualan tanpa item', COUNT(*)::int FROM gf.s_penjua h WHERE COALESCE(h.hapus_oleh,0)=0 AND NOT EXISTS (SELECT 1 FROM gf.s_penjud d WHERE d.penjua_id=h.id AND d.tgl_hapus IS NULL)
        ) q`,
        cols: [
          { sql: "q.masalah", label: "Masalah" },
          { sql: "q.n::text", label: "Jumlah", align: "r" },
        ],
        where: "1=1", orderBy: "2 DESC",
        catatan: "Cek masalah laporan (jurnal tanpa rincian / tidak balance / penjualan tanpa item)",
      };
      if (pick(c, "arus kas")) return {
        base: `FROM (
          SELECT d.tanggal, COALESCE(d.nilai,0) v, 'MASUK' jenis FROM gf.s_kasmex d JOIN gf.s_kasmsk k ON k.id=d.kasmsk_id AND COALESCE(k.hapus_oleh,0)=0 WHERE d.tgl_hapus IS NULL
          UNION ALL
          SELECT d.tanggal, COALESCE(d.nilai,0), 'KELUAR' FROM gf.s_kaskex d JOIN gf.s_kasklr k ON k.id=d.kasklr_id AND COALESCE(k.hapus_oleh,0)=0 WHERE d.tgl_hapus IS NULL
        ) x`,
        cols: [
          { sql: "to_char(x.tanggal,'YYYY-MM-DD')", label: "Tanggal" },
          { sql: "x.jenis", label: "Jenis" },
          { sql: "round(COALESCE(SUM(x.v),0),2)::text", label: "Nilai", align: "r" },
        ],
        where: "1=1",
        groupBy: "GROUP BY x.tanggal, x.jenis",
        orderBy: "1 DESC, 2",
        catatan: "Arus kas dari rincian kas masuk/keluar (s_kasmex/s_kaskex)",
      };
      if (pick(c, "neraca")) return {
        base: "FROM gf.s_perkir p LEFT JOIN (SELECT perkir_id pid, SUM(CASE WHEN debet THEN nilai ELSE 0 END) d, SUM(CASE WHEN NOT debet THEN nilai ELSE 0 END) k FROM gf.s_jurnex WHERE tgl_hapus IS NULL GROUP BY perkir_id) x ON x.pid=p.id",
        cols: [
          { sql: "COALESCE(p.nama,'')", label: "Perkiraan" },
          { sql: "round(COALESCE(x.d,0),2)::text", label: "Debet", align: "r" },
          { sql: "round(COALESCE(x.k,0),2)::text", label: "Kredit", align: "r" },
          { sql: "round(COALESCE(x.d,0)-COALESCE(x.k,0),2)::text", label: "Saldo", align: "r" },
        ],
        where: "COALESCE(p.hapus_oleh,0)=0 AND (COALESCE(x.d,0)+COALESCE(x.k,0))<>0",
        orderBy: "1",
        catatan: "Neraca per perkiraan (s_jurnex; saldo = debet − kredit)",
      };
      if (pick(c, "laba rugi")) {
        if (pick(c, "divisi")) return {
          base: "FROM gf.s_jurnex x JOIN gf.s_jurnal j ON j.id=x.jurnal_id LEFT JOIN gf.s_divisi dv ON dv.id=j.divisi_id",
          cols: [
            { sql: "COALESCE(dv.divisi,'(tanpa divisi)')", label: "Divisi" },
            { sql: "round(COALESCE(SUM(CASE WHEN x.debet THEN x.nilai ELSE 0 END),0),2)::text", label: "Debet", align: "r" },
            { sql: "round(COALESCE(SUM(CASE WHEN NOT x.debet THEN x.nilai ELSE 0 END),0),2)::text", label: "Kredit", align: "r" },
          ],
          where: "COALESCE(j.hapus_oleh,0)=0 AND x.tgl_hapus IS NULL",
          groupBy: "GROUP BY COALESCE(dv.divisi,'(tanpa divisi)')",
          orderBy: "1",
          catatan: "Laba rugi per divisi (agregat debet/kredit s_jurnex)",
        };
        return {
          base: "FROM gf.s_perkir p LEFT JOIN (SELECT perkir_id pid, SUM(CASE WHEN debet THEN nilai ELSE 0 END) d, SUM(CASE WHEN NOT debet THEN nilai ELSE 0 END) k FROM gf.s_jurnex WHERE tgl_hapus IS NULL GROUP BY perkir_id) x ON x.pid=p.id",
          cols: [
            { sql: "COALESCE(p.nama,'')", label: "Perkiraan" },
            { sql: "round(COALESCE(x.d,0),2)::text", label: "Debet", align: "r" },
            { sql: "round(COALESCE(x.k,0),2)::text", label: "Kredit", align: "r" },
            { sql: "round(COALESCE(x.k,0)-COALESCE(x.d,0),2)::text", label: "Saldo", align: "r" },
          ],
          where: "COALESCE(p.hapus_oleh,0)=0 AND (COALESCE(x.d,0)+COALESCE(x.k,0))<>0",
          orderBy: "1",
          catatan: "Laba rugi per perkiraan (saldo = kredit − debet)",
        };
      }
      if (pick(c, "mutasi perkiraan")) {
        const perBulan = pick(c, "bulan");
        return {
          base: "FROM gf.s_jurnex x JOIN gf.s_jurnal j ON j.id=x.jurnal_id",
          cols: [
            { sql: perBulan ? "to_char(x.tanggal,'YYYY-MM')" : "to_char(x.tanggal,'YYYY-MM-DD')", label: perBulan ? "Bulan" : "Tanggal" },
            { sql: "count(*)::text", label: "Jml Mutasi", align: "r" },
            { sql: "round(COALESCE(SUM(x.nilai),0),2)::text", label: "Nilai", align: "r" },
          ],
          where: "COALESCE(j.hapus_oleh,0)=0 AND x.tgl_hapus IS NULL",
          groupBy: perBulan ? "GROUP BY to_char(x.tanggal,'YYYY-MM')" : "GROUP BY to_char(x.tanggal,'YYYY-MM-DD')",
          orderBy: "1 DESC",
          catatan: `Mutasi perkiraan per ${perBulan ? "bulan" : "tanggal"} (s_jurnex)`,
        };
      }
      if (pick(c, "selisih kurs") || pick(c, "kurs pembukuan")) {
        const selisihOnly = pick(c, "selisih kurs");
        return {
          base: "FROM gf.s_jurnex x JOIN gf.s_jurnal j ON j.id=x.jurnal_id LEFT JOIN gf.s_mauang m ON m.id=x.mauang",
          cols: [
            { sql: "COALESCE(x.no::text,'')", label: "No" }, { sql: "to_char(x.tanggal,'YYYY-MM-DD')", label: "Tanggal" },
            { sql: "COALESCE(m.mata_uang, m.kode, '')", label: "MU" },
            { sql: "round(COALESCE(x.nilai,0),2)::text", label: "Nilai", align: "r" },
            { sql: "round(COALESCE(x.nilai_3,0),2)::text", label: "Nilai Pembukuan", align: "r" },
            { sql: "round(COALESCE(x.nilai,0)-COALESCE(x.nilai_3,0),2)::text", label: "Selisih", align: "r" },
          ],
          where: `COALESCE(j.hapus_oleh,0)=0 AND x.tgl_hapus IS NULL${selisihOnly ? " AND COALESCE(x.nilai,0)<>COALESCE(x.nilai_3,0)" : ""}`,
          orderBy: "x.tanggal DESC, x.sys_id DESC",
          catatan: `Kurs pembukuan/selisih kurs (s_jurnex ${selisihOnly ? "— hanya selisih ≠ 0" : ""})`,
        };
      }
      if (pick(c, "jurnal")) {
        const bermasalah = pick(c, "bermasalah") || pick(c, "tidak balance");
        const cols: LapCol[] = [
          { sql: "COALESCE(h.no::text,'')", label: "No" }, { sql: tgl(), label: "Tanggal" },
          { sql: "CASE h.jenis WHEN 1 THEN 'Umum' WHEN 2 THEN 'Penerimaan' WHEN 3 THEN 'Pengeluaran' WHEN 4 THEN 'Penutup' ELSE h.jenis::text END", label: "Jenis" },
          { sql: "round(COALESCE((SELECT SUM(CASE WHEN x.debet THEN x.nilai ELSE 0 END) FROM gf.s_jurnex x WHERE x.jurnal_id=h.id AND x.tgl_hapus IS NULL),0),2)::text", label: "Debet", align: "r" },
          { sql: "round(COALESCE((SELECT SUM(CASE WHEN NOT x.debet THEN x.nilai ELSE 0 END) FROM gf.s_jurnex x WHERE x.jurnal_id=h.id AND x.tgl_hapus IS NULL),0),2)::text", label: "Kredit", align: "r" },
          { sql: "COALESCE(h.catatan,'')", label: "Catatan" },
        ];
        return {
          base: "FROM gf.s_jurnal h",
          cols,
          where: bermasalah
            ? `COALESCE(h.hapus_oleh,0)=0 AND COALESCE((SELECT SUM(CASE WHEN x.debet THEN x.nilai ELSE 0 END) FROM gf.s_jurnex x WHERE x.jurnal_id=h.id AND x.tgl_hapus IS NULL),0) <> COALESCE((SELECT SUM(CASE WHEN NOT x.debet THEN x.nilai ELSE 0 END) FROM gf.s_jurnex x WHERE x.jurnal_id=h.id AND x.tgl_hapus IS NULL),0)`
            : "COALESCE(h.hapus_oleh,0)=0",
          orderBy: bermasalah ? "h.id DESC" : "h.tanggal DESC, h.id DESC",
          catatan: bermasalah ? "Jurnal bermasalah/tidak balance (debet ≠ kredit)" : "Daftar jurnal (s_jurnal + total s_jurnex)",
        };
      }
      return null;
    },
  },
];

export function buildSpec(file: string, nama: string): LapSpec | null {
  const ctx: RuleCtx = { file, nama, lower: `${file} ${nama}`.toLowerCase() };
  for (const r of ENGINE_RULES) {
    if (r.test(ctx)) {
      const spec = r.build(ctx);
      if (spec) return spec;
    }
  }
  return null;
}

export function isImplemented(file: string, nama: string): boolean {
  return buildSpec(file, nama) !== null;
}

const NA_PREFIX = ["204 ", "205 ", "206 ", "207 ", "208 ", "209 ", "223 "];

export function isNA(file: string): boolean {
  return NA_PREFIX.some((p) => file.startsWith(p));
}
