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
  const cols: LapCol[] = [
    { sql: doc === "gf.s_purcor" ? "h.po::text" : "h.no::text", label: "No" }, { sql: tgl(), label: "Tanggal" },
    { sql: "COALESCE(v.nama,'')", label: "Vendor" },
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
    base: `FROM ${doc} h ${V} JOIN ${lineJoin} d ON d.${kode}_id=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id`,
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
    base: `FROM ${doc} h ${V} JOIN ${lineJoin} d ON d.${kode}_id=h.id LEFT JOIN gf.s_stock s ON s.id=d.stock_id ${gJoin}`,
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
