"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { 
  BarChart2, Plus, Trash2, Edit2, Upload, RefreshCw, 
  AlertCircle, CheckCircle2, Image as ImageIcon, Video,
  X
} from "lucide-react";

interface PollOption {
  id: string;
  text: string;
  mediaUrl: string;
  mediaType: "image" | "video" | null;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  type: "single" | "multiple";
  status: "open" | "closed" | "results_declared";
  options: PollOption[];
  mediaUrl?: string;
  mediaType?: "image" | "video" | null;
  createdAt: any;
}

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  folder: string;
}

export default function PollsManager() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<CloudinaryConfig | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [pollId, setPollId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"single" | "multiple">("single");
  const [status, setStatus] = useState<"open" | "closed" | "results_declared">("closed");
  const [options, setOptions] = useState<PollOption[]>([
    { id: "1", text: "", mediaUrl: "", mediaType: null },
    { id: "2", text: "", mediaUrl: "", mediaType: null }
  ]);

  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isUploadingQuestionMedia, setIsUploadingQuestionMedia] = useState(false);

  const uploadMediaForQuestion = async (file: File, type: "image" | "video") => {
    if (!config) return;
    
    setIsUploadingQuestionMedia(true);
    setMediaType(type); // set type early to show correct loader
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", config.uploadPreset);
    formData.append("folder", `${config.folder}/polls`);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`,
        { method: "POST", body: formData }
      );
      if (res.ok) {
        const data = await res.json();
        setMediaUrl(data.secure_url);
        setMediaType(type);
      } else {
        alert("Upload failed.");
        setMediaType(null);
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading file.");
      setMediaType(null);
    } finally {
      setIsUploadingQuestionMedia(false);
    }
  };

  useEffect(() => {
    fetchPolls();
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.error("Failed to load Cloudinary config", e);
    }
  };

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "polls"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll));
      setPolls(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadMediaForOption = async (optionId: string, file: File, mediaType: "image" | "video") => {
    if (!config) return;
    
    // Optimistic UI updates could go here, but for simplicity we block
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", config.uploadPreset);
    formData.append("folder", `${config.folder}/polls`);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`,
        { method: "POST", body: formData }
      );
      if (res.ok) {
        const data = await res.json();
        setOptions(prev => prev.map(opt => 
          opt.id === optionId 
            ? { ...opt, mediaUrl: data.secure_url, mediaType } 
            : opt
        ));
      } else {
        alert("Upload failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading file.");
    }
  };

  const handleSavePoll = async () => {
    if (!title) return alert("Title required");
    if (options.length < 2) return alert("At least 2 options required");
    
    setSaving(true);
    try {
      const id = pollId || `poll_${Date.now()}`;
      const pollData = {
        title,
        description,
        type,
        status,
        options,
        mediaUrl: mediaUrl || "",
        mediaType: mediaType || null,
        createdAt: pollId ? undefined : new Date() // Don't overwrite if editing
      };

      await setDoc(doc(db, "polls", id), pollData, { merge: true });
      setIsCreating(false);
      resetForm();
      fetchPolls();
    } catch (err) {
      console.error(err);
      alert("Failed to save poll");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this poll forever?")) {
      await deleteDoc(doc(db, "polls", id));
      fetchPolls();
    }
  };

  const resetForm = () => {
    setPollId("");
    setTitle("");
    setDescription("");
    setType("single");
    setStatus("closed");
    setOptions([
      { id: "1", text: "", mediaUrl: "", mediaType: null },
      { id: "2", text: "", mediaUrl: "", mediaType: null }
    ]);
    setMediaUrl("");
    setMediaType(null);
  };

  const openEdit = (poll: Poll) => {
    setPollId(poll.id);
    setTitle(poll.title);
    setDescription(poll.description || "");
    setType(poll.type);
    setStatus(poll.status);
    setOptions(poll.options);
    setMediaUrl(poll.mediaUrl || "");
    setMediaType(poll.mediaType || null);
    setIsCreating(true);
  };

  const updatePollStatus = async (id: string, newStatus: "open" | "closed" | "results_declared") => {
    try {
      await updateDoc(doc(db, "polls", id), { status: newStatus });
      setPolls(polls.map(p => p.id === id ? { ...p, status: newStatus } : p));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-amber-500 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Polls Data...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-amber-500" />
            <span>Exit Polls Studio</span>
          </h1>
          <p className="text-zinc-400 italic text-sm mt-1">
            "Design polls, upload rich media, and dictate election timelines."
          </p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => { resetForm(); setIsCreating(true); }}
            className="flex items-center gap-2 bg-amber-600 text-stone-950 px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-amber-500 transition-colors"
          >
            <Plus size={16} /> Create New Poll
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="bg-[#121212] border border-zinc-850 rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
            <h2 className="text-xl font-bold text-zinc-100">{pollId ? "Edit Poll" : "Draft New Poll"}</h2>
            <button onClick={() => setIsCreating(false)} className="text-zinc-500 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4 col-span-2 md:col-span-1">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Poll Title / Question</label>
                <input 
                  type="text" 
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                  placeholder="e.g. Who is most likely to..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Description (Optional)</label>
                <textarea 
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none resize-none h-24"
                  placeholder="Additional context..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Question Media (Optional)</label>
                {mediaUrl ? (
                  <div className="relative w-full h-40 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
                    {mediaType === "image" ? (
                      <img src={mediaUrl} alt="Poll question" className="w-full h-full object-cover" />
                    ) : (
                      <video src={mediaUrl} controls className="w-full h-full object-contain bg-black" />
                    )}
                    <button 
                      type="button"
                      onClick={() => { setMediaUrl(""); setMediaType(null); }}
                      className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer text-xs font-bold uppercase tracking-wider">
                      {isUploadingQuestionMedia && mediaType === "image" ? (
                        <RefreshCw className="animate-spin w-4 h-4" />
                      ) : (
                        <ImageIcon size={16} />
                      )}
                      <span>Add Image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        disabled={isUploadingQuestionMedia}
                        onChange={(e) => e.target.files?.[0] && uploadMediaForQuestion(e.target.files[0], "image")} 
                      />
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer text-xs font-bold uppercase tracking-wider">
                      {isUploadingQuestionMedia && mediaType === "video" ? (
                        <RefreshCw className="animate-spin w-4 h-4" />
                      ) : (
                        <Video size={16} />
                      )}
                      <span>Add Video</span>
                      <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        disabled={isUploadingQuestionMedia}
                        onChange={(e) => e.target.files?.[0] && uploadMediaForQuestion(e.target.files[0], "video")} 
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Selection Type</label>
                  <select 
                    value={type} onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none appearance-none"
                  >
                    <option value="single">Single Choice</option>
                    <option value="multiple">Multiple Choice</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Initial Status</label>
                  <select 
                    value={status} onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none appearance-none"
                  >
                    <option value="closed">Closed (Draft)</option>
                    <option value="open">Open (Active)</option>
                    <option value="results_declared">Results Declared</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-zinc-800 pt-6 md:pt-0 md:pl-6 space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Poll Options</label>
                <button 
                  onClick={() => setOptions([...options, { id: Date.now().toString(), text: "", mediaUrl: "", mediaType: null }])}
                  className="text-xs font-bold text-amber-500 hover:text-amber-400 uppercase flex items-center gap-1"
                >
                  <Plus size={14} /> Add Option
                </button>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {options.map((opt, idx) => (
                  <div key={opt.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 relative group">
                    <button 
                      onClick={() => setOptions(options.filter(o => o.id !== opt.id))}
                      className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                    
                    <input 
                      type="text" 
                      value={opt.text}
                      onChange={(e) => setOptions(options.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o))}
                      placeholder={`Option ${idx + 1}`}
                      className="w-full bg-black/50 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:border-amber-500 outline-none"
                    />

                    {/* Media preview and upload */}
                    <div className="flex items-center gap-3">
                      {opt.mediaUrl ? (
                        <div className="relative w-16 h-12 bg-black rounded overflow-hidden border border-zinc-800 group/media">
                          {opt.mediaType === "image" ? (
                            <img src={opt.mediaUrl} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                            <video src={opt.mediaUrl} controls className="w-full h-full object-cover bg-black" />
                          )}
                          <button 
                            onClick={() => setOptions(options.map(o => o.id === opt.id ? { ...o, mediaUrl: "", mediaType: null } : o))}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} className="text-red-500" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <label className="cursor-pointer p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 transition-colors">
                            <ImageIcon size={14} />
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMediaForOption(opt.id, e.target.files[0], "image")} />
                          </label>
                          <label className="cursor-pointer p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 transition-colors">
                            <Video size={14} />
                            <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMediaForOption(opt.id, e.target.files[0], "video")} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="border-t border-zinc-800 pt-6 flex justify-end">
            <button 
              onClick={handleSavePoll}
              disabled={saving}
              className="bg-amber-600 text-stone-950 px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-amber-500 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <RefreshCw className="animate-spin" size={18} /> : null}
              {saving ? "Saving..." : "Save Poll"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#121212] border border-zinc-850 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/50 text-zinc-400 uppercase tracking-widest text-[10px] font-bold border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">Poll Question</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Options</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {polls.map((poll) => (
                <tr key={poll.id} className="hover:bg-zinc-900/30 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-zinc-200">{poll.title}</p>
                    <p className="text-[10px] text-zinc-500 max-w-[250px] truncate">{poll.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest bg-zinc-800 px-2 py-1 rounded-md">
                      {poll.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 font-mono">
                    {poll.options.length} options
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={poll.status}
                      onChange={(e) => updatePollStatus(poll.id, e.target.value as any)}
                      className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md border appearance-none cursor-pointer outline-none ${
                        poll.status === 'open' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        poll.status === 'closed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}
                    >
                      <option value="closed">Closed</option>
                      <option value="open">Open (Active)</option>
                      <option value="results_declared">Results Declared</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEdit(poll)}
                        className="p-2 text-zinc-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(poll.id)}
                        className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {polls.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">
                    No polls drafted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
