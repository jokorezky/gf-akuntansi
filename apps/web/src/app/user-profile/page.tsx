"use client";

import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type User = {
  id: number; user?: string | null; securiId?: number | null; grupNama?: string | null; pemilik?: string | null;
  sales?: number | null; userpusat?: boolean | null; workstat?: string | null; ip?: string | null;
  loginTgl?: string | null; loginJam?: string | null; hasPassword?: boolean | null;
};
type Grup = { id: number; nama?: string | null; pemilik?: string | null; securityInfo?: string | null; jumlahUser?: number | null };

const UF = `id user securiId grupNama pemilik sales userpusat workstat ip loginTgl loginJam hasPassword`;
const GF = `id nama pemilik securityInfo jumlahUser`;
const U_LIST = `query($q:String){ secUserList(q:$q){ total rows { ${UF} } } }`;
const G_LIST = `query($q:String){ secGrupList(q:$q){ total rows { ${GF} } } }`;
const U_BYID = `query($id:Int!){ secUserById(id:$id){ ${UF} } }`;
const G_BYID = `query($id:Int!){ secGrupById(id:$id){ ${GF} } }`;
const U_CREATE = `mutation($input:SecUserInput!){ createSecUser(input:$input){ id } }`;
const U_UPDATE = `mutation($id:Int!,$input:SecUserInput!){ updateSecUser(id:$id, input:$input){ id } }`;
const U_DUP = `mutation($id:Int!){ duplicateSecUser(id:$id){ id user } }`;
const U_DEL = `mutation($id:Int!){ deleteSecUser(id:$id) }`;
const G_CREATE = `mutation($input:SecGrupInput!){ createSecGrup(input:$input){ id } }`;
const G_UPDATE = `mutation($id:Int!,$input:SecGrupInput!){ updateSecGrup(id:$id, input:$input){ id } }`;
const G_DEL = `mutation($id:Int!){ deleteSecGrup(id:$id) }`;

const jev = (v: string | null | undefined) => v ?? "";

