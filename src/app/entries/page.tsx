"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from "firebase/firestore";
import { CheckCircle, XCircle, Search, Trophy, Loader2, AlertCircle } from "lucide-react";

interface Entry {
  id: string;
  url: string;
  userId: string;
  userName: string;
  status: string;
  createdAt: string;
}

export default function EntriesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [userEntriesCount, setUserEntriesCount] = useState(0);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(1);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const q = query(
        collection(db, "archives"),
        where("isEntry", "==", true)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Entry));
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEntries(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (entryId: string, status: "approved" | "rejected") => {
    try {
      await updateDoc(doc(db, "archives", entryId), {
        status,
        isPublic: status === "approved"
      });
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status } : e));
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const searchUser = async () => {
    if (!searchQuery.trim()) return;
    setUserSearchLoading(true);
    try {
      // Search by displayName or email
      let q = query(collection(db, "users"), where("displayName", "==", searchQuery));
      let snap = await getDocs(q);
      
      if (snap.empty) {
        q = query(collection(db, "users"), where("email", "==", searchQuery));
        snap = await getDocs(q);
      }

      if (snap.empty) {
        setSearchedUser(null);
        alert("User not found");
      } else {
        const udoc = snap.docs[0];
        setSearchedUser({ id: udoc.id, ...udoc.data() });
        
        // Fetch their entry count
        const eq = query(collection(db, "archives"), where("userId", "==", udoc.id), where("isEntry", "==", true));
        const esnap = await getDocs(eq);
        setUserEntriesCount(esnap.size);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUserSearchLoading(false);
    }
  };

  const grantBonusEntries = async () => {
    if (!searchedUser) return;
    try {
      const newLimit = (searchedUser.entryLimit || 5) + bonusAmount;
      await updateDoc(doc(db, "users", searchedUser.id), {
        entryLimit: newLimit
      });
      setSearchedUser({ ...searchedUser, entryLimit: newLimit });
      alert(`Granted! New limit is ${newLimit}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update limit");
    }
  };

  const pendingEntries = entries.filter(e => e.status === "pending" || !e.status);
  const reviewedEntries = entries.filter(e => e.status !== "pending" && e.status);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Trophy className="text-amber-500" /> Competition Entries
        </h1>
        <p className="text-zinc-400 mt-2">Approve or reject submissions for Chase The Colours</p>
      </div>

      {/* User Limit Management */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-6">
        <h2 className="text-xl font-bold text-white">Manage User Entry Limits</h2>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Search user by exact name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
            onKeyDown={e => e.key === "Enter" && searchUser()}
          />
          <button 
            onClick={searchUser}
            disabled={userSearchLoading}
            className="bg-amber-500 text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-amber-400 transition-colors flex items-center gap-2"
          >
            {userSearchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Search
          </button>
        </div>

        {searchedUser && (
          <div className="bg-black border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-lg">{searchedUser.displayName}</p>
              <p className="text-zinc-500 text-sm">{searchedUser.email}</p>
              <div className="flex gap-4 mt-2">
                <span className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded text-xs font-bold uppercase">Limit: {searchedUser.entryLimit || 5}</span>
                <span className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded text-xs font-bold uppercase border border-blue-900/50">Used: {userEntriesCount}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                min={1} 
                max={10} 
                value={bonusAmount} 
                onChange={e => setBonusAmount(parseInt(e.target.value) || 1)}
                className="w-20 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white text-center"
              />
              <button 
                onClick={grantBonusEntries}
                className="bg-green-600 text-white px-4 py-2 rounded font-bold uppercase tracking-widest hover:bg-green-500 text-sm"
              >
                Grant Bonus Entries
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending Entries */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertCircle className="text-amber-500" /> Needs Review ({pendingEntries.length})
        </h2>
        {pendingEntries.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/30 border border-zinc-800 rounded-2xl text-zinc-500">
            No pending entries.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pendingEntries.map(entry => (
              <div key={entry.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
                <div className="aspect-square bg-black relative">
                  <img src={entry.url} alt="Entry" className="w-full h-full object-contain" />
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-white font-bold truncate">{entry.userName}</p>
                    <p className="text-zinc-500 text-xs">{new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateStatus(entry.id, "approved")}
                      className="flex-1 bg-green-900/30 text-green-500 hover:bg-green-900/50 border border-green-900/50 py-2 rounded flex items-center justify-center gap-2 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(entry.id, "rejected")}
                      className="flex-1 bg-red-900/30 text-red-500 hover:bg-red-900/50 border border-red-900/50 py-2 rounded flex items-center justify-center gap-2 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviewed Entries */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Recently Reviewed</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {reviewedEntries.slice(0, 12).map(entry => (
            <div key={entry.id} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-800 group">
              <img src={entry.url} alt="Entry" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-2 right-2">
                {entry.status === "approved" ? (
                  <div className="bg-green-500 text-black px-2 py-1 rounded text-[10px] font-bold uppercase">Approved</div>
                ) : (
                  <div className="bg-red-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase">Rejected</div>
                )}
              </div>
              <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-white text-xs truncate">{entry.userName}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
