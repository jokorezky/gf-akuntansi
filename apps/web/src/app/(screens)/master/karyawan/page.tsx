"use client";



import { Pager } from "@/components/gf/Pager";
import { confirmDialog } from "@/components/gf/ConfirmHost";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Save, Search, Settings2, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { gql } from "@/lib/graphql";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Row = {
  id: number;
  nama: string;
  alamat?: string | null;
  telepon?: string | null;
  komisi?: string | null;
  catatan?: string | null;
  nonAktif?: string | null;
  sales?: boolean;
  supir?: boolean;
  helper?: boolean;
  collector?: boolean;
  admin?: boolean;
  jenpenId?: number | null;
  divisiId?: number | null;
  grpstk?: string | null;
  grpst2?: string | null;
  grpst3?: string | null;
  tambahEx1?: string | null;
  tambahEx2?: string | null;
};
type Ref = { id: number; nama: string };

const FIELDS = "id nama alamat telepon komisi catatan nonAktif sales supir helper collector admin jenpenId divisiId grpstk grpst2 grpst3 tambahEx1 tambahEx2";
const LIST = `query($q:String, $limit:Int, $offset:Int){ karyawanList(q:$q, limit:$limit, offset:$offset){ total rows { ${FIELDS} } } }`;
const REFS = `{ jenpenRefList { id nama } divisiRefList { id nama } grpstkRefList { id nama } grpst2RefList { id nama } grpst3RefList { id nama } }`;
const BYID = `query($id:Int!){ karyawanById(id:$id){ ${FIELDS} } }`;
const CREATE = `mutation($input:KaryawanInput!){ createKaryawan(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:KaryawanInput!){ updateKaryawan(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteKaryawan(id:$id) }`;

// GF menampilkan field "Tambahan Harga Extra > POS" hanya bila konfigurasi POS-extra aktif; default tersembunyi.
const SHOW_TAMBAHAN_EX_POS = false;

const empty = (): Row => ({
  id: 0, nama: "", alamat: "", telepon: "", komisi: "0.00", catatan: "", nonAktif: "",
  sales: false, supir: false, helper: false, collector: false, admin: false,
  jenpenId: null, divisiId: null, grpstk: "", grpst2: "", grpst3: "", tambahEx1: "0.00", tambahEx2: "0.00",
});

function tipe(r: Row): string {
  const t = [r.sales && "Sales", r.supir && "Supir", r.helper && "Helper", r.collector && "Collector", r.admin && "Admin"].filter(Boolean);
  return t.join(", ");
}
const splitIds = (s?: string | null): number[] => (s ?? "").split(",").map((x) => Number(x.trim())).filter((n) => n > 0);
const joinIds = (ids: number[]): string => ids.join(",");

