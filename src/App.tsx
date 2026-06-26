import React, { useState, useEffect } from 'react';
import { Settings, LogOut, RefreshCw, Mail, Cpu, Globe, Server } from 'lucide-react';
import { BulkMailStats, EmailRecord } from './types';
import AdminLogin from './components/AdminLogin';
import StatsCard from './components/StatsCard';
import SettingsModal from './components/SettingsModal';
import BroadcastForm from './components/BroadcastForm';
import HistoryList from './components/HistoryList';

export default function App() {
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('mern_mailer_admin_token');
  });

  const [stats, setStats] = useState<BulkMailStats>({
    totalSent: 0,
    successRate: 100.0,
    queued: 0,
    failed: 0
  });

  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [sysOnline, setSysOnline] = useState(true);

  // Fetch emails history
  const fetchEmails = async () => {
    setLoadingEmails(true);
    try {
      const res = await fetch('/api/emails');
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
      }
    } catch (err) {
      console.error("Error fetching emails history:", err);
    } finally {
      setLoadingEmails(false);
    }
  };

  // Fetch stats calculations
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error calculating bulk stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleRefreshAll = () => {
    fetchEmails();
    fetchStats();
  };

  // Check login and fetch data
  useEffect(() => {
    if (adminToken) {
      handleRefreshAll();
    }
  }, [adminToken]);

  // Real-time poller when emails are actively sending in the background!
  useEffect(() => {
    if (!adminToken) return;

    const hasActiveSending = emails.some(e => e.status === 'SENDING');
    if (!hasActiveSending) return;

    console.log("Active bulk sending detected. Starting real-time state poller...");
    const interval = setInterval(() => {
      fetchEmails();
      fetchStats();
    }, 2500);

    return () => clearInterval(interval);
  }, [emails, adminToken]);

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('mern_mailer_admin_token', token);
    setAdminToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('mern_mailer_admin_token');
    setAdminToken(null);
  };

  // Lockscreen bypass if not authenticated
  if (!adminToken) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans flex flex-col p-4 md:p-6 overflow-x-hidden relative selection:bg-indigo-500/30">
      
      {/* Decorative Radial Grid Ambient Backgrounds - Premium aesthetic */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header bar section */}
      <header className="flex flex-wrap justify-between items-center gap-4 mb-6 max-w-7xl mx-auto w-full border-b border-zinc-900 pb-5 z-10">
        
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:scale-105 transition-transform cursor-pointer">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white font-bold text-lg tracking-tight font-display">MERN Mailer <span className="text-indigo-400 font-normal">Pro</span></h1>
              <span className="text-[10px] bg-zinc-900 text-indigo-400/80 px-2 py-0.5 rounded border border-zinc-800 font-mono font-bold">
                BENTO GRID
              </span>
            </div>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">Bulk Communication Engine</p>
          </div>
        </div>

        {/* Right admin metadata & controls */}
        <div className="flex items-center gap-3.5">
          {/* Online system banner */}
          <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-850 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] font-mono text-zinc-400">SMTP Deliveries Active</span>
          </div>

          {/* Configuration button */}
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded-xl text-zinc-400 hover:text-indigo-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Open Configurations"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Configure Delivery</span>
          </button>

          {/* Quick refresh button */}
          <button
            onClick={handleRefreshAll}
            disabled={loadingEmails || loadingStats}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded-xl text-zinc-400 hover:text-white hover:scale-105 active:scale-95 transition-all"
            title="Refresh Databases"
          >
            <RefreshCw className={`w-4 h-4 ${(loadingEmails || loadingStats) ? 'animate-spin' : ''}`} />
          </button>

          {/* Separation pipe */}
          <span className="h-6 w-px bg-zinc-800" />

          {/* Profile metadata */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold font-mono">
              AD
            </div>
            <div className="hidden md:block">
              <span className="text-xs font-semibold text-white block">System Admin</span>
              <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-tighter">Level 1 Authority</span>
            </div>
          </div>

          {/* Logout Trigger */}
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-rose-500/10 rounded-xl text-zinc-500 hover:text-rose-400 transition-colors"
            title="Exit System Console"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </header>

      {/* Main Grid Layout */}
      <main className="max-w-7xl mx-auto w-full flex-grow flex flex-col gap-5 z-10">
        
        {/* Top Row: Stats indicators */}
        <StatsCard 
          stats={stats} 
          loading={loadingStats} 
          onRefresh={handleRefreshAll} 
        />

        {/* Bottom Bento Row: Form + History side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-grow">
          
          {/* New Broadcast Composition */}
          <BroadcastForm 
            onDispatchSuccess={handleRefreshAll} 
            adminEmail="admin@mernmailer.internal" 
          />

          {/* Historic emails list */}
          <HistoryList 
            emails={emails} 
            loading={loadingEmails} 
            onRefresh={handleRefreshAll} 
          />

        </div>

      </main>

      {/* System Footer Info */}
      <footer className="max-w-7xl mx-auto w-full text-center mt-10 border-t border-zinc-900 pt-5 pb-2 text-[10px] text-zinc-650 font-mono flex flex-wrap justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-zinc-500" />
          <span>MERN Mailer Pro Communication Engine v1.2.0</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span>PORT: 3000 // HOST: 0.0.0.0</span>
          </div>
          <span>PERSISTENCE: LOCAL MOCK ATLAS DB</span>
        </div>
      </footer>

      {/* System Settings dialog */}
      <SettingsModal 
        isOpen={settingsModalOpen} 
        onClose={() => setSettingsModalOpen(false)} 
        onSaveSuccess={handleRefreshAll} 
      />

    </div>
  );
}
