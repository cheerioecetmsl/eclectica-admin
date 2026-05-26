"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, doc, onSnapshot, addDoc, deleteDoc, 
  query, orderBy, serverTimestamp 
} from "firebase/firestore";
import { 
  ImageIcon, Upload, Trash2, RefreshCw, AlertCircle, CheckCircle2 
} from "lucide-react";

interface PhotoMemory {
  id?: string;
  url: string;
  title: string;
  caption: string;
  publicId?: string;
}

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  folder: string;
}

export default function ScrapbookManager() {
  const [coverClass, setCoverClass] = useState("Class of 2026");
  const [images, setImages] = useState<PhotoMemory[]>([]);
  const [config, setConfig] = useState<CloudinaryConfig>({
    cloudName: "",
    uploadPreset: "",
    folder: "Eclectica"
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Load config & cover class details on mount
  useEffect(() => {
    fetchConfig();
    
    const unsubSettings = onSnapshot(doc(db, "settings", "album"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCoverClass(data.coverClass || "Class of 2026");
      }
    });

    return () => unsubSettings();
  }, []);

  // Fetch memories collection dynamically when coverClass is loaded
  useEffect(() => {
    if (coverClass) {
      setLoading(true);
      const sanitizedBatch = coverClass.toLowerCase().replace(/[^a-z0-9]/g, "_") || "class_of_2026";
      const collectionName = `memories_${sanitizedBatch}`;
      const qMem = query(collection(db, collectionName), orderBy("createdAt", "desc"));
      
      const unsubMem = onSnapshot(qMem, (snapshot) => {
        const list: PhotoMemory[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() as any });
        });
        setImages(list);
        setLoading(false);
      }, (e) => {
        console.error("Memories fetch error:", e);
        setLoading(false);
      });

      return () => unsubMem();
    }
  }, [coverClass]);

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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setErrorMsg("Choose a memory photo file to upload first!");
      return;
    }
    if (!config.cloudName) {
      setErrorMsg("Cloudinary parameters are not configured in your .env file!");
      return;
    }

    setIsUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const sanitizedBatch = coverClass.toLowerCase().replace(/[^a-z0-9]/g, "_") || "class_of_2026";
      const folderPath = `${config.folder || "Eclectica"}/memories/${sanitizedBatch}`;

      // 1. Upload file binary directly to Cloudinary
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("upload_preset", config.uploadPreset);
      formData.append("folder", folderPath);
      
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (res.ok) {
        const cloudData = await res.json();
        
        // 2. Write details to partitioned Firestore memories collection
        const memoriesCollectionName = `memories_${sanitizedBatch}`;
        await addDoc(collection(db, memoriesCollectionName), {
          url: cloudData.secure_url,
          title: uploadTitle.trim() || "Campus Memory",
          caption: uploadCaption.trim() || "A beautiful chapter in our diaries.",
          publicId: cloudData.public_id,
          createdAt: serverTimestamp()
        });

        setSuccessMsg("Memory successfully sketched and stored in Firebase!");
        setUploadFile(null);
        setUploadTitle("");
        setUploadCaption("");
        setTimeout(() => setSuccessMsg(""), 2000);
      } else {
        const err = await res.json();
        setErrorMsg(err.error?.message || "Failed to upload photo to Cloudinary.");
      }
    } catch (e: any) {
      setErrorMsg("Upload/Sync error: check your credentials and connection.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMemory = async (id: string, publicId?: string) => {
    if (!window.confirm("Are you sure you want to rip this memory page out of the scrapbook?")) {
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");

    try {
      let cloudSuccess = true;
      
      // 1. Delete from Cloudinary via backend if publicId is present
      if (publicId) {
        const res = await fetch(`/api/photos?publicId=${encodeURIComponent(publicId)}`, {
          method: "DELETE",
        });
        const cloudResult = await res.json();
        if (!res.ok || !cloudResult.success) {
          cloudSuccess = false;
          console.warn("Could not wipe image from Cloudinary storage, wiping database anyway...");
        }
      }

      // 2. Delete document from dynamic partitioned Firestore collection
      const sanitizedBatch = coverClass.toLowerCase().replace(/[^a-z0-9]/g, "_") || "class_of_2026";
      const memoriesCollectionName = `memories_${sanitizedBatch}`;
      await deleteDoc(doc(db, memoriesCollectionName, id));
      
      setSuccessMsg(
        cloudSuccess 
          ? "Memory page successfully ripped out from everywhere!" 
          : "Memory wiped from database index."
      );
      setTimeout(() => setSuccessMsg(""), 2000);
    } catch (e) {
      setErrorMsg("Failed to process delete request.");
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scrapbook Memory Manager</h1>
        <p className="text-zinc-400 italic text-sm mt-1">
          Currently managing collection: <span className="text-amber-500 font-bold font-mono">memories_{coverClass.toLowerCase().replace(/[^a-z0-9]/g, "_")}</span>
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

      {/* Two Column Uploader vs Gallery List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Memory Sketch uploader */}
        <div className="lg:col-span-5 bg-[#121212] border border-zinc-850 p-6 rounded-2xl space-y-6">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Upload className="w-5 h-5 text-amber-500" />
            Sketch a Memory
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Select Photo File:
              </label>
              <div className="border border-dashed border-zinc-800 hover:border-amber-500/40 rounded-xl p-6 text-center hover:bg-zinc-950 transition-colors relative cursor-pointer bg-zinc-950/60">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-zinc-500" />
                  {uploadFile ? (
                    <p className="text-xs font-bold text-amber-500 break-all px-2">
                      📎 {uploadFile.name}
                    </p>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-zinc-300">Drag photo here or browse</p>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Supports JPG, PNG, WEBP</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Nostalgic Title:
              </label>
              <input
                type="text"
                placeholder="e.g. Cafe Laughs, Rainy Walks"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                maxLength={40}
                className="w-full px-3 py-2 border border-zinc-800 focus:border-amber-500 bg-zinc-950 text-zinc-100 rounded-xl text-sm focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Pencil Caption / Quote:
              </label>
              <textarea
                placeholder="Write a sweet memory quote about this photo..."
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                maxLength={180}
                rows={3}
                className="w-full px-3 py-2 border border-zinc-800 focus:border-amber-500 bg-zinc-950 text-zinc-100 rounded-xl text-sm focus:outline-none leading-relaxed resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-3 border border-amber-600 bg-amber-600/10 hover:bg-amber-600 hover:text-stone-950 disabled:opacity-50 rounded-xl font-bold text-xs uppercase tracking-widest text-amber-450 transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.05)] cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Skitching Photo...
                </>
              ) : (
                <>Sketch New Memory ✒</>
              )}
            </button>
          </form>
        </div>

        {/* Gallery archive grid list */}
        <div className="lg:col-span-7 bg-[#121212] border border-zinc-850 p-6 rounded-2xl space-y-6">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 pb-2 border-b border-zinc-800">
            <ImageIcon className="w-5 h-5 text-amber-500" />
            Scrapbook Pages
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 animate-pulse">Relieving album files...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-16">
              <ImageIcon className="w-12 h-12 mx-auto text-zinc-650 mb-2" />
              <p className="text-sm font-bold text-zinc-400">No photos in the scrap folder!</p>
              <p className="text-xs text-zinc-550 mt-1">Upload a memory to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto pr-1">
              {images.map((img, idx) => (
                <div 
                  key={img.id || idx}
                  className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between relative group hover:border-zinc-800 transition-all"
                >
                  <div className="relative w-full h-36 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
                    <img 
                      src={img.url} 
                      alt={img.title} 
                      className="w-full h-full object-cover" 
                    />
                  </div>

                  <div className="mt-3 text-center pb-3 flex-grow">
                    <h4 className="font-bold text-sm text-zinc-100 line-clamp-1">
                      {img.title}
                    </h4>
                    <p className="text-xs text-zinc-500 italic mt-0.5 line-clamp-2 px-1">
                      "{img.caption}"
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteMemory(img.id!, img.publicId)}
                    className="w-full py-2 bg-red-950/40 hover:bg-red-950 hover:text-white border border-red-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest text-red-400 transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Rip Out Page ✂
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
