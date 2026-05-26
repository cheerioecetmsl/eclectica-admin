"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { 
  Settings, Bookmark, Sliders, RefreshCw, AlertCircle, 
  CheckCircle2, Info 
} from "lucide-react";

export default function settingsCustomizer() {
  const [albumTitle, setAlbumTitle] = useState("Our Hand-Sketched Scrapbook");
  const [albumSubtitle, setAlbumSubtitle] = useState("Tear open a beautiful cardboard volume of student memories.");
  const [coverClass, setCoverClass] = useState("Class of 2026");
  const [coverTitle, setCoverTitle] = useState("Eclectica Farewell");
  const [coverDesc, setCoverDesc] = useState("A handwritten scrapbook of the moments that shaped our journey...");
  
  // Custom stats
  const [stat1Val, setStat1Val] = useState("20+");
  const [stat1Lbl, setStat1Lbl] = useState("Diary Pages");
  const [stat2Val, setStat2Val] = useState("4");
  const [stat2Lbl, setStat2Lbl] = useState("Core Chapters");
  const [stat3Val, setStat3Val] = useState("1");
  const [stat3Lbl, setStat3Lbl] = useState("Nostalgic Heart");

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Load live settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "settings", "album"));
      if (snap.exists()) {
        const data = snap.data();
        setAlbumTitle(data.title || "Our Hand-Sketched Scrapbook");
        setAlbumSubtitle(data.subtitle || "Tear open a beautiful cardboard volume of student memories.");
        setCoverTitle(data.coverTitle || "Eclectica Farewell");
        setCoverDesc(data.coverDesc || "A handwritten scrapbook of the moments that shaped our journey...");
        setCoverClass(data.coverClass || "Class of 2026");

        if (data.stats && Array.isArray(data.stats)) {
          if (data.stats[0]) {
            setStat1Val(data.stats[0].value || "");
            setStat1Lbl(data.stats[0].label || "");
          }
          if (data.stats[1]) {
            setStat2Val(data.stats[1].value || "");
            setStat2Lbl(data.stats[1].label || "");
          }
          if (data.stats[2]) {
            setStat3Val(data.stats[2].value || "");
            setStat3Lbl(data.stats[2].label || "");
          }
        }
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
      setErrorMsg("Failed to read settings from database.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await updateDoc(doc(db, "settings", "album"), {
        title: albumTitle.trim(),
        subtitle: albumSubtitle.trim(),
        coverTitle: coverTitle.trim(),
        coverDesc: coverDesc.trim(),
        coverClass: coverClass.trim(),
        stats: [
          { value: stat1Val.trim(), label: stat1Lbl.trim() },
          { value: stat2Val.trim(), label: stat2Lbl.trim() },
          { value: stat3Val.trim(), label: stat3Lbl.trim() }
        ]
      });
      setSuccessMsg("Settings updated successfully! Changes synchronize in real-time.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      setErrorMsg("Failed to save changes back to Firestore.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Yearbook Customizer Settings</h1>
        <p className="text-zinc-400 italic text-sm mt-1">
          Adjust live title contents, graduating class batch years, and core highlights.
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 animate-pulse font-mono">Synchronizing Settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="bg-[#121212] border border-zinc-850 p-6 rounded-2xl space-y-6">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-850 pb-2">
            <Sliders className="w-5 h-5 text-amber-500" />
            <span>General Customizations</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Block: Scrapbook Headers */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 mb-1">
                  Scrapbook Main Title:
                </label>
                <input
                  type="text"
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-800 focus:border-amber-500 bg-zinc-950 text-zinc-100 rounded-xl text-sm focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 mb-1">
                  Scrapbook Nostalgic Subtext:
                </label>
                <textarea
                  value={albumSubtitle}
                  onChange={(e) => setAlbumSubtitle(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-800 focus:border-amber-500 bg-zinc-950 text-zinc-100 rounded-xl text-sm focus:outline-none leading-relaxed resize-none"
                  required
                />
              </div>

              {/* Book Cover customizers */}
              <div className="border border-zinc-850 p-4 rounded-xl bg-zinc-950/30 space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 border-b border-zinc-850 pb-1 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" /> Book Cover Layout:
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-0.5">Cover Header Title:</label>
                    <input
                      type="text"
                      value={coverTitle}
                      onChange={(e) => setCoverTitle(e.target.value)}
                      className="w-full px-2 py-1.5 border border-zinc-800 focus:border-amber-500 bg-zinc-950 text-zinc-100 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-0.5">Graduating Class Tag:</label>
                    <input
                      type="text"
                      value={coverClass}
                      onChange={(e) => setCoverClass(e.target.value)}
                      placeholder="e.g. Class of 2026"
                      className="w-full px-2 py-1.5 border border-zinc-800 focus:border-amber-500 bg-zinc-950 text-zinc-100 rounded-lg text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-0.5">Cover Greeting / Description Quote:</label>
                  <textarea
                    value={coverDesc}
                    onChange={(e) => setCoverDesc(e.target.value)}
                    rows={2}
                    className="w-full px-2 py-1.5 border border-zinc-800 focus:border-amber-500 bg-zinc-950 text-zinc-100 rounded-lg text-xs leading-normal resize-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Right Block: Stats Customizers */}
            <div className="space-y-4 border border-zinc-850 p-5 rounded-xl bg-zinc-950/30">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 border-b border-zinc-850 pb-2">
                Sticky-Note Core Highlights:
              </h4>

              <div className="space-y-3">
                {/* Stat 1 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-0.5">Stat 1 Value:</label>
                    <input
                      type="text"
                      value={stat1Val}
                      onChange={(e) => setStat1Val(e.target.value)}
                      className="w-full px-2 py-1.5 border border-zinc-800 focus:border-amber-500 bg-zinc-950 text-zinc-100 rounded-lg text-xs text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-0.5">Stat 1 Label:</label>
                    <input
                      type="text"
                      value={stat1Lbl}
                      onChange={(e) => setStat1Lbl(e.target.value)}
                      className="w-full px-2 py-1.5 border border-zinc-800 focus:border-amber-500 bg-zinc-950 text-zinc-100 rounded-lg text-xs text-center"
                    />
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-0.5">Stat 2 Value:</label>
                    <input
                      type="text"
                      value={stat2Val}
                      onChange={(e) => setStat2Val(e.target.value)}
                      className="w-full px-2 py-1.5 border border-zinc-800 focus:border-amber-500 bg-zinc-950 text-zinc-100 rounded-lg text-xs text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-0.5">Stat 2 Label:</label>
                    <input
                      type="text"
                      value={stat2Lbl}
                      onChange={(e) => setStat2Lbl(e.target.value)}
                      className="w-full px-2 py-1.5 border border-zinc-800 focus:border-amber-500 bg-zinc-950 text-zinc-100 rounded-lg text-xs text-center"
                    />
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-0.5">Stat 3 Value:</label>
                    <input
                      type="text"
                      value={stat3Val}
                      onChange={(e) => setStat3Val(e.target.value)}
                      className="w-full px-2 py-1.5 border border-zinc-800 focus:border-amber-500 bg-zinc-950 text-zinc-100 rounded-lg text-xs text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-0.5">Stat 3 Label:</label>
                    <input
                      type="text"
                      value={stat3Lbl}
                      onChange={(e) => setStat3Lbl(e.target.value)}
                      className="w-full px-2 py-1.5 border border-zinc-800 focus:border-amber-500 bg-zinc-950 text-zinc-100 rounded-lg text-xs text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-850/60 flex items-start gap-2 text-[10px] text-zinc-500 leading-normal">
                <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>These core metrics are highlighted as ruled stickies in the cardboard volumes. Values can contain signs like "+".</span>
              </div>
            </div>

          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end pt-4 border-t border-zinc-850">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 border border-amber-600 bg-amber-600/10 hover:bg-amber-600 hover:text-stone-950 rounded-xl font-bold text-xs uppercase tracking-widest text-amber-450 transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.05)] cursor-pointer"
            >
              {isSaving ? "Saving Settings..." : "Save Config Settings ✒"}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
