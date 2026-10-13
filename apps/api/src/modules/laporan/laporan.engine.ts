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
        where: aktif, groupBy: "COALESCE(k.nama, h.sales::text)", orderBy: "3 DESC",
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
            ? "COALESCE(k.nama, h.sales::text), " + tgl() + ", COALESCE(gs.nama,'(tanpa kelompok)')"
            : "COALESCE(k.nama, h.sales::text), " + tgl(),
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
        groupBy: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,'')",
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
        groupBy: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,'')",
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
        groupBy: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,'')",
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
        groupBy: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,''), COALESCE(d.stkser_1,'')",
        orderBy: "1, 3", catatan: "Penjualan per barang dengan Serial ID (stkser)",
      };
      if (pick(c, "record")) return {
        base: "FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id LEFT JOIN gf.s_stock s ON s.id=d.stock_id",
        cols: [
          { sql: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text)", label: "Kode" }, { sql: "COALESCE(s.nama,'')", label: "Nama" },
          { sql: "count(*)::text", label: "Jml Record", align: "r" },
        ],
        where: `d.tgl_hapus IS NULL AND ${aktif}`,
        groupBy: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,'')",
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
        groupBy: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,'')",
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
        groupBy: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,'')",
        orderBy: "4 DESC", catatan: "Ranking penjualan per barang (nilai desc)",
      };
      if (pick(c, "jml hari")) return {
        base: "FROM gf.s_penjua h",
        cols: [
          { sql: tgl(), label: "Tanggal" }, { sql: "count(*)::text", label: "Jml Faktur", align: "r" },
          { sql: "round(COALESCE(SUM(h.tot_harga - h.tot_disc),0),2)::text", label: "Nilai", align: "r" },
        ],
        where: aktif, groupBy: tgl(), orderBy: "1",
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
        groupBy: "COALESCE(gs.nama,'(tanpa kelompok)')", orderBy: "1",
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
        groupBy: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,'')", orderBy: "1",
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
        where: aktif, groupBy: tgl(), orderBy: "1",
        catatan: "Jumlah penjualan per tanggal",
      };
      if (pick(c, "dan retur")) return {
        base: `FROM gf.s_stock s
          LEFT JOIN LATERAL (SELECT COALESCE(SUM(d.jumlah),0) j FROM gf.s_penjud d JOIN gf.s_penjua h ON h.id=d.penjua_id AND COALESCE(h.als_batal,'')='' WHERE d.stock_id=s.id AND d.tgl_hapus IS NULL) j ON true
          LEFT JOIN LATERAL (SELECT COALESCE(SUM(d.jumlah),0) j FROM gf.s_retpjd d JOIN gf.s_retpen h ON h.id=d.retpen_id AND COALESCE(h.als_batal,'')='' WHERE d.stock_id=s.id AND d.tgl_hapus IS NULL) r ON true`,
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
        groupBy: "COALESCE(s.kode_c, s.kode_c_2, d.stock_id::text), COALESCE(s.nama,'')",
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