export default function UserProfilePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [grups, setGrups] = useState<Grup[]>([]);
  const [q, setQ] = useState("");
  const [userSel, setUserSel] = useState<number | null>(null);
  const [grupSel, setGrupSel] = useState<number | null>(null);
  const [uForm, setUForm] = useState<User | null>(null);
  const [uPass, setUPass] = useState("");
  const [gForm, setGForm] = useState<Grup | null>(null);
  const [uMode, setUMode] = useState<"create" | "edit">("create");
  const [gMode, setGMode] = useState<"create" | "edit">("create");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [u, g] = await Promise.all([
      gql<{ secUserList: { rows: User[] } }>(U_LIST, { q }),
      gql<{ secGrupList: { rows: Grup[] } }>(G_LIST, { q }),
    ]);
    setUsers(u.secUserList.rows); setGrups(g.secGrupList.rows);
  }, [q]);

  useEffect(() => { load().catch((e) => setErr(String(e.message ?? e))); }, [load]);

  const setU = (patch: Partial<User>) => setUForm((f) => (f ? { ...f, ...patch } : f));
  const setG = (patch: Partial<Grup>) => setGForm((f) => (f ? { ...f, ...patch } : f));

  async function onTambahUser() { setErr(""); setMsg(""); setUMode("create"); setUPass(""); setUForm({ id: 0, user: "", securiId: null, pemilik: "", sales: 0, userpusat: false, workstat: "", ip: "" }); }
  async function onKoreksiUser() {
    if (userSel == null) return setMsg("Pilih user dulu (Koreksi).");
    const d = await gql<{ secUserById: User }>(U_BYID, { id: userSel });
    setUMode("edit"); setUPass(""); setUForm(d.secUserById);
  }
  async function onHapusUser() {
    if (userSel == null) return setMsg("Pilih user dulu (Hapus).");
    if (!confirm(`Hapus user id ${userSel}? (soft delete)`)) return;
    await gql(U_DEL, { id: userSel }); setUserSel(null); setMsg("Terhapus."); await load();
  }
  async function onDuplicate() {
    if (userSel == null) return setMsg("Pilih user dulu (Duplicate).");
    const d = await gql<{ duplicateSecUser: User }>(U_DUP, { id: userSel });
    setMsg(`Duplikat dibuat: ${d.duplicateSecUser.user} (id ${d.duplicateSecUser.id})`); await load();
  }
  async function onSimpanUser() {
    if (!uForm) return;
    if (!uForm.user) return setErr("User wajib diisi.");
    setErr("");
    try {
      const input = {
        user: uForm.user, securiId: uForm.securiId ?? null, pemilik: uForm.pemilik || null,
        sales: uForm.sales ?? null, userpusat: uForm.userpusat ?? false,
        workstat: uForm.workstat || null, ip: uForm.ip || null, password: uPass || null,
      };
      if (uMode === "create") await gql(U_CREATE, { input }); else await gql(U_UPDATE, { id: uForm.id, input });
      setUForm(null); setMsg(uMode === "create" ? "User tersimpan." : "User diperbarui."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }

  async function onTambahGrup() { setErr(""); setMsg(""); setGMode("create"); setGForm({ id: 0, nama: "", pemilik: "" }); }
  async function onKoreksiGrup() {
    if (grupSel == null) return setMsg("Pilih grup dulu (Koreksi).");
    const d = await gql<{ secGrupById: Grup }>(G_BYID, { id: grupSel });
    setGMode("edit"); setGForm(d.secGrupById);
  }
  async function onHapusGrup() {
    if (grupSel == null) return setMsg("Pilih grup dulu (Hapus).");
    if (!confirm(`Hapus grup id ${grupSel}? (soft delete)`)) return;
    await gql(G_DEL, { id: grupSel }); setGrupSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpanGrup() {
    if (!gForm) return;
    if (!gForm.nama) return setErr("Keterangan grup wajib diisi.");
    setErr("");
    try {
      const input = { nama: gForm.nama, pemilik: gForm.pemilik || null };
      if (gMode === "create") await gql(G_CREATE, { input }); else await gql(G_UPDATE, { id: gForm.id, input });
      setGForm(null); setMsg(gMode === "create" ? "Grup tersimpan." : "Grup diperbarui."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }

  const td = "border border-gf-border px-1 py-[1px]";

  return (
    <div className="min-h-screen bg-gf-bg p-2 text-gf-text">
      <div className="mx-auto max-w-[1180px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">User Profile</div>
        <div className="p-2">
          <div className="mb-2 flex items-center gap-1">
            <input className="gf-3d w-[260px] bg-white px-2 py-[3px] text-[12px]" placeholder="Cari user / grup..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button onClick={onDuplicate} className="gf-3d bg-gf-menubar px-3 py-[3px] text-[11px]">Duplicate</button>
            <button onClick={onTambahUser} className="gf-3d bg-gf-menubar px-3 py-[3px] text-[11px] font-bold">Tambah User</button>
            <button onClick={onKoreksiUser} className="gf-3d bg-gf-menubar px-3 py-[3px] text-[11px]">Koreksi User</button>
            <button onClick={onHapusUser} className="gf-3d bg-gf-menubar px-3 py-[3px] text-[11px]">Hapus User</button>
            <button onClick={onTambahGrup} className="gf-3d bg-gf-menubar px-3 py-[3px] text-[11px] font-bold">Tambah Grup</button>
            <button onClick={onKoreksiGrup} className="gf-3d bg-gf-menubar px-3 py-[3px] text-[11px]">Koreksi Grup</button>
            <button onClick={onHapusGrup} className="gf-3d bg-gf-menubar px-3 py-[3px] text-[11px]">Hapus Grup</button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d ml-auto w-[300px] bg-gf-menubar py-[3px] text-[12px]">Tutup</button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && !err && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}

          <div className="mb-1 text-[11px] font-bold">User ({users.length})</div>
          <div className="max-h-[240px] overflow-auto border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-gf-menubar">
                {["ID", "Group", "User", "Pemilik", "Sales", "User Pusat", "PC/Komputer", "IP", "Terakhir Login", "Pass"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {users.map((r) => (
                  <tr key={r.id} onClick={() => { setUserSel(r.id); setGrupSel(null); }} className={`cursor-pointer ${userSel === r.id ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className={td}>{r.id}</td>
                    <td className={td}>{r.grupNama ?? r.securiId ?? ""}</td>
                    <td className={td}>{r.user}</td>
                    <td className={td}>{r.pemilik}</td>
                    <td className={td}>{r.sales ?? ""}</td>
                    <td className={td}>{r.userpusat ? "✔" : ""}</td>
                    <td className={td}>{r.workstat ?? ""}</td>
                    <td className={td}>{r.ip ?? ""}</td>
                    <td className={td}>{r.loginTgl ? `${r.loginTgl} ${r.loginJam ?? ""}` : ""}</td>
                    <td className={td}>{r.hasPassword ? "•••" : ""}</td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={10} className="px-2 py-3 text-center text-gf-muted">Belum ada user.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="mb-1 mt-2 text-[11px] font-bold">Group ({grups.length})</div>
          <div className="max-h-[220px] overflow-auto border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-gf-menubar">
                {["ID", "Group", "Pemilik", "Jml User", "Security (akses menu)"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {grups.map((r) => (
                  <tr key={r.id} onClick={() => { setGrupSel(r.id); setUserSel(null); }} className={`cursor-pointer ${grupSel === r.id ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className={td}>{r.id}</td>
                    <td className={td}>{r.nama}</td>
                    <td className={td}>{r.pemilik}</td>
                    <td className={`${td} text-right`}>{r.jumlahUser}</td>
                    <td className={`${td} text-gf-muted`}>{r.securityInfo ?? "(menu-matrix biner GF)"}</td>
                  </tr>
                ))}
                {grups.length === 0 && <tr><td colSpan={5} className="px-2 py-3 text-center text-gf-muted">Belum ada grup.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[10px] text-gf-muted">Relasi: s_secusr.securi_id → s_securi.id · akses menu grup = bitmap/`secfile001-030` (read-only, format internal GF)</div>
        </div>
      </div>

      {uForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-3">
          <div className="w-[700px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">User Profile — {uMode === "create" ? "Tambah" : `Koreksi #${uForm.id}`}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setUForm(null)}>✕</button>
            </div>
            <div className="grid grid-cols-[110px_1fr_110px_1fr] items-center gap-x-2 gap-y-1 p-3 text-[12px]">
              <span>User :</span><input className="gf-3d bg-white px-2 py-[2px]" value={jev(uForm.user)} onChange={(e) => setU({ user: e.target.value })} />
              <span className="text-right">ID :</span><input className="gf-3d bg-[#c8f0c8] px-2 py-[2px]" readOnly value={uMode === "edit" ? uForm.id : "(auto)"} />
              <span>Group :</span>
              <select className="gf-3d bg-white px-1 py-[2px]" value={uForm.securiId ?? ""} onChange={(e) => setU({ securiId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">--</option>{grups.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
              </select>
              <span className="text-right">Sales :</span><input className="gf-3d w-[80px] bg-white px-2 py-[2px]" value={uForm.sales ?? ""} onChange={(e) => setU({ sales: e.target.value ? Number(e.target.value) : null })} />
              <span>Pemilik :</span><input className="gf-3d bg-white px-2 py-[2px]" value={jev(uForm.pemilik)} onChange={(e) => setU({ pemilik: e.target.value })} />
              <span className="text-right">Password :</span>
              <input type="password" className="gf-3d bg-white px-2 py-[2px]" value={uPass} onChange={(e) => setUPass(e.target.value)} placeholder={uForm.hasPassword ? "(biarkan kosong = tidak ganti)" : ""} />
              <span>PC/Komputer :</span><input className="gf-3d bg-white px-2 py-[2px]" value={jev(uForm.workstat)} onChange={(e) => setU({ workstat: e.target.value })} />
              <span className="text-right">IP :</span><input className="gf-3d bg-white px-2 py-[2px]" value={jev(uForm.ip)} onChange={(e) => setU({ ip: e.target.value })} />
              <span>User Pusat :</span>
              <label className="col-span-3 flex items-center gap-1"><input type="checkbox" checked={uForm.userpusat ?? false} onChange={(e) => setU({ userpusat: e.target.checked })} /> (boleh login dari komputer pusat)</label>
            </div>
            <div className="flex gap-1 border-t border-gf-border p-2">
              <button onClick={onSimpanUser} className="gf-3d w-1/2 bg-gf-menubar py-[3px] text-[13px]">Simpan</button>
              <button onClick={() => setUForm(null)} className="gf-3d w-1/2 bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {gForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-3">
          <div className="w-[1050px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Security - Group {gMode === "edit" ? `#${gForm.id}` : "[Baru]"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setGForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-[110px_1fr_110px_1fr] items-center gap-x-2 gap-y-1 text-[12px]">
                <span>Group User :</span><input className="gf-3d bg-white px-2 py-[2px]" value={jev(gForm.nama)} onChange={(e) => setG({ nama: e.target.value })} />
                <span className="text-right">ID :</span><input className="gf-3d bg-[#c8f0c8] px-2 py-[2px]" readOnly value={gMode === "edit" ? gForm.id : "(auto)"} />
                <span>Pemilik :</span><input className="gf-3d bg-white px-2 py-[2px]" value={jev(gForm.pemilik)} onChange={(e) => setG({ pemilik: e.target.value })} />
                <span className="text-right">Security :</span><input className="gf-3d bg-[#f4f4f4] px-2 py-[2px] text-gf-muted" readOnly value={gForm.securityInfo ?? "(belum ada — matriks menu biner GF)"} />
              </div>
              <div className="mt-2 border border-gf-border bg-white">
                <div className="border-b border-gf-border bg-gf-menubar px-1 text-[11px] font-bold">Menu Utama | Menu | Visible | Akses | Extra *1..*10</div>
                <div className="p-2 text-[11px] text-gf-muted">
                  Matriks akses menu disimpan GF sebagai bitmap biner (kolom security/security2/securityex + secfile001..030).
                  Kloning menampilkan info ukuran bitmap; editor matriks 1:1 = pass lanjutan (format internal GF, tidak dibongkar agar tidak korup).
                </div>
              </div>
              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
              <div className="mt-2 flex gap-1 border-t border-gf-border pt-2">
                <button onClick={onSimpanGrup} className="gf-3d w-1/2 bg-gf-menubar py-[3px] text-[13px]">Simpan</button>
                <button onClick={() => setGForm(null)} className="gf-3d w-1/2 bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