function KaryawanForm({
  initial, mode, refs, onClose, onSaved,
}: {
  initial: Row; mode: "create" | "edit";
  refs: { jenpen: Ref[]; divisi: Ref[]; g1: Ref[]; g2: Ref[]; g3: Ref[] };
  onClose: () => void; onSaved: () => void;
}) {
  const [f, setF] = useState<Row>(initial);
  const [tab, setTab] = useState(0);
  const [err, setErr] = useState("");
  const set = (k: keyof Row, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  async function simpan() {
    setErr("");
    try {
      const { id: _id, ...rest } = f;
      const input = { ...rest, nonAktif: f.nonAktif || null };
      if (mode === "create") await gql(CREATE, { input });
      else await gql(UPDATE, { id: f.id, input });
      onSaved();
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    }
  }

  const grp = (k: "grpstk" | "grpst2" | "grpst3", list: Ref[]) => (
    <div className="h-[380px] overflow-auto rounded-md border border-gf-border bg-white">
      {list.map((g) => {
        const checked = splitIds(f[k]).includes(g.id);
        return (
          <label key={g.id} className="flex items-center gap-2 px-2 py-[3px] text-[11px] hover:bg-gf-accent/5">
            <input
              type="checkbox"
              className="accent-gf-accent"
              checked={checked}
              onChange={(e) => {
                const ids = new Set(splitIds(f[k]));
                if (e.target.checked) ids.add(g.id); else ids.delete(g.id);
                set(k, joinIds([...ids]));
              }}
            />
            <span className="truncate">{g.nama}</span>
          </label>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center bg-slate-900/30 pt-10 backdrop-blur-[2px]">
      <div className="w-[860px] overflow-hidden rounded-xl border border-gf-border bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gf-border bg-white px-3 py-[7px]">
          <span className="text-[13px] font-semibold text-slate-800">Karyawan</span>
          <button className="flex h-[22px] w-[22px] items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600" onClick={onClose}>
            <X className="h-[14px] w-[14px]" />
          </button>
        </div>
        <div className="p-3">
          <div className="mb-3 flex gap-1 border-b border-gf-border">
            {[
              { Ico: UserRound, label: "Data Utama" },
              { Ico: Settings2, label: "Inisialisasi" },
            ].map((t, i) => (
              <button
                key={t.label}
                onClick={() => setTab(i)}
                className={cn(
                  "-mb-[1px] flex items-center gap-1.5 border-b-2 px-3 py-[6px] text-[12px] font-medium transition-colors",
                  tab === i
                    ? "border-gf-accent text-gf-accent"
                    : "border-transparent text-slate-500 hover:text-slate-700",
                )}
              >
                <t.Ico className="h-[15px] w-[15px]" />
                {t.label}
              </button>
            ))}
          </div>
          {tab === 0 ? (
            <div className="flex gap-3 rounded-lg border border-gf-border bg-slate-50 p-3">
              <div className="w-[380px]">
                <div className="grid grid-cols-[90px_1fr] items-center gap-y-[7px] text-[12px]">
                  <span className="text-slate-500">ID :</span>
                  <span className="w-fit rounded-md border border-emerald-200 bg-emerald-50 px-2 py-[3px] font-mono text-[12px] font-medium text-emerald-700">{mode === "create" ? "???" : f.id}</span>
                  <span className="text-slate-500">Nama :</span>
                  <input className="rounded-md border border-gf-border bg-white px-2 py-[5px] outline-none focus:border-gf-accent/50 focus:ring-2 focus:ring-gf-accent/15" value={f.nama ?? ""} onChange={(e) => set("nama", e.target.value)} />
                  <span className="self-start pt-1 text-slate-500">Alamat :</span>
                  <textarea className="h-[70px] rounded-md border border-gf-border bg-white px-2 py-[5px] outline-none focus:border-gf-accent/50 focus:ring-2 focus:ring-gf-accent/15" value={f.alamat ?? ""} onChange={(e) => set("alamat", e.target.value)} />
                  <span className="text-slate-500">Telepon :</span>
                  <input className="rounded-md border border-gf-border bg-white px-2 py-[5px] outline-none focus:border-gf-accent/50 focus:ring-2 focus:ring-gf-accent/15" value={f.telepon ?? ""} onChange={(e) => set("telepon", e.target.value)} />
                  <span className="text-slate-500">Komisi :</span>
                  <div className="flex items-center gap-1">
                    <input className="w-[90px] rounded-md border border-gf-border bg-white px-2 py-[5px] text-right outline-none focus:border-gf-accent/50 focus:ring-2 focus:ring-gf-accent/15" value={f.komisi ?? ""} onChange={(e) => set("komisi", e.target.value)} />
                    <span className="text-slate-500">%</span>
                  </div>
                  <span className="text-slate-500">Catatan :</span>
                  <input className="rounded-md border border-gf-border bg-white px-2 py-[5px] outline-none focus:border-gf-accent/50 focus:ring-2 focus:ring-gf-accent/15" value={f.catatan ?? ""} onChange={(e) => set("catatan", e.target.value)} />
                </div>
                <div className="mt-3 grid grid-cols-[90px_1fr] items-center gap-y-[7px] border-t border-gf-border pt-3 text-[12px]">
                  <span className="text-slate-500">Non-Aktif :</span>
                  <input type="date" className="w-[150px] rounded-md border border-gf-border bg-white px-2 py-[5px] outline-none focus:border-gf-accent/50" value={f.nonAktif ?? ""} onChange={(e) => set("nonAktif", e.target.value)} />
                  <span className="text-slate-500">Jenis Penj :</span>
                  <select className="w-full rounded-md border border-gf-border bg-white px-2 py-[5px] outline-none focus:border-gf-accent/50" value={f.jenpenId ?? ""} onChange={(e) => set("jenpenId", e.target.value ? Number(e.target.value) : null)}>
                    <option value="">---</option>
                    {refs.jenpen.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                  </select>
                  <span className="text-slate-500">Divisi :</span>
                  <select className="w-full rounded-md border border-gf-border bg-white px-2 py-[5px] outline-none focus:border-gf-accent/50" value={f.divisiId ?? ""} onChange={(e) => set("divisiId", e.target.value ? Number(e.target.value) : null)}>
                    <option value="">---semua divisi--</option>
                    {refs.divisi.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex-1 rounded-lg border border-gf-border bg-white p-3">
                {(["sales", "supir", "helper", "collector", "admin"] as const).map((k) => (
                  <label key={k} className="mb-1.5 flex items-center gap-2 text-[12px] capitalize">
                    <input type="checkbox" className="accent-gf-accent" checked={Boolean(f[k])} onChange={(e) => set(k, e.target.checked)} />
                    {k}
                  </label>
                ))}
                {SHOW_TAMBAHAN_EX_POS && (
                  <div className="mt-3 border-t border-gf-border pt-2">
                    <div className="mb-1 text-[11px] font-medium text-slate-500">Tambahan Harga Extra &gt; POS :</div>
                    <div className="grid grid-cols-[58px_1fr] items-center gap-y-[6px] text-[12px]">
                      <span className="text-slate-500">Ex *1 :</span>
                      <input className="rounded-md border border-gf-border bg-white px-2 py-[5px] outline-none focus:border-gf-accent/50" value={f.tambahEx1 ?? ""} onChange={(e) => set("tambahEx1", e.target.value)} />
                      <span className="text-slate-500">Ex *2 :</span>
                      <input className="rounded-md border border-gf-border bg-white px-2 py-[5px] outline-none focus:border-gf-accent/50" value={f.tambahEx2 ?? ""} onChange={(e) => set("tambahEx2", e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-gf-border bg-slate-50 p-3">
              <div className="mb-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-[4px] text-center text-[12px] text-emerald-700">
                Tidak dipilih, berarti semuanya boleh.
              </div>
              <div className="grid grid-cols-3 gap-2 text-[12px]">
                <div>
                  <div className="mb-1 text-[11px] font-medium text-slate-500">Grouping</div>
                  {grp("grpstk", refs.g1)}
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-medium text-slate-500">Grouping *2</div>
                  {grp("grpst2", refs.g2)}
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-medium text-slate-500">Grouping *3</div>
                  {grp("grpst3", refs.g3)}
                </div>
              </div>
            </div>
          )}
          {err && <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[12px] text-red-700">{err}</div>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="primary" size="lg" onClick={simpan}>
              <Save className="h-[15px] w-[15px]" />
              Simpan
            </Button>
            <Button variant="default" size="lg" onClick={onClose}>
              <X className="h-[15px] w-[15px]" />
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KaryawanPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [refs, setRefs] = useState({ jenpen: [] as Ref[], divisi: [] as Ref[], g1: [] as Ref[], g2: [] as Ref[], g3: [] as Ref[] });
  const [form, setForm] = useState<Row | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { setPage(1); }, [q]);
  const load = useCallback(async () => {
    const d = await gql<{ karyawanList: { total: number; rows: Row[] } }>(LIST, { q, limit: 10, offset: (page - 1) * 10 });
    setRows(d.karyawanList.rows);
    setTotal(d.karyawanList.total);
  }, [q, page]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ jenpenRefList: Ref[]; divisiRefList: Ref[]; grpstkRefList: Ref[]; grpst2RefList: Ref[]; grpst3RefList: Ref[] }>(REFS)
      .then((d) => setRefs({ jenpen: d.jenpenRefList, divisi: d.divisiRefList, g1: d.grpstkRefList, g2: d.grpst2RefList, g3: d.grpst3RefList }))
      .catch(() => undefined);
  }, [load]);

  async function onTambah() {
    setErr(""); setMsg("");
    setMode("create");
    setForm(empty());
  }

  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ karyawanById: Row }>(BYID, { id: sel });
    setMode("edit");
    setForm(d.karyawanById);
  }

  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!(await confirmDialog(`Hapus karyawan id ${sel}? (soft delete)`))) return;
    await gql(DELETE, { id: sel });
    setSel(null);
    setMsg("Terhapus.");
    toast.success("Karyawan terhapus (soft delete).");
    await load();
  }

  return (
    <div className="min-h-full bg-transparent p-3 text-gf-text">
      <div className="gf-window mx-auto max-w-[1100px]">
        <div className="flex items-center justify-between border-b border-gf-border bg-white px-3 py-[6px]">
          <span className="text-[12.5px] font-semibold text-slate-800">Karyawan</span>
        </div>
        <div className="p-3">
          <div className="mb-2 text-center text-[12px] font-semibold tracking-[0.35em] text-gf-accent">
            MASTER FILE - KARYAWAN
          </div>
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-slate-400" />
              <input
                className="h-[30px] w-full rounded-md border border-gf-border bg-white pl-8 pr-3 text-[12px] shadow-inner outline-none focus:border-gf-accent/50 focus:ring-2 focus:ring-gf-accent/15"
                placeholder="" title="Pencarian (ketik untuk mencari)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Button variant="default" onClick={onTambah} title="Tambah (F?)">
              <Plus className="h-[14px] w-[14px] text-emerald-600" />
              Tambah
            </Button>
            <Button variant="default" onClick={onKoreksi} disabled={sel == null} title="Koreksi">
              <Pencil className="h-[13px] w-[13px] text-sky-600" />
              Koreksi
            </Button>
            <Button variant="default" onClick={onHapus} disabled={sel == null} title="Hapus">
              <Trash2 className="h-[13px] w-[13px] text-red-600" />
              Hapus
            </Button>
            <Button variant="default" onClick={() => router.push("/")} title="Tutup">
              <X className="h-[14px] w-[14px] text-slate-500" />
              Tutup
            </Button>
          </div>
          {err && <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[12px] text-red-700">{err}</div>}
          {msg && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}
          <div className="max-h-[460px] overflow-auto rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  {["ID", "Nama", "Alamat", "Tipe", "Komisi", "Telepon", "Non-Aktif", "Catatan"].map((h) => (
                    <th key={h} className="border-b border-gf-border px-3 py-[7px] text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSel(r.id)}
                    className={cn(
                      "cursor-pointer border-b border-slate-100 transition-colors",
                      sel === r.id ? "bg-gf-accent/[0.07]" : "hover:bg-slate-50",
                    )}
                  >
                    <td className="px-3 py-[6px] font-mono text-slate-500">{r.id}</td>
                    <td className="px-3 py-[6px] font-medium text-slate-700">{r.nama}</td>
                    <td className="px-3 py-[6px] text-slate-600">{r.alamat}</td>
                    <td className="px-3 py-[6px] text-slate-600">{tipe(r)}</td>
                    <td className="px-3 py-[6px] text-right font-mono text-slate-700">{r.komisi}</td>
                    <td className="px-3 py-[6px] text-slate-600">{r.telepon}</td>
                    <td className="px-3 py-[6px] text-slate-600">{r.nonAktif}</td>
                    <td className="px-3 py-[6px] text-slate-600">{r.catatan}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="px-2 py-6 text-center text-slate-400">Belum ada data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={total} onPage={setPage} className="mt-2" />
        </div>
      </div>

      {form && (
        <KaryawanForm
          initial={form}
          mode={mode}
          refs={refs}
          onClose={() => setForm(null)}
          onSaved={async () => {
            setForm(null);
            setMsg("Tersimpan.");
            toast.success("Karyawan tersimpan.");
            await load();
          }}
        />
      )}
    </div>
  );
}
