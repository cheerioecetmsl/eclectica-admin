"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, query, onSnapshot, doc, orderBy, limit 
} from "firebase/firestore";
import { 
  LayoutDashboard, ImageIcon, PenTool, Database, Sparkles, 
  ArrowRight, Video, Settings, Calendar, Users
} from "lucide-react";
import Link from "next/link";

interface GuestSignature {
  id: string;
  name: string;
  message: string;
  createdAt: any;
}

interface PhotoMemory {
  id: string;
  url: string;
  title: string;
  caption: string;
}

export default function OverviewPage() {
  const [albumTitle, setAlbumTitle] = useState("Our Hand-Sketched Scrapbook");
  const [coverClass, setCoverClass] = useState("Class of 2026");
  const [introVideoUrl, setIntroVideoUrl] = useState("");
  const [signatures, setSignatures] = useState<GuestSignature[]>([]);
  const [memories, setMemories] = useState<PhotoMemory[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Load live Firestore metrics
  useEffect(() => {
    // 1. Fetch Album settings
    const unsubSettings = onSnapshot(doc(db, "settings", "album"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAlbumTitle(data.title || "Our Hand-Sketched Scrapbook");
        setCoverClass(data.coverClass || "Class of 2026");
        setIntroVideoUrl(data.introVideoUrl || "");
      }
    });

    // 2. Fetch live guestbook logs (limited to 5 for recent panel)
    const qSig = query(collection(db, "signatures"), orderBy("createdAt", "desc"), limit(5));
    const unsubSig = onSnapshot(qSig, (snap) => {
      const list: GuestSignature[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() as any });
      });
      setSignatures(list);
    });

    return () => {
      unsubSettings();
      unsubSig();
    };
  }, []);

  // Fetch memories dynamically based on current coverClass
  useEffect(() => {
    if (coverClass) {
      setMetricsLoading(true);
      const sanitizedBatch = coverClass.toLowerCase().replace(/[^a-z0-9]/g, "_") || "class_of_2026";
      const collectionName = `memories_${sanitizedBatch}`;
      const qMem = query(collection(db, collectionName), orderBy("createdAt", "desc"), limit(4));
      
      const unsubMem = onSnapshot(qMem, (snap) => {
        const list: PhotoMemory[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() as any });
        });
        setMemories(list);
        setMetricsLoading(false);
      }, (e) => {
        console.error("Memories overview load error:", e);
        setMetricsLoading(false);
      });

      return () => unsubMem();
    }
  }, [coverClass]);

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-amber-500" />
            <span>Command Center Overview</span>
          </h1>
          <p className="text-zinc-400 italic text-sm mt-1">
            "The yearbook ledger is live. Every heartbeat of the archive is accounted for."
          </p>
        </div>
        
        {/* Dynamic Sync indicator */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Firestore Connected</span>
        </div>
      </div>

      {/* Metrics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Memory pages widget */}
        <div className="bg-[#121212] border border-zinc-850 p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-amber-500/20 transition-all duration-300">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-widest">Polaroid Pages</span>
            <ImageIcon className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <span className="text-4xl font-extrabold text-zinc-100 font-mono">
              {metricsLoading ? "..." : memories.length}
            </span>
            <span className="block text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-wider">
              {coverClass} Batch collection
            </span>
          </div>
        </div>

        {/* Guestbook entries widget */}
        <div className="bg-[#121212] border border-zinc-850 p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-amber-500/20 transition-all duration-300">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-widest">Signatures Logs</span>
            <PenTool className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <span className="text-4xl font-extrabold text-zinc-100 font-mono">
              {signatures.length}
            </span>
            <span className="block text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-wider">
              Guest messages
            </span>
          </div>
        </div>

        {/* Active Grad cohort */}
        <div className="bg-[#121212] border border-zinc-850 p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-amber-500/20 transition-all duration-300">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-widest">Grad Cohort</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-amber-450 uppercase tracking-tight">
              {coverClass}
            </span>
            <span className="block text-[10px] text-zinc-500 font-bold uppercase mt-1.5 tracking-wider">
              Current active folder
            </span>
          </div>
        </div>

        {/* Intro Video Status */}
        <div className="bg-[#121212] border border-zinc-850 p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-amber-500/20 transition-all duration-300">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-widest">Intro Video</span>
            <Video className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-tight text-zinc-200">
              {introVideoUrl ? "📺 Active Broadcast" : "🔌 Bypass Mode"}
            </span>
            <span className="block text-[10px] text-zinc-500 font-bold uppercase mt-2 tracking-wider">
              {introVideoUrl ? "Plays before login" : "Direct sign-in active"}
            </span>
          </div>
        </div>

      </div>

      {/* Two Column Layout: Quick Actions vs Pulse logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Quick Task Shortcuts */}
        <div className="lg:col-span-5 bg-[#121212] border border-zinc-850 rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-zinc-200 border-b border-zinc-800 pb-2">
            Quick Control Actions
          </h3>

          <div className="space-y-3">
            <TaskShortcut 
              href="/users"
              icon={<Users className="w-5 h-5 text-blue-500" />}
              title="Archivists & Leaderboard"
              desc="View registered users, ranks, online status, and wipe XP."
            />
            <TaskShortcut 
              href="/archives"
              icon={<ImageIcon className="w-5 h-5 text-green-500" />}
              title="Archive Moderation"
              desc="Review and delete user-submitted images and videos."
            />
            <TaskShortcut 
              href="/memories"
              icon={<ImageIcon className="w-5 h-5 text-amber-500" />}
              title="Moderate Scrapbook Pages"
              desc="Upload new polaroid memories or moderate dynamic campus logs."
            />
            <TaskShortcut 
              href="/signatures"
              icon={<PenTool className="w-5 h-5 text-purple-550" />}
              title="Moderate Signatures"
              desc="View signature records and wipe spam ledger entries."
            />
            <TaskShortcut 
              href="/video"
              icon={<Video className="w-5 h-5 text-red-500" />}
              title="Broadcast Intro Video"
              desc="Paste a video link or upload files directly to Cloudinary."
            />
            <TaskShortcut 
              href="/settings"
              icon={<Settings className="w-5 h-5 text-zinc-400" />}
              title="Yearbook Customizer"
              desc="Change cover pages, titles, greeting quotes, and metrics."
            />
          </div>
        </div>

        {/* Recent Activity logs */}
        <div className="lg:col-span-7 bg-[#121212] border border-zinc-850 rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <h3 className="text-lg font-bold text-zinc-200">
              Recent Activity Pulse
            </h3>
            <span className="text-[10px] bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded text-zinc-500 font-bold uppercase tracking-widest">
              Live Feed
            </span>
          </div>

          <div className="space-y-4">
            {signatures.length === 0 ? (
              <p className="text-center text-zinc-650 text-xs italic py-10">No recent activity pulse detected.</p>
            ) : (
              signatures.map((sig) => (
                <div key={sig.id} className="flex justify-between items-start gap-4 p-3 bg-zinc-950/60 border border-zinc-900 rounded-xl">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-500">
                      ✒ {sig.name} signed guestbook
                    </span>
                    <p className="text-zinc-400 text-xs italic line-clamp-1">
                      "{sig.message}"
                    </p>
                  </div>
                  <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
                    Recent
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

function TaskShortcut({ href, icon, title, desc }: { href: string, icon: React.ReactNode, title: string, desc: string }) {
  return (
    <Link 
      href={href}
      className="flex items-center justify-between p-4 bg-zinc-950/50 hover:bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-xl transition-all duration-200 group"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-lg group-hover:scale-105 transition-transform">
          {icon}
        </div>
        <div>
          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">{title}</h4>
          <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-500 transition-colors" />
    </Link>
  );
}
