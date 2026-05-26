"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, query, orderBy, onSnapshot, deleteDoc, doc 
} from "firebase/firestore";
import { 
  MessageSquare, Trash2, RefreshCw, AlertCircle, CheckCircle2, User, Eye, Play
} from "lucide-react";

interface ConfessionItem {
  id: string;
  recipientId: string;
  recipientName?: string;
  senderId: string;
  senderName?: string;
  text: string;
  mediaUrl: string | null;
  mediaType: "image" | "video" | null;
  timestamp: any;
}

export default function ConfessionsDesk() {
  const [confessions, setConfessions] = useState<ConfessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Live fetch event_confessions
  useEffect(() => {
    setLoading(true);
    const qConf = query(collection(db, "event_confessions"), orderBy("timestamp", "desc"));
    
    const unsubConf = onSnapshot(qConf, (snapshot) => {
      const list: ConfessionItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() as any });
      });
      setConfessions(list);
      setLoading(false);
    }, (e) => {
      console.error("Confessions fetch error:", e);
      setErrorMsg("Failed to synchronize confessions desk.");
      setLoading(false);
    });

    return () => unsubConf();
  }, []);

  const handleDeleteConfession = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this confession from the ledger?")) {
      return;
    }
    
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      await deleteDoc(doc(db, "event_confessions", id));
      setSuccessMsg("Confession successfully moderated and deleted!");
      setTimeout(() => setSuccessMsg(""), 2000);
    } catch (e) {
      setErrorMsg("Failed to moderate confession.");
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Confessions Audit Desk</h1>
        <p className="text-zinc-400 italic text-sm mt-1">
          Confessions sent inside "Yeh To Dhoti Khol Raha Hai" are anonymous for users, but audited here for administrative transparency and safety.
        </p>
      </div>

      {/* Feedback banner */}
      {(successMsg || errorMsg) && (
        <div className="animate-fade-in">
          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="bg-red-950/40 border border-red-500/30 text-red-400 p-4 rounded-xl font-bold text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              {errorMsg}
            </div>
          )}
        </div>
      )}

      {/* Confession Ledger Table */}
      <div className="bg-[#121212] border border-zinc-850 p-6 rounded-2xl space-y-6">
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 pb-2 border-b border-zinc-800">
          <MessageSquare className="w-5 h-5 text-amber-500" />
          Active Confessions registry
        </h2>

        {loading ? (
          <div className="text-center py-16">
            <RefreshCw className="w-8 h-8 text-amber-500 mx-auto animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-3 animate-pulse">Gathering dynamic ledger lines...</p>
          </div>
        ) : confessions.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-850 rounded-xl bg-zinc-950/30">
            <MessageSquare className="w-12 h-12 text-zinc-755 mx-auto mb-2" />
            <p className="font-bold text-zinc-400 text-sm italic">The confession registry is clean! No messages found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-4 px-4">From (Sender)</th>
                  <th className="py-4 px-4">To (Recipient)</th>
                  <th className="py-4 px-4">Confession Text</th>
                  <th className="py-4 px-4">Attachment / Media</th>
                  <th className="py-4 px-4">Timestamp</th>
                  <th className="py-4 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {confessions.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-950/35 transition-colors">
                    <td className="py-4 px-4 font-mono">
                      <div className="font-bold text-amber-500">{item.senderName || "Unknown"}</div>
                      <div className="text-[10px] text-zinc-550 mt-0.5">{item.senderId}</div>
                    </td>
                    <td className="py-4 px-4 font-mono">
                      <div className="font-bold text-zinc-100">{item.recipientName || "Unknown"}</div>
                      <div className="text-[10px] text-zinc-550 mt-0.5">{item.recipientId}</div>
                    </td>
                    <td className="py-4 px-4 max-w-xs leading-relaxed break-words font-sans">
                      <span className="italic text-zinc-200">"{item.text}"</span>
                    </td>
                    <td className="py-4 px-4">
                      {item.mediaUrl ? (
                        <div className="flex items-center gap-2">
                          {item.mediaType === "video" ? (
                            <a 
                              href={item.mediaUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 flex items-center gap-1 font-bold text-[10px]"
                            >
                              <Play size={10} className="fill-current text-amber-500" /> View Video
                            </a>
                          ) : (
                            <a 
                              href={item.mediaUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 flex items-center gap-1 font-bold text-[10px]"
                            >
                              <Eye size={10} className="text-amber-500" /> Preview Image
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-600 italic">None</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-zinc-400">
                      {item.timestamp?.toDate ? new Date(item.timestamp.toDate()).toLocaleString() : "Just now"}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleDeleteConfession(item.id)}
                        className="p-2 hover:bg-red-950/80 hover:text-red-400 rounded-lg text-zinc-550 hover:border-red-500/20 transition-all cursor-pointer"
                        title="Moderate and delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
