"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { 
  Video, Link as LinkIcon, Upload, Trash2, RefreshCw, 
  AlertCircle, CheckCircle2, Play, Sparkles, Monitor, Smartphone
} from "lucide-react";

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  folder: string;
}

export default function VideoSettingsManager() {
  // Desktop states
  const [introVideoUrl, setIntroVideoUrl] = useState("");
  const [videoLinkInput, setVideoLinkInput] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Mobile states
  const [introVideoUrlMobile, setIntroVideoUrlMobile] = useState("");
  const [videoLinkInputMobile, setVideoLinkInputMobile] = useState("");
  const [uploadFileMobile, setUploadFileMobile] = useState<File | null>(null);
  
  const [config, setConfig] = useState<CloudinaryConfig>({
    cloudName: "",
    uploadPreset: "",
    folder: "Eclectica"
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch configs & setting details on mount
  useEffect(() => {
    fetchSettings();
    fetchConfig();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "settings", "album"));
      if (snap.exists()) {
        const data = snap.data();
        
        const videoUrl = data.introVideoUrl || "";
        setIntroVideoUrl(videoUrl);
        setVideoLinkInput(videoUrl);

        const videoUrlMobile = data.introVideoUrlMobile || "";
        setIntroVideoUrlMobile(videoUrlMobile);
        setVideoLinkInputMobile(videoUrlMobile);
      }
    } catch (e) {
      console.error("Failed to load video settings:", e);
      setErrorMsg("Failed to connect to settings database.");
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.error("Failed to load Cloudinary config:", e);
    }
  };

  // Save pasted link URLs
  const handleSaveLinks = async (type: "desktop" | "mobile") => {
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (type === "desktop") {
        await updateDoc(doc(db, "settings", "album"), {
          introVideoUrl: videoLinkInput.trim()
        });
        setIntroVideoUrl(videoLinkInput.trim());
        setSuccessMsg("Desktop video stream URL successfully updated!");
      } else {
        await updateDoc(doc(db, "settings", "album"), {
          introVideoUrlMobile: videoLinkInputMobile.trim()
        });
        setIntroVideoUrlMobile(videoLinkInputMobile.trim());
        setSuccessMsg("Mobile video stream URL successfully updated!");
      }
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      setErrorMsg("Failed to update video URL in settings.");
    } finally {
      setIsSaving(false);
    }
  };

  // Direct Video File Upload to Cloudinary
  const handleFileUpload = async (type: "desktop" | "mobile") => {
    const fileToUpload = type === "desktop" ? uploadFile : uploadFileMobile;
    if (!fileToUpload) {
      setErrorMsg(`Select a ${type} video file to upload first!`);
      return;
    }
    if (!config.cloudName) {
      setErrorMsg("Cloudinary credentials are not configured in your env file!");
      return;
    }

    setIsUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const folderPath = `${config.folder || "Eclectica"}/intro`;

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("upload_preset", config.uploadPreset);
      formData.append("folder", folderPath);

      console.log(`Uploading ${type} video binary directly to Cloudinary...`);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/video/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (res.ok) {
        const cloudData = await res.json();
        const uploadedVideoUrl = cloudData.secure_url;

        if (type === "desktop") {
          await updateDoc(doc(db, "settings", "album"), {
            introVideoUrl: uploadedVideoUrl
          });
          setIntroVideoUrl(uploadedVideoUrl);
          setVideoLinkInput(uploadedVideoUrl);
          setUploadFile(null);
          setSuccessMsg("Desktop video uploaded and broadcasted successfully!");
        } else {
          await updateDoc(doc(db, "settings", "album"), {
            introVideoUrlMobile: uploadedVideoUrl
          });
          setIntroVideoUrlMobile(uploadedVideoUrl);
          setVideoLinkInputMobile(uploadedVideoUrl);
          setUploadFileMobile(null);
          setSuccessMsg("Mobile video uploaded and broadcasted successfully!");
        }
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        const err = await res.json();
        setErrorMsg(err.error?.message || "Failed to upload video to Cloudinary.");
      }
    } catch (e: any) {
      setErrorMsg("Upload error: check your connection and credentials.");
    } finally {
      setIsUploading(false);
    }
  };

  // Clear/Wipe Broadcast Video
  const handleClearVideo = async (type: "desktop" | "mobile") => {
    if (!window.confirm(`Are you sure you want to disable the ${type} intro video?`)) {
      return;
    }

    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (type === "desktop") {
        await updateDoc(doc(db, "settings", "album"), {
          introVideoUrl: ""
        });
        setIntroVideoUrl("");
        setVideoLinkInput("");
        setSuccessMsg("Desktop video broadcast removed successfully.");
      } else {
        await updateDoc(doc(db, "settings", "album"), {
          introVideoUrlMobile: ""
        });
        setIntroVideoUrlMobile("");
        setVideoLinkInputMobile("");
        setSuccessMsg("Mobile video broadcast removed successfully.");
      }
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      setErrorMsg("Failed to disable intro video.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dynamic Video Settings</h1>
        <p className="text-zinc-400 italic text-sm mt-1">
          Set up separate horizontal and vertical video streams for Desktop and Mobile viewports.
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
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 animate-pulse font-mono">Loading config ledgers...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          
          {/* ================= DESKTOP VIDEO PANEL ================= */}
          <div className="bg-[#121212] border border-zinc-850 p-6 rounded-2xl space-y-6">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-850 pb-3">
              <Monitor className="w-5 h-5 text-amber-500" />
              <span>Desktop Landscape Video (Horizontal)</span>
            </h2>

            {/* Broadcast Status */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <span>Desktop Stream State:</span>
                <span className={introVideoUrl ? "text-green-500 animate-pulse" : "text-zinc-550"}>
                  {introVideoUrl ? "ACTIVE BROADCAST 📺" : "BYPASSED / OFF"}
                </span>
              </div>
              {introVideoUrl ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-mono text-zinc-400 break-all leading-normal">
                    {introVideoUrl}
                  </p>
                  <button
                    onClick={() => handleClearVideo("desktop")}
                    className="w-full py-2 bg-red-950/20 hover:bg-red-950 hover:text-white border border-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                  >
                    Wipe Desktop Video 🗑
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-zinc-500 italic text-center py-1">
                  No Desktop video set. It will automatically bypass playback.
                </p>
              )}
            </div>

            {/* Link Input */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Option A: Paste Video URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/desktop.mp4"
                  value={videoLinkInput}
                  onChange={(e) => setVideoLinkInput(e.target.value)}
                  className="flex-grow px-3 py-2 border border-zinc-800 focus:border-amber-500 bg-zinc-950 text-zinc-100 rounded-xl text-xs focus:outline-none font-mono"
                />
                <button
                  onClick={() => handleSaveLinks("desktop")}
                  disabled={isSaving}
                  className="px-4 py-2 border border-amber-600 bg-amber-600/10 hover:bg-amber-600 hover:text-stone-950 rounded-xl font-bold text-xs uppercase tracking-widest text-amber-450 transition-all cursor-pointer"
                >
                  Save URL
                </button>
              </div>
            </div>

            {/* Binary File Upload */}
            <div className="space-y-3 pt-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Option B: Upload Video File
              </label>
              <div className="border border-dashed border-zinc-800 hover:border-amber-500/40 rounded-xl p-4 text-center hover:bg-zinc-950 transition-colors relative cursor-pointer bg-zinc-950/30">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="space-y-1">
                  <Upload className="w-5 h-5 mx-auto text-zinc-550" />
                  {uploadFile ? (
                    <p className="text-[11px] font-bold text-amber-500 break-all font-mono">
                      📎 {uploadFile.name}
                    </p>
                  ) : (
                    <p className="text-[10px] text-zinc-450">Drag video or click to upload</p>
                  )}
                </div>
              </div>
              {uploadFile && (
                <button
                  onClick={() => handleFileUpload("desktop")}
                  disabled={isUploading}
                  className="w-full py-2.5 border border-amber-600 bg-amber-600/10 hover:bg-amber-600 hover:text-stone-950 rounded-xl font-bold text-xs uppercase tracking-widest text-amber-450 transition-all flex items-center justify-center gap-1.5"
                >
                  {isUploading ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : "Upload Desktop Stream"}
                </button>
              )}
            </div>

            {/* Desktop Preview */}
            <div className="space-y-2 pt-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Live Landscape Preview:</span>
              <div className="relative w-full aspect-video bg-black border border-zinc-850 rounded-xl overflow-hidden shadow-inner">
                {introVideoUrl ? (
                  <video key={introVideoUrl} src={introVideoUrl} controls className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 text-xs">
                    <Play className="w-8 h-8 mb-1" />
                    <span>No Landscape Stream</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ================= MOBILE VIDEO PANEL ================= */}
          <div className="bg-[#121212] border border-zinc-850 p-6 rounded-2xl space-y-6">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-850 pb-3">
              <Smartphone className="w-5 h-5 text-amber-500" />
              <span>Mobile Portrait Video (Vertical)</span>
            </h2>

            {/* Broadcast Status */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <span>Mobile Stream State:</span>
                <span className={introVideoUrlMobile ? "text-green-500 animate-pulse" : "text-zinc-550"}>
                  {introVideoUrlMobile ? "ACTIVE BROADCAST 📱" : "BYPASSED / OFF"}
                </span>
              </div>
              {introVideoUrlMobile ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-mono text-zinc-400 break-all leading-normal">
                    {introVideoUrlMobile}
                  </p>
                  <button
                    onClick={() => handleClearVideo("mobile")}
                    className="w-full py-2 bg-red-950/20 hover:bg-red-950 hover:text-white border border-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                  >
                    Wipe Mobile Video 🗑
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-zinc-500 italic text-center py-1">
                  No Mobile video set. It will automatically bypass playback.
                </p>
              )}
            </div>

            {/* Link Input */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Option A: Paste Video URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/mobile.mp4"
                  value={videoLinkInputMobile}
                  onChange={(e) => setVideoLinkInputMobile(e.target.value)}
                  className="flex-grow px-3 py-2 border border-zinc-800 focus:border-amber-500 bg-zinc-950 text-zinc-100 rounded-xl text-xs focus:outline-none font-mono"
                />
                <button
                  onClick={() => handleSaveLinks("mobile")}
                  disabled={isSaving}
                  className="px-4 py-2 border border-amber-600 bg-amber-600/10 hover:bg-amber-600 hover:text-stone-950 rounded-xl font-bold text-xs uppercase tracking-widest text-amber-450 transition-all cursor-pointer"
                >
                  Save URL
                </button>
              </div>
            </div>

            {/* Binary File Upload */}
            <div className="space-y-3 pt-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Option B: Upload Video File
              </label>
              <div className="border border-dashed border-zinc-800 hover:border-amber-500/40 rounded-xl p-4 text-center hover:bg-zinc-950 transition-colors relative cursor-pointer bg-zinc-950/30">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFileMobile(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="space-y-1">
                  <Upload className="w-5 h-5 mx-auto text-zinc-550" />
                  {uploadFileMobile ? (
                    <p className="text-[11px] font-bold text-amber-500 break-all font-mono">
                      📎 {uploadFileMobile.name}
                    </p>
                  ) : (
                    <p className="text-[10px] text-zinc-450">Drag video or click to upload</p>
                  )}
                </div>
              </div>
              {uploadFileMobile && (
                <button
                  onClick={() => handleFileUpload("mobile")}
                  disabled={isUploading}
                  className="w-full py-2.5 border border-amber-600 bg-amber-600/10 hover:bg-amber-600 hover:text-stone-950 rounded-xl font-bold text-xs uppercase tracking-widest text-amber-450 transition-all flex items-center justify-center gap-1.5"
                >
                  {isUploading ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : "Upload Mobile Stream"}
                </button>
              )}
            </div>

            {/* Mobile Preview */}
            <div className="space-y-2 pt-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Live Portrait Preview:</span>
              <div className="relative w-full aspect-video bg-black border border-zinc-850 rounded-xl overflow-hidden shadow-inner">
                {introVideoUrlMobile ? (
                  <video key={introVideoUrlMobile} src={introVideoUrlMobile} controls className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 text-xs">
                    <Play className="w-8 h-8 mb-1" />
                    <span>No Portrait Stream</span>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
