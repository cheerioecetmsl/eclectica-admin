"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { Users, Loader2, Trash2, ShieldAlert, CheckCircle2, TrendingUp, Edit2, X, Save, Search, Tag, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Archivist {
  id: string;
  name: string;
  email: string;
  xp: number;
  photoURL: string;
  presence: string;
  lastSeen: any;
  status: string;
  // Full profile fields
  year: string;
  section: string;
  role: string;
  narrative: string;
  univRollNo: string;
  gender: string;
  category: string;
  tags: string[];
  photoCount: number;
}

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Faculty"];
const SECTION_OPTIONS = ["A", "B", "C", "D", "E", "F", "N/A"];
const GENDER_OPTIONS = ["Sir", "Madam", ""];
const CATEGORY_OPTIONS = ["STUDENT", "LEGEND", "FACULTY"];
const STATUS_OPTIONS = ["approved", "pending", "banned"];

export default function UsersManagementPage() {
  const [users, setUsers] = useState<Archivist[]>([]);
  const [filtered, setFiltered] = useState<Archivist[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<Archivist | null>(null);
  const [editForm, setEditForm] = useState<Archivist | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [search, setSearch] = useState("");
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || data.displayName || "Unknown",
          email: data.email || "",
          xp: data.xp || 0,
          photoURL: data.photoURL || "",
          presence: data.presence || "offline",
          lastSeen: data.lastSeen,
          status: data.status || "approved",
          year: data.year || "",
          section: data.section || "",
          role: data.role || "",
          narrative: data.narrative || "",
          univRollNo: data.univRollNo || "",
          gender: data.gender || "",
          category: data.category || "STUDENT",
          tags: data.tags || [],
          photoCount: data.photoCount || 0,
        } as Archivist;
      }).sort((a, b) => b.xp - a.xp);
      setUsers(list);
      setFiltered(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      users.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.year.toLowerCase().includes(q) ||
        u.section.toLowerCase().includes(q)
      )
    );
  }, [search, users]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently remove ${name}? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "users", id));
    } catch (err) {
      alert("Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (user: Archivist) => {
    setEditingUser(user);
    setEditForm({ ...user });
    setTagInput("");
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || !editForm) return;
    if (!editForm.tags.includes(t) && editForm.tags.length < 10) {
      setEditForm({ ...editForm, tags: [...editForm.tags, t] });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    if (!editForm) return;
    setEditForm({ ...editForm, tags: editForm.tags.filter(t => t !== tag) });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editForm) return;
    setSavingEdit(true);
    try {
      const updates = {
        name: editForm.name,
        email: editForm.email,
        xp: Number(editForm.xp) || 0,
        status: editForm.status,
        year: editForm.year,
        section: editForm.section,
        role: editForm.role,
        narrative: editForm.narrative,
        univRollNo: editForm.univRollNo,
        gender: editForm.gender,
        category: editForm.category,
        tags: editForm.tags,
      };
      await updateDoc(doc(db, "users", editingUser.id), updates);
      setEditingUser(null);
    } catch (err) {
      alert("Failed to save changes.");
    } finally {
      setSavingEdit(false);
    }
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );

  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
    />
  );

  const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) => (
    <select
      {...props}
      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors appearance-none"
    />
  );

  const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
      {...props}
      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
    />
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-amber-500 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Archivist Ledger...</p>
      </div>
    );
  }

  const onlineCount = users.filter(u => u.presence === "online").length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-500" />
            <span>Archivists &amp; Leaderboard</span>
          </h1>
          <p className="text-zinc-400 italic text-sm mt-1">Full profile editing — every field, every detail.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Total XP Pool</p>
              <p className="text-sm font-bold text-zinc-200">{users.reduce((a, u) => a + u.xp, 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Active Pulse</p>
              <p className="text-sm font-bold text-zinc-200">{onlineCount} Online</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
            <Users className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Total Members</p>
              <p className="text-sm font-bold text-zinc-200">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search by name, email, year, section..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#121212] border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/50 text-zinc-400 uppercase tracking-widest text-[10px] font-bold border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Archivist</th>
                <th className="px-6 py-4">Year / Section</th>
                <th className="px-6 py-4">Role / Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">XP</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.map((user, i) => (
                <tr key={user.id} className="hover:bg-zinc-900/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-zinc-500 font-bold">#{i + 1}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-amber-500/50 text-lg">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        {user.presence === "online" && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#121212] rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-200 truncate max-w-[180px]">{user.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate max-w-[180px]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-zinc-300 text-xs font-bold">{user.year || "—"}</p>
                    <p className="text-zinc-500 text-[10px]">Section {user.section || "—"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-zinc-300 text-xs font-bold truncate max-w-[140px]">{user.role || "—"}</p>
                    <p className="text-zinc-500 text-[10px]">{user.category}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                      user.status === "approved" ? "bg-green-500/10 text-green-500" :
                      user.status === "banned" ? "bg-red-500/10 text-red-500" :
                      "bg-amber-500/10 text-amber-500"
                    }`}>
                      <CheckCircle2 size={10} />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-bold font-mono text-amber-500">{user.xp.toLocaleString()}</p>
                    <p className="text-[10px] text-zinc-500">{user.photoCount} photos</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(user)}
                        title="Edit all details"
                        className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={deletingId === user.id}
                        title="Remove user"
                        className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === user.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 italic">
                    No archivists match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Edit Modal */}
      {editingUser && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#111] p-6 border-b border-zinc-800 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                {editForm.photoURL && <img src={editForm.photoURL} className="w-10 h-10 rounded-full object-cover border border-zinc-700" />}
                <div>
                  <h2 className="text-lg font-bold text-white">Editing: {editingUser.name}</h2>
                  <p className="text-zinc-500 text-xs">{editingUser.email}</p>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-2 text-zinc-500 hover:text-white rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-6">

              {/* Identity */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Identity</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Display Name">
                    <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
                  </Field>
                  <Field label="Email">
                    <Input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Gender">
                    <Select value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })}>
                      <option value="">Not set</option>
                      {GENDER_OPTIONS.filter(g => g).map(g => <option key={g} value={g}>{g}</option>)}
                    </Select>
                  </Field>
                  <Field label="Category">
                    <Select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                      {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </Field>
                  <Field label="Status">
                    <Select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </Field>
                </div>
              </section>

              {/* Academic */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Academic</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Year of Study">
                    <Select value={editForm.year} onChange={e => setEditForm({ ...editForm, year: e.target.value })}>
                      <option value="">Select Year</option>
                      {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                    </Select>
                  </Field>
                  <Field label="Section">
                    <Select value={editForm.section} onChange={e => setEditForm({ ...editForm, section: e.target.value })}>
                      <option value="">Select</option>
                      {SECTION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </Field>
                  <Field label="Wing/Sub Club">
                    <Input value={editForm.univRollNo} onChange={e => setEditForm({ ...editForm, univRollNo: e.target.value })} placeholder="Moksha, Opinionists, Content, etc" />
                  </Field>
                </div>
              </section>

              {/* Profile */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Profile</h3>
                <Field label="Role / Title (e.g. 'Coder', 'The Quiet One')">
                  <Input value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} placeholder="e.g. The Archivist" />
                </Field>
                <Field label="Brief / Narrative">
                  <Textarea
                    value={editForm.narrative}
                    onChange={e => setEditForm({ ...editForm, narrative: e.target.value })}
                    rows={4}
                    placeholder="Their personal statement..."
                  />
                </Field>
              </section>

              {/* Tags */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Hashtags / Tags</h3>
                <div className="flex flex-wrap gap-2 min-h-[32px]">
                  {editForm.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1.5 bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-xs font-bold">
                      #{tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-zinc-500 hover:text-red-400 transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {editForm.tags.length === 0 && <p className="text-zinc-600 text-xs italic">No tags yet.</p>}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); }}}
                    placeholder="Add a tag and press Enter"
                  />
                  <button type="button" onClick={addTag} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap">
                    <Tag size={14} /> Add
                  </button>
                </div>
              </section>

              {/* XP */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Total XP (no cap)">
                    <Input type="number" min={0} value={editForm.xp} onChange={e => setEditForm({ ...editForm, xp: parseInt(e.target.value) || 0 })} />
                  </Field>
                  <Field label="Photo Count">
                    <Input type="number" min={0} value={editForm.photoCount} onChange={e => setEditForm({ ...editForm, photoCount: parseInt(e.target.value) || 0 })} />
                  </Field>
                </div>
              </section>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={savingEdit} className="flex-1 px-4 py-3 bg-amber-500 text-black rounded-xl hover:bg-amber-400 transition-colors font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {savingEdit ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {savingEdit ? "Saving..." : "Save All Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
