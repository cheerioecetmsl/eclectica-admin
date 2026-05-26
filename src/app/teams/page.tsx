"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, writeBatch } from "firebase/firestore";
import { Loader2, Users, Save, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TeamMember {
  uid: string;
  name: string;
  photoURL?: string;
  teamId?: string | null;
}

interface TeamState {
  id: string;
  name: string;
  color: string;
  members: TeamMember[];
}

export default function TeamsAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [unassigned, setUnassigned] = useState<TeamMember[]>([]);
  const [teams, setTeams] = useState<Record<string, TeamState>>({
    team1: { id: "team1", name: "Team 1", color: "#EF4444", members: [] }, // Red
    team2: { id: "team2", name: "Team 2", color: "#3B82F6", members: [] }, // Blue
    team3: { id: "team3", name: "Team 3", color: "#10B981", members: [] }, // Green
    team4: { id: "team4", name: "Team 4", color: "#F59E0B", members: [] }, // Yellow
  });

  const [draggedUser, setDraggedUser] = useState<TeamMember | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"), where("year", "==", "4th Year"));
      const snap = await getDocs(q);
      
      const unassignedList: TeamMember[] = [];
      const newTeams = { ...teams };
      // Clear out old members before repopulating
      Object.keys(newTeams).forEach(k => newTeams[k].members = []);

      snap.docs.forEach(d => {
        const data = d.data();
        const user: TeamMember = {
          uid: d.id,
          name: data.name,
          photoURL: data.photoURL,
          teamId: data.teamId
        };
        
        if (user.teamId && newTeams[user.teamId]) {
          newTeams[user.teamId].members.push(user);
        } else {
          unassignedList.push(user);
        }

        // Check if colors were globally saved in user docs (optional, but robust)
        if (data.teamColor && user.teamId && newTeams[user.teamId]) {
          newTeams[user.teamId].color = data.teamColor;
        }
      });

      setUnassigned(unassignedList);
      setTeams(newTeams);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, user: TeamMember, sourceZone: string) => {
    e.dataTransfer.setData("uid", user.uid);
    e.dataTransfer.setData("sourceZone", sourceZone);
    // Custom drag image (makes it look clean and native)
    setDraggedUser(user);
  };

  const handleDragEnd = () => {
    setDraggedUser(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, targetZone: string) => {
    e.preventDefault();
    const uid = e.dataTransfer.getData("uid");
    const sourceZone = e.dataTransfer.getData("sourceZone");
    setDraggedUser(null);

    if (sourceZone === targetZone || !uid) return;

    // Find the user object
    let user: TeamMember | undefined;
    if (sourceZone === "unassigned") {
      user = unassigned.find(u => u.uid === uid);
    } else {
      user = teams[sourceZone].members.find(u => u.uid === uid);
    }

    if (!user) return;

    // Remove from source
    if (sourceZone === "unassigned") {
      setUnassigned(prev => prev.filter(u => u.uid !== uid));
    } else {
      setTeams(prev => ({
        ...prev,
        [sourceZone]: {
          ...prev[sourceZone],
          members: prev[sourceZone].members.filter(u => u.uid !== uid)
        }
      }));
    }

    // Add to target
    if (targetZone === "unassigned") {
      setUnassigned(prev => [...prev, { ...user!, teamId: null }]);
    } else {
      setTeams(prev => ({
        ...prev,
        [targetZone]: {
          ...prev[targetZone],
          members: [...prev[targetZone].members, { ...user!, teamId: targetZone }]
        }
      }));
    }
  };

  // --- COLOR PICKER ---
  const handleColorChange = (teamId: string, color: string) => {
    setTeams(prev => ({
      ...prev,
      [teamId]: { ...prev[teamId], color }
    }));
  };

  // --- SAVE ---
  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const batch = writeBatch(db);

      // Process unassigned
      unassigned.forEach(u => {
        batch.update(doc(db, "users", u.uid), {
          teamId: null,
          teamColor: null
        });
      });

      // Process teams
      Object.values(teams).forEach(team => {
        team.members.forEach(u => {
          batch.update(doc(db, "users", u.uid), {
            teamId: team.id,
            teamColor: team.color
          });
        });
      });

      await batch.commit();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save teams");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-zinc-100 flex items-center gap-3">
            <Users className="text-amber-500" />
            Team Assignments
          </h1>
          <p className="text-zinc-500 mt-1">Assign 4th-year students to the 4 teams for "Chase the Colours". Drag and Drop their cards.</p>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-lg font-bold transition-all"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : success ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? "Publishing..." : success ? "Published!" : "Publish Teams"}
        </button>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        
        {/* Left Side: Unassigned */}
        <div 
          className="w-1/3 flex flex-col bg-zinc-900/50 rounded-xl border border-zinc-800 p-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "unassigned")}
        >
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
            <h2 className="font-bold text-zinc-300">Unassigned Roster</h2>
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-full font-mono">{unassigned.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            <AnimatePresence>
              {unassigned.map(user => (
                <UserCard 
                  key={user.uid} 
                  user={user} 
                  sourceZone="unassigned"
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </AnimatePresence>
            {unassigned.length === 0 && (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm border-2 border-dashed border-zinc-800 rounded-lg">
                All 4th Years Assigned
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Teams */}
        <div className="w-2/3 grid grid-cols-2 gap-4">
          {Object.values(teams).map(team => (
            <div 
              key={team.id}
              className="flex flex-col rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/30"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, team.id)}
            >
              <div 
                className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between"
                style={{ backgroundColor: `${team.color}15`, borderBottomColor: `${team.color}30` }}
              >
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={team.color} 
                    onChange={(e) => handleColorChange(team.id, e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                    title="Change Team Color"
                  />
                  <h3 className="font-bold text-lg" style={{ color: team.color }}>{team.name}</h3>
                </div>
                <span className="bg-black/40 text-zinc-300 text-xs px-2 py-1 rounded-full font-mono">
                  {team.members.length} / 5
                </span>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-2 min-h-[150px]">
                <AnimatePresence>
                  {team.members.map(user => (
                    <UserCard 
                      key={user.uid} 
                      user={user} 
                      sourceZone={team.id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </AnimatePresence>
                {team.members.length === 0 && (
                  <div className="h-full flex items-center justify-center text-zinc-700 text-sm italic">
                    Drag members here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// User Card Component with Framer Motion layout animation
function UserCard({ 
  user, 
  sourceZone, 
  onDragStart, 
  onDragEnd 
}: { 
  user: TeamMember, 
  sourceZone: string,
  onDragStart: (e: React.DragEvent, u: TeamMember, z: string) => void,
  onDragEnd: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileDrag={{ scale: 1.05, zIndex: 50, opacity: 0.8 }}
      draggable
      onDragStart={(e: any) => onDragStart(e, user, sourceZone)}
      onDragEnd={onDragEnd}
      className="bg-black border border-zinc-800 rounded-lg p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing shadow-sm hover:border-zinc-700"
    >
      <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">U</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-200 truncate">{user.name}</p>
      </div>
    </motion.div>
  );
}
