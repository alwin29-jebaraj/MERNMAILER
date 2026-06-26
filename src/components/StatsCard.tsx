import React from 'react';
import { Send, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { BulkMailStats } from '../types';

interface StatsCardProps {
  stats: BulkMailStats;
  loading: boolean;
  onRefresh: () => void;
}

export default function StatsCard({ stats, loading, onRefresh }: StatsCardProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* Total Sent Stat Box */}
      <div id="stat-total-sent" className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-zinc-700 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Total Dispatched</p>
            <p className="text-3xl font-mono font-semibold text-indigo-400 mt-2">
              {stats.totalSent.toLocaleString()}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Send className="w-4 h-4" />
          </div>
        </div>
        <p className="text-[10px] text-zinc-500 mt-3 font-mono">Delivered to unique inboxes</p>
      </div>

      {/* Success Rate Stat Box */}
      <div id="stat-success-rate" className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-zinc-700 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Success Rate</p>
            <p className="text-3xl font-mono font-semibold text-emerald-400 mt-2">
              {stats.successRate}%
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="w-full bg-zinc-800/60 h-1 rounded-full mt-3 overflow-hidden">
          <div 
            className="bg-emerald-500 h-full transition-all duration-1000" 
            style={{ width: `${Math.min(stats.successRate, 100)}%` }} 
          />
        </div>
      </div>

      {/* Queued Sends Stat Box */}
      <div id="stat-queued" className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-zinc-700 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Active Dispatch</p>
            <p className="text-3xl font-mono font-semibold text-amber-400 mt-2">
              {stats.queued}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 relative">
            <RefreshCw className={`w-4 h-4 ${stats.queued > 0 ? 'animate-spin' : ''}`} />
          </div>
        </div>
        <p className="text-[10px] text-zinc-500 mt-3 font-mono">Emails in active thread queue</p>
      </div>

      {/* Failed Sends Stat Box */}
      <div id="stat-failed" className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-zinc-700 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Bounced / Failed</p>
            <p className="text-3xl font-mono font-semibold text-rose-500 mt-2">
              {stats.failed}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <p className="text-[10px] text-zinc-500 mt-3 font-mono">Rejected by receiving SMTP hosts</p>
      </div>
    </div>
  );
}
