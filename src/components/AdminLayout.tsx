"use client";
 
import React, { useState, useEffect } from "react";
import { 
  BookOpen, LayoutDashboard, Image as ImageIcon, PenTool, 
  Video, Settings, LogOut, Lock, AlertCircle, Sparkles, Users, BarChart2, MessageSquare, Menu, X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close sidebar on pathname change (mobile navigation)
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Check auth in sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = sessionStorage.getItem("scrapbook_auth");
      if (auth === "true") {
        setIsAuthenticated(true);
      }
      setIsAuthLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "admin2026") {
      setIsAuthenticated(true);
      setAuthError(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("scrapbook_auth", "true");
      }
    } else {
      setAuthError(true);
      setPasscode("");
      setTimeout(() => setAuthError(false), 1000);
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out of the command center?")) {
      setIsAuthenticated(false);
      setPasscode("");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("scrapbook_auth");
      }
    }
  };

  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-amber-500 font-bold tracking-widest uppercase text-xs animate-pulse">Synchronizing Data Vault...</p>
      </div>
    );
  }

  // Passcode gate overlay - BYPASSED FOR DIRECT ACCESS
  // if (!isAuthenticated) { ... }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0A0A] text-zinc-100 font-sans relative">
      
      {/* Mobile Backdrop overlay */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Panel Left */}
      <aside className={`fixed inset-y-0 left-0 z-50 lg:relative lg:z-0 w-72 border-r border-zinc-800 bg-black/95 lg:bg-black/40 backdrop-blur-xl flex flex-col h-full flex-shrink-0 transition-transform duration-300 ease-in-out ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tighter text-amber-500 leading-none">
                ECLECTICA
              </h1>
              <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">Admin Desk</span>
            </div>
          </div>
          {/* Close button for mobile */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Overview" active={pathname === "/"} />
          <NavItem href="/users" icon={<Users size={18} />} label="Archivists & Leaderboard" active={pathname === "/users"} />
          <NavItem href="/archives" icon={<ImageIcon size={18} />} label="Archive Moderation" active={pathname === "/archives"} />
          <NavItem href="/memories" icon={<ImageIcon size={18} />} label="Scrapbook Manager" active={pathname === "/memories"} />
          <NavItem href="/signatures" icon={<PenTool size={18} />} label="Registry Guestbook" active={pathname === "/signatures"} />
          <NavItem href="/entries" icon={<Sparkles size={18} />} label="Competition Entries" active={pathname === "/entries"} />
          <NavItem href="/video" icon={<Video size={18} />} label="Intro Video Settings" active={pathname === "/video"} />
          <NavItem href="/polls" icon={<BarChart2 size={18} />} label="Exit Polls Studio" active={pathname === "/polls"} />
          <NavItem href="/confessions" icon={<MessageSquare size={18} />} label="Confessions Desk" active={pathname === "/confessions"} />
          <NavItem href="/teams" icon={<Users size={18} />} label="Team Assignments" active={pathname === "/teams"} />
          <NavItem href="/notifications" icon={<AlertCircle size={18} />} label="Notification Studio" active={pathname === "/notifications"} />
          <NavItem href="/settings" icon={<Settings size={18} />} label="Global Settings" active={pathname === "/settings"} />
        </nav>

        {/* Footer Log Out */}
        <div className="p-6 border-t border-zinc-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-400 transition-colors w-full text-left font-bold text-xs uppercase tracking-widest cursor-pointer"
          >
            <LogOut size={18} />
            <span>Log Out Desk</span>
          </button>
        </div>
      </aside>

      {/* Main Right Area */}
      <main className="flex-1 h-full overflow-y-auto bg-[radial-gradient(circle_at_top,#121212,transparent_60%)] pt-16 lg:pt-0">
        
        {/* Mobile Top Navigation Bar */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0A0A0A]/95 border-b border-zinc-800 backdrop-blur-md flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-amber-500 uppercase">Admin Command</span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {children}
      </main>

    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 border ${
        active 
          ? "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(217,119,6,0.05)]" 
          : "text-zinc-500 border-transparent hover:bg-zinc-900/50 hover:text-zinc-200"
      }`}
    >
      {icon}
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </Link>
  );
}
