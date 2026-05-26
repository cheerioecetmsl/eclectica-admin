"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, doc, deleteDoc } from "firebase/firestore";
import { Image as ImageIcon, Video, Loader2, Trash2, Maximize2, AlertTriangle, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ArchiveMedia {
  id: string;
  type: "image" | "video";
  url: string;
  baseId?: string; // Cloudinary public_id
  thumbnail?: string;
  event: string;
  uploadedBy: string;
  createdAt: any;
  strikes?: number;
  duration?: string;
  sizeMB?: string;
}

export default function ArchivesModerationPage() {
  const [media, setMedia] = useState<ArchiveMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchArchives = async () => {
    try {
      const q = query(collection(db, "archives"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArchiveMedia));
      setMedia(list);
    } catch (err) {
      console.error("Error fetching archives:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  const handleDelete = async (id: string, type: string) => {
    if (confirm(`Are you sure you want to permanently delete this ${type} from the database? This action cannot be undone.`)) {
      setDeletingId(id);
      try {
        await deleteDoc(doc(db, "archives", id));
        setMedia(media.filter(m => m.id !== id));
      } catch (err) {
        console.error("Error deleting archive:", err);
        alert("Failed to delete archive.");
      } finally {
        setDeletingId(null);
      }
    }
  };

  const filteredMedia = media.filter(m => filter === "all" || m.type === filter);
  
  const imageCount = media.filter(m => m.type === "image").length;
  const videoCount = media.filter(m => m.type === "video").length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-amber-500 font-bold tracking-widest uppercase text-xs animate-pulse">Scanning Archive Database...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-amber-500" />
            <span>Archive Moderation</span>
          </h1>
          <p className="text-zinc-400 italic text-sm mt-1">
            "Review and moderate user-submitted memories."
          </p>
        </div>
        
        <div className="flex gap-2 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          <button 
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${filter === "all" ? "bg-amber-500 text-[#0A0A0A]" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            All ({media.length})
          </button>
          <button 
            onClick={() => setFilter("image")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${filter === "image" ? "bg-amber-500 text-[#0A0A0A]" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <ImageIcon size={14} /> Images ({imageCount})
          </button>
          <button 
            onClick={() => setFilter("video")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${filter === "video" ? "bg-amber-500 text-[#0A0A0A]" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <Video size={14} /> Videos ({videoCount})
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredMedia.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
          <AlertTriangle className="w-12 h-12 text-zinc-600 mb-4" />
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">No archives found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedia.map((item) => (
            <div key={item.id} className="bg-[#121212] border border-zinc-850 rounded-2xl overflow-hidden flex flex-col group hover:border-amber-500/30 transition-colors">
              
              {/* Media Preview */}
              <div className="relative aspect-square bg-zinc-900 border-b border-zinc-850 overflow-hidden">
                {item.type === "image" ? (
                  <img src={item.url} alt="Archive" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <>
                    <img src={item.thumbnail || item.url.replace('.mp4', '.jpg')} alt="Video Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center border border-white/10">
                        <Video className="text-white w-5 h-5" />
                      </div>
                    </div>
                  </>
                )}
                
                {/* Overlay Badges */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className="bg-black/80 backdrop-blur-sm text-zinc-300 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border border-white/10">
                    {item.type}
                  </span>
                  {item.strikes && item.strikes > 0 ? (
                    <span className="bg-red-500/80 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md flex items-center gap-1">
                      <AlertTriangle size={10} /> {item.strikes} Strikes
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Meta Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Uploaded by</p>
                  <p className="text-sm font-bold text-zinc-200 truncate">{item.uploadedBy || "Unknown Archivist"}</p>
                  
                  <div className="mt-3 space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest truncate">
                      Event: <span className="text-amber-500">{item.event || "Uncategorized"}</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                      Date: <span className="text-zinc-400">{item.createdAt ? formatDistanceToNow(item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt), { addSuffix: true }) : "Unknown"}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-zinc-800/50">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-2 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl transition-colors text-[10px] font-bold uppercase tracking-widest"
                  >
                    <ExternalLink size={14} /> View
                  </a>
                  <button 
                    onClick={() => handleDelete(item.id, item.type)}
                    disabled={deletingId === item.id}
                    className="p-2 bg-zinc-900 hover:bg-red-900/30 text-zinc-600 hover:text-red-500 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {deletingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
