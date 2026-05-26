"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, doc, setDoc, deleteDoc, addDoc } from "firebase/firestore";
import { 
  Bell, Plus, Trash2, RefreshCw, X, Tag, Megaphone, Send, Calendar
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  content: string;
  tag: string;
  createdAt: any;
}

export default function NotificationsStudio() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("Notice");
  const [content, setContent] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "hype_board"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(list);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return alert("Title and Content are required!");

    setSaving(true);
    try {
      await addDoc(collection(db, "hype_board"), {
        title,
        tag,
        content,
        createdAt: new Date(),
      });

      alert("Notification broadcasted successfully!");
      setTitle("");
      setContent("");
      setTag("Notice");
      setIsCreating(false);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to post notification:", err);
      alert("Error broadcasting notification.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this notification? It will be removed from all user feeds instantly.")) {
      try {
        await deleteDoc(doc(db, "hype_board", id));
        fetchNotifications();
      } catch (err) {
        console.error("Failed to delete notification:", err);
        alert("Failed to delete.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-amber-500 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Broadcast Center...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-amber-500" />
            <span>Notification Studio</span>
          </h1>
          <p className="text-zinc-400 italic text-sm mt-1">
            "Draft announcements, tag priority, and push live system broadcast alerts to all student dashboards."
          </p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-amber-600 text-stone-950 px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-amber-500 transition-colors"
          >
            <Plus size={16} /> Broadcast New Alert
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handlePostNotification} className="bg-[#121212] border border-zinc-850 rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
            <h2 className="text-xl font-bold text-zinc-100">Compose Broadcast Notice</h2>
            <button type="button" onClick={() => setIsCreating(false)} className="text-zinc-500 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Notice Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                  placeholder="e.g. Color Auction Draft Closed!"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Notice Body Content</label>
                <textarea 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none resize-none h-32"
                  placeholder="Details of the announcement..."
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Tag size={12} /> Priority/Tag Label
                </label>
                <select 
                  value={tag} 
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none cursor-pointer"
                >
                  <option value="Notice">Notice</option>
                  <option value="Event">Event</option>
                  <option value="Urgent">⚠️ Urgent</option>
                  <option value="Game Desk">🎮 Game Desk</option>
                  <option value="Update">Update</option>
                </select>
              </div>

              <div className="bg-zinc-900 border border-zinc-850 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Instant Live Feed Alerts</h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Broadcasting this notice will instantly push it to the main dashboard notification bars of all active students and faculty, as well as popup a live notification window.
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-zinc-800 pt-6 flex justify-end">
            <button 
              type="submit"
              disabled={saving}
              className="bg-amber-600 text-stone-950 px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-amber-500 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
              {saving ? "Broadcasting..." : "Broadcast Live"}
            </button>
          </div>
        </form>
      )}

      {/* Broadcast Ledger List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold tracking-tight text-zinc-300">Live Broadcast Archives</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notifications.map((notice) => (
            <div key={notice.id} className="bg-[#121212] border border-zinc-850 hover:border-zinc-800 transition-all rounded-2xl p-6 relative group flex flex-col justify-between">
              <button 
                onClick={() => handleDelete(notice.id)}
                className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded-lg"
              >
                <Trash2 size={16} />
              </button>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 px-3 py-1 rounded-md border border-amber-500/20">
                    {notice.tag}
                  </span>
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                    <Calendar size={12} />
                    {notice.createdAt?.toDate ? new Date(notice.createdAt.toDate()).toLocaleDateString() : "Just now"}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-zinc-100 group-hover:text-amber-500 transition-colors">
                  {notice.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {notice.content}
                </p>
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="col-span-2 bg-[#121212] border border-zinc-850 rounded-2xl p-12 text-center text-zinc-500 italic">
              <Bell className="mx-auto w-12 h-12 text-zinc-700 mb-3" />
              No announcements broadcasted yet. Create one to begin.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
