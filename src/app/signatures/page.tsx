"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, query, orderBy, onSnapshot, deleteDoc, doc 
} from "firebase/firestore";
import { 
  PenTool, Trash2, RefreshCw, AlertCircle, CheckCircle2, User 
} from "lucide-react";

interface GuestSignature {
  id: string;
  name: string;
  message: string;
  createdAt: any;
}

export default function SignaturesManager() {
  const [signatures, setSignatures] = useState<GuestSignature[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Live fetch guestbook signatures
  useEffect(() => {
    setLoading(true);
    const qSig = query(collection(db, "signatures"), orderBy("createdAt", "desc"));
    
    const unsubSig = onSnapshot(qSig, (snapshot) => {
      const list: GuestSignature[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() as any });
      });
      setSignatures(list);
      setLoading(false);
    }, (e) => {
      console.error("Signatures fetch error:", e);
      setErrorMsg("Failed to check signatures ledger.");
      setLoading(false);
    });

    return () => unsubSig();
  }, []);

  const handleDeleteSignature = async (id: string) => {
    if (!window.confirm("Are you sure you want to moderate and wipe this visitor signature?")) {
      return;
    }
    
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      await deleteDoc(doc(db, "signatures", id));
      setSuccessMsg("Visitor signature successfully moderated!");
      setTimeout(() => setSuccessMsg(""), 2000);
    } catch (e) {
      setErrorMsg("Failed to delete guest signature.");
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Registry Guestbook Manager</h1>
        <p className="text-zinc-400 italic text-sm mt-1">
          Review and moderate signed notebook messages from visitors.
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

      {/* Signature Ledger Table / Grid */}
      <div className="bg-[#121212] border border-zinc-850 p-6 rounded-2xl space-y-6">
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 pb-2 border-b border-zinc-800">
          <PenTool className="w-5 h-5 text-amber-500" />
          Live Signature Book
        </h2>

        {loading ? (
          <div className="text-center py-16">
            <RefreshCw className="w-8 h-8 text-amber-500 mx-auto animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-3 animate-pulse">Relieving signature ledgers...</p>
          </div>
        ) : signatures.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-850 rounded-xl bg-zinc-950/30">
            <PenTool className="w-12 h-12 text-zinc-755 mx-auto mb-2" />
            <p className="font-bold text-zinc-400 text-sm italic">The visitor book is clean! No signatures found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-1">
            {signatures.map((sig) => (
              <div 
                key={sig.id}
                className="bg-zinc-950 border border-zinc-850 p-5 rounded-xl flex flex-col justify-between relative hover:border-zinc-800 transition-all space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-zinc-400 pb-1.5 border-b border-zinc-900">
                    <User className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider truncate max-w-[150px]">
                      {sig.name}
                    </span>
                  </div>
                  
                  <p className="text-xs text-zinc-300 leading-relaxed italic bg-zinc-900/40 p-3 rounded-lg border border-zinc-900 select-text">
                    "{sig.message}"
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteSignature(sig.id)}
                  className="w-full py-2 bg-red-950/40 hover:bg-red-950 hover:text-white border border-red-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest text-red-400 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Moderate Signature ✂
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
