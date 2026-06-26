import React, { useState } from 'react';
import { History, Trash2, Clock, Check, AlertTriangle, Eye, RefreshCcw, ExternalLink } from 'lucide-react';
import { EmailRecord } from '../types';

interface HistoryListProps {
  emails: EmailRecord[];
  loading: boolean;
  onRefresh: () => void;
}

export default function HistoryList({ emails, loading, onRefresh }: HistoryListProps) {
  const [selectedMail, setSelectedMail] = useState<EmailRecord | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this broadcast history record from MongoDB?")) {
      return;
    }

    try {
      const response = await fetch(`/api/emails/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        if (selectedMail?.id === id) {
          setSelectedMail(null);
        }
        onRefresh();
      }
    } catch (err) {
      console.error("Error deleting email history:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'text-zinc-400 bg-zinc-950 border-zinc-800';
      case 'SENDING':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse';
      case 'COMPLETED':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'FAILED':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-zinc-500 bg-zinc-900 border-zinc-850';
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return 'yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div id="history-sidebar" className="col-span-12 lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between">
      
      {/* Title block */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2 font-display">
            <History className="w-5 h-5 text-indigo-500" />
            Mailer History
          </h2>
          <button 
            type="button"
            onClick={onRefresh}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-indigo-400 transition-colors"
            title="Refresh History"
            disabled={loading}
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* History List */}
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {loading && emails.length === 0 && (
            <div className="py-8 text-center text-zinc-600 text-xs">
              Loading historic MongoDB records...
            </div>
          )}

          {!loading && emails.length === 0 && (
            <div className="py-8 text-center border border-dashed border-zinc-800 rounded-2xl p-5">
              <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">No historic dispatches</p>
              <p className="text-[10px] text-zinc-650 mt-1">Sent bulk emails and draft emails will be logged here.</p>
            </div>
          )}

          {emails.map((mail) => (
            <div
              key={mail.id}
              onClick={() => setSelectedMail(mail)}
              className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-850 hover:border-indigo-500/40 cursor-pointer group transition-all duration-200 hover:shadow-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${getStatusColor(mail.status)}`}>
                  {mail.status}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {formatRelativeTime(mail.sentAt)}
                </span>
              </div>
              <h3 className="text-xs text-white font-medium truncate group-hover:text-indigo-300 transition-colors">
                {mail.subject}
              </h3>
              
              <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-zinc-850/60 text-[10px] text-zinc-500 font-mono">
                <span>
                  Recipients: <strong className="text-zinc-400">{mail.recipients.length}</strong>
                </span>
                <button
                  type="button"
                  onClick={(e) => handleDelete(mail.id, e)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400 text-zinc-600 transition-all"
                  title="Delete from history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress tracker & database indicator at bottom of list */}
      <div className="mt-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-2 uppercase font-bold tracking-tight">
          <span>MongoDB Cache synchronization</span>
          <span className="text-emerald-500 font-mono">CONNECTED</span>
        </div>
        <div className="w-full bg-zinc-950 border border-zinc-850 h-2.5 rounded-full p-0.5 overflow-hidden">
          <div className="w-full bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full" />
        </div>
      </div>

      {/* Detail overlay Modal */}
      {selectedMail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.9)] flex flex-col max-h-[85vh]">
            
            {/* Header bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/40">
              <div className="flex items-center gap-2.5">
                <span className={`text-[9px] font-bold font-mono px-2.5 py-1 rounded border ${getStatusColor(selectedMail.status)}`}>
                  {selectedMail.status}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  Saved {new Date(selectedMail.sentAt).toLocaleString()}
                </span>
              </div>
              <button 
                onClick={() => setSelectedMail(null)}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
              >
                Close Report
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Info grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl font-mono text-center">
                  <span className="text-[10px] uppercase text-zinc-500 block font-bold">Successfully Dispatched</span>
                  <span className="text-2xl text-emerald-400 font-bold block mt-1">{selectedMail.successCount}</span>
                </div>
                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl font-mono text-center">
                  <span className="text-[10px] uppercase text-zinc-500 block font-bold">Delivery Bounced/Failed</span>
                  <span className="text-2xl text-rose-500 font-bold block mt-1">{selectedMail.failedCount}</span>
                </div>
                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl font-mono text-center flex flex-col justify-center items-center">
                  <span className="text-[10px] uppercase text-zinc-500 block font-bold">Delivery Host Service</span>
                  <span className="text-xs text-indigo-400 font-semibold mt-2.5 truncate max-w-full">
                    {selectedMail.smtpHost || "smtp.ethereal.email"}
                  </span>
                </div>
              </div>

              {/* Subject block */}
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Subject Line</span>
                <div className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm font-medium text-white">
                  {selectedMail.subject}
                </div>
              </div>

              {/* Sandboxed browser mail viewer - very premium! */}
              {selectedMail.previewUrl && (
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex flex-wrap justify-between items-center gap-3 animate-pulse">
                  <div>
                    <h4 className="text-xs font-bold text-white">📧 Sandbox Mail Dispatch Viewer Available</h4>
                    <p className="text-[11px] text-indigo-300 mt-0.5">Nodemailer captured SMTP delivery records and loaded a temporary test viewer inbox!</p>
                  </div>
                  <a
                    href={selectedMail.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/15"
                  >
                    View Test Dispatch
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Split layout: Recipient list logs vs Visual Email Render */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
                
                {/* Visual Preview */}
                <div className="lg:col-span-7 space-y-1.5">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Visual Render Preview</span>
                  <div className="bg-zinc-950 border border-zinc-850 rounded-2xl h-80 overflow-hidden p-1">
                    <iframe
                      title="Historic mail render"
                      srcDoc={selectedMail.body}
                      className="w-full h-full border-none rounded-xl"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>

                {/* Recipient Logs tracker */}
                <div className="lg:col-span-5 space-y-1.5 flex flex-col h-full">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">SMTP Dispatch logs</span>
                  <div className="flex-grow bg-zinc-950 border border-zinc-850 rounded-2xl p-4 overflow-y-auto h-80 space-y-2.5">
                    {selectedMail.logs.length === 0 ? (
                      <div className="text-center text-zinc-600 text-xs py-10 font-mono">
                        NO DISPATCH LOGS YET // DRAFT STATUS
                      </div>
                    ) : (
                      selectedMail.logs.map((log, idx) => (
                        <div key={idx} className="p-2.5 bg-zinc-900 border border-zinc-850/80 rounded-xl flex items-start gap-2.5">
                          {log.status === 'SUCCESS' ? (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0 flex-1 font-mono text-[10px]">
                            <p className="text-zinc-300 truncate font-semibold">{log.email}</p>
                            <p className={`mt-0.5 font-bold ${log.status === 'SUCCESS' ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                              {log.status === 'SUCCESS' ? 'SMTP DELIVERY DELIVERED' : 'BOUNCED / FAIL'}
                            </p>
                            {log.error && (
                              <p className="text-rose-400/80 mt-1 italic break-words bg-rose-500/5 p-1 border border-rose-500/10 rounded">
                                Error: {log.error}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
