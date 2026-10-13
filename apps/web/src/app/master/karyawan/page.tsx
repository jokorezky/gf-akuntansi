"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { gql } from "@/lib/graphql";

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
};
type Ref = { id: number; nama: string };

const FIELDS = "id nama alamat telepon komisi catatan nonAktif sales supir helper collector admin jenpenId divisiId grpstk grpst2 grpst3";
const LIST = `query($q:String){ karyawanList(q:$q){ total rows { ${FIELDS} } } }`;
const REFS = `{ jenpenRefList { id nama } divisiRefList { id nama } grpstkRefList { id nama } grpst2RefList { id nama } grpst3RefList { id nama } }`;
const BYID = `query($id:Int!){ karyawanById(id:$id){ ${FIELDS} } }`;
const CREATE = `mutation($input:KaryawanInput!){ createKaryawan(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:KaryawanInput!){ updateKaryawan(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteKaryawan(id:$id) }`;

const ICON = "/gf-icons/screens/karyawan";

const empty = (): Row => ({
  id: 0, nama: "", alamat: "", telepon: "", komisi: "0.00", catatan: "", nonAktif: "",
  sales: false, supir: false, helper: false, collector: false, admin: false,
  jenpenId: null, divisiId: null, grpstk: "", grpst2: "", grpst3: "",
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
    <div className="h-[380px] overflow-auto border border-gf-border bg-white">
      {list.map((g) => {
        const checked = splitIds(f[k]).includes(g.id);
        return (
          <label key={g.id} className="flex items-center gap-1 px-1 py-[1px] text-[11px] hover:bg-[#e8eef7]">
            <input
              type="checkbox"
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
    <div className="fixed inset-0 z-30 flex items-start justify-center bg-black/20 pt-10">
      <div className="w-[860px] border border-gf-border bg-gf-panel shadow-lg">
        <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">
          <span>Karyawan</span>
          <button className="gf-3d bg-gf-menubar px-2 text-[11px]" onClick={onClose}>✕</button>
        </div>
        <div className="p-2">
          <div className="flex gap-1 border-b border-gf-border pb-[-1px]">
            {[
              { icon: `${ICON}/tab-data-utama.png`, label: "Data Utama" },
              { icon: `${ICON}/tab-inisialisasi.png`, label: "Inisialisasi" },
            ].map((t, i) => (
              <button
                key={t.label}
                onClick={() => setTab(i)}
                className={`gf-3d flex items-center gap-1 border-b-0 px-3 py-[2px] text-[12px] ${tab === i ? "bg-white" : "bg-gf-menubar"}`}
              >
                <Image src={t.icon} alt="" width={18} height={18} unoptimized />
                {t.label}
              </button>
            ))}
          </div>
          {tab === 0 ? (
            <div className="flex gap-2 border border-gf-border bg-[#f4f4f4] p-3">
              <div className="w-[380px]">
                <div className="grid grid-cols-[90px_1fr] items-center gap-y-[6px] text-[12px]">
                  <span>ID :</span>
                  <span className="border border-gf-border bg-[#ccff99] px-2 py-[2px] font-mono text-[12px]">{mode === "create" ? "???" : f.id}</span>
                  <span>Nama :</span>
                  <input className="gf-3d bg-white px-2 py-[2px]" value={f.nama ?? ""} onChange={(e) => set("nama", e.target.value)} />
                  <span className="self-start pt-1">Alamat :</span>
                  <textarea className="gf-3d h-[70px] bg-white px-2 py-[2px]" value={f.alamat ?? ""} onChange={(e) => set("alamat", e.target.value)} />
                  <span>Telepon :</span>
                  <input className="gf-3d bg-white px-2 py-[2px]" value={f.telepon ?? ""} onChange={(e) => set("telepon", e.target.value)} />
                  <span>Komisi :</span>
                  <div className="flex items-center gap-1">
                    <input className="gf-3d w-[90px] bg-white px-2 py-[2px] text-right" value={f.komisi ?? ""} onChange={(e) => set("komisi", e.target.value)} />
                    <span>%</span>
                  </div>
                  <span>Catatan :</span>
                  <input className="gf-3d bg-white px-2 py-[2px]" value={f.catatan ?? ""} onChange={(e) => set("catatan", e.target.value)} />
                </div>
                <div className="mt-3 grid grid-cols-[90px_1fr] items-center gap-y-[6px] border-t border-gf-border pt-2 text-[12px]">
                  <span>Non-Aktif :</span>
                  <input type="date" className="gf-3d w-[140px] bg-white px-2 py-[2px]" value={f.nonAktif ?? ""} onChange={(e) => set("nonAktif", e.target.value)} />
                  <span>Jenis Penj :</span>
                  <select className="gf-3d w-full bg-white px-1 py-[2px]" value={f.jenpenId ?? ""} onChange={(e) => set("jenpenId", e.target.value ? Number(e.target.value) : null)}>
                    <option value="">---</option>
                    {refs.jenpen.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                  </select>
                  <span>Divisi :</span>
                  <select className="gf-3d w-full bg-white px-1 py-[2px]" value={f.divisiId ?? ""} onChange={(e) => set("divisiId", e.target.value ? Number(e.target.value) : null)}>
                    <option value="">---semua divisi--</option>
                    {refs.divisi.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex-1 border border-gf-border bg-white p-3">
                {(["sales", "supir", "helper", "collector", "admin"] as const).map((k) => (
                  <label key={k} className="mb-1 flex items-center gap-2 text-[12px] capitalize">
                    <input type="checkbox" checked={Boolean(f[k])} onChange={(e) => set(k, e.target.checked)} />
                    {k}
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-gf-border bg-[#f4f4f4] p-2">
              <div className="mb-2 bg-[#c8f0c8] px-2 py-[3px] text-center text-[12px] text-green-800">
                Tidak dipilih, berarti semuanya boleh.
              </div>
              <div className="grid grid-cols-3 gap-1 text-[12px]">
                <div>
                  <div className="border border-gf-border bg-white px-1 text-[11px]">Grouping</div>
                  {grp("grpstk", refs.g1)}
                </div>
                <div>
                  <div className="border border-gf-border bg-white px-1 text-[11px]">Grouping *2</div>
                  {grp("grpst2", refs.g2)}
                </div>
                <div>
                  <div className="border border-gf-border bg-white px-1 text-[11px]">Grouping *3</div>
                  {grp("grpst3", refs.g3)}
                </div>
              </div>
            </div>
          )}
          {err && <div className="mt-2 text-[12px] text-red-700">{err}</div>}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={simpan} className="gf-3d flex items-center justify-center gap-2 bg-gf-menubar py-[4px] text-[13px]">
              <Image src={`${ICON}/simpan.png`} alt="" width={22} height={22} unoptimized />
              Simpan
            </button>
            <button onClick={onClose} className="gf-3d flex items-center justify-center gap-2 bg-gf-menubar py-[4px] text-[13px]">
              <Image src={`${ICON}/form-tutup.png`} alt="" width={22} height={22} unoptimized />
              Tutup
            </button>
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
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [refs, setRefs] = useState({ jenpen: [] as Ref[], divisi: [] as Ref[], g1: [] as Ref[], g2: [] as Ref[], g3: [] as Ref[] });
  const [form, setForm] = useState<Row | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ karyawanList: { total: number; rows: Row[] } }>(LIST, { q });
    setRows(d.karyawanList.rows);
    setTotal(d.karyawanList.total);
  }, [q]);

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
    if (!confirm(`Hapus karyawan id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel });
    setSel(null);
    setMsg("Terhapus.");
    await load();
  }

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1100px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Karyawan</div>
        <div className="p-2">
          <div className="mb-1 text-center text-[12px] font-bold tracking-widest text-gf-accent">
            M A S T E R&nbsp;&nbsp;F I L E&nbsp;&nbsp;-&nbsp;&nbsp;K A R Y A W A N
          </div>
          <div className="mb-2 flex items-center gap-2">
            <input
              className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]"
              placeholder="Cari nama..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button onClick={onTambah} className="gf-3d bg-gf-menubar p-1" title="Tambah">
              <Image src={`${ICON}/tambah.png`} alt="Tambah" width={102} height={53} unoptimized />
            </button>
            <button onClick={onKoreksi} className={`gf-3d bg-gf-menubar p-1 ${sel == null ? "opacity-40" : ""}`} title="Koreksi">
              <Image src={`${ICON}/koreksi.png`} alt="Koreksi" width={102} height={53} unoptimized />
            </button>
            <button onClick={onHapus} className={`gf-3d bg-gf-menubar p-1 ${sel == null ? "opacity-40" : ""}`} title="Hapus">
              <Image src={`${ICON}/hapus.png`} alt="Hapus" width={102} height={53} unoptimized />
            </button>
            <button onClick={() => router.push("/")} className="gf-3d bg-gf-menubar p-1" title="Tutup">
              <Image src={`${ICON}/tutup.png`} alt="Tutup" width={102} height={53} unoptimized />
            </button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}
          <div className="overflow-auto border border-gf-border bg-white max-h-[460px]">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0">
                <tr className="bg-gf-menubar">
                  {["ID", "Nama", "Alamat", "Tipe", "Komisi", "Telepon", "Non-Aktif", "Catatan"].map((h) => (
                    <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSel(r.id)}
                    className={`cursor-pointer ${sel === r.id ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`}
                  >
                    <td className="border border-gf-border px-2 py-[2px]">{r.id}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.nama}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.alamat}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{tipe(r)}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.komisi}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.telepon}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.nonAktif}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.catatan}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total}</div>
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
            await load();
          }}
        />
      )}
    </div>
  );
}
